import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Auth middleware supporting both API key and JWT Bearer token authentication.
 *
 * API Key: Pass via `x-api-key` header. Validated against the API_KEY env var.
 * JWT: Pass via `Authorization: Bearer <token>` header. Validated against JWT_SECRET env var.
 *
 * When AUTH_ENABLED env var is not set or is "false", all requests are allowed through
 * (development mode). Set AUTH_ENABLED=true in production.
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip auth if not enabled (development mode)
  const authEnabled = process.env.AUTH_ENABLED === "true";
  if (!authEnabled) {
    return next();
  }

  // Try API key authentication first
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey) {
    const validApiKey = process.env.API_KEY;
    if (!validApiKey) {
      console.error("[Auth] API_KEY environment variable is not set but AUTH_ENABLED is true");
      return res.status(500).json({
        success: false,
        error: "Server authentication is misconfigured",
        code: "AUTH_CONFIG_ERROR",
      });
    }

    // Use timing-safe comparison to prevent timing attacks
    if (
      apiKey.length === validApiKey.length &&
      crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(validApiKey))
    ) {
      return next();
    }

    return res.status(401).json({
      success: false,
      error: "Invalid API key",
      code: "INVALID_API_KEY",
    });
  }

  // Try JWT Bearer token authentication
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("[Auth] JWT_SECRET environment variable is not set but AUTH_ENABLED is true");
      return res.status(500).json({
        success: false,
        error: "Server authentication is misconfigured",
        code: "AUTH_CONFIG_ERROR",
      });
    }

    try {
      const payload = verifyJwt(token, jwtSecret);
      // Attach decoded user info to request for downstream handlers
      (req as any).user = payload;
      return next();
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: err.message || "Invalid token",
        code: "INVALID_TOKEN",
      });
    }
  }

  // No authentication credentials provided
  return res.status(401).json({
    success: false,
    error: "Authentication required. Provide an API key via x-api-key header or a Bearer token via Authorization header.",
    code: "AUTH_REQUIRED",
  });
}

/**
 * Verify a JWT token using HMAC SHA-256.
 * Lightweight implementation without external dependencies.
 * Checks signature validity and token expiration.
 */
function verifyJwt(
  token: string,
  secret: string
): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed token");
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Verify signature using HMAC SHA-256
  const data = `${headerB64}.${payloadB64}`;
  const expectedSignature = base64UrlEncode(
    crypto.createHmac("sha256", secret).update(data).digest()
  );

  if (
    signatureB64.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signatureB64),
      Buffer.from(expectedSignature)
    )
  ) {
    throw new Error("Invalid token signature");
  }

  // Decode and parse payload
  const payload = JSON.parse(
    Buffer.from(payloadB64, "base64url").toString("utf8")
  );

  // Check expiration
  if (payload.exp && typeof payload.exp === "number") {
    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp) {
      throw new Error("Token has expired");
    }
  }

  return payload;
}

/**
 * Encode a Buffer as a base64url string (no padding).
 */
function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
