/**
 * Auth Middleware
 * ==============
 * JWT-based authentication middleware.
 *
 * Uses a symmetric HMAC secret (JWT_SECRET env var) to verify tokens
 * passed via the Authorization: Bearer <token> header.
 *
 * When AUTH_ENABLED=true (or in production), all requests through
 * authMiddleware must carry a valid JWT. When AUTH_ENABLED is not set
 * or set to "false", the middleware is permissive: it will decode a
 * token if one is present but will not reject unauthenticated requests.
 * This lets the skeleton work out-of-the-box while still providing a
 * fully wired auth path for production deployments.
 *
 * Token payload shape: { sub: string, email: string, name: string, roles: string[] }
 *
 * Apply to routes:
 *   router.get("/protected", authMiddleware, handler);
 */

import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        roles: string[];
      };
    }
  }
}

/**
 * Minimal JWT verification using Node's built-in crypto module.
 * Supports HS256 (HMAC-SHA256) tokens only — no external dependency needed.
 */
function verifyJwt(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify the signature
  const data = `${headerB64}.${payloadB64}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  if (
    expectedSig.length !== signatureB64.length ||
    !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signatureB64))
  ) {
    return null;
  }

  // Decode the header and verify algorithm
  try {
    const header = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    if (header.alg !== "HS256") return null;
  } catch {
    return null;
  }

  // Decode the payload
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    // Check expiration if present
    if (payload.exp && typeof payload.exp === "number") {
      if (Math.floor(Date.now() / 1000) > payload.exp) {
        return null;
      }
    }

    return payload;
  } catch {
    return null;
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "skeleton-tasks-dev-secret";
const AUTH_ENABLED = process.env.AUTH_ENABLED === "true" || process.env.NODE_ENV === "production";

/**
 * Auth middleware — verifies JWT from the Authorization header.
 *
 * When AUTH_ENABLED is false (default in development), unauthenticated
 * requests are allowed through but a valid token will still be decoded
 * and attached to req.user. When AUTH_ENABLED is true, a valid token
 * is required.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const payload = verifyJwt(token, JWT_SECRET);
    if (payload) {
      req.user = {
        id: (payload.sub as string) || "",
        email: (payload.email as string) || "",
        name: (payload.name as string) || "",
        roles: Array.isArray(payload.roles) ? (payload.roles as string[]) : [],
      };
    } else if (AUTH_ENABLED) {
      res.status(401).json({ success: false, error: "Invalid or expired token" });
      return;
    }
  } else if (AUTH_ENABLED) {
    res.status(401).json({ success: false, error: "No token provided" });
    return;
  }

  next();
}

/**
 * Role-based authorization — must be used after authMiddleware.
 * Usage: router.get("/admin", authMiddleware, requireRole("admin"), handler);
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));
    if (!hasRole) {
      res.status(403).json({ success: false, error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
