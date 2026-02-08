/**
 * Auth Middleware (Placeholder)
 * ============================
 * This is a placeholder for authentication.
 * The skeleton ships WITHOUT auth so you can get started fast.
 *
 * LLM BUILDERS: Implement authentication here!
 *
 * Common approaches:
 *
 * 1. JWT Authentication:
 *    - Add jsonwebtoken package: npm install jsonwebtoken
 *    - Extract token from Authorization header
 *    - Verify and decode the token
 *    - Attach user info to req.user
 *
 * 2. Session-based Auth:
 *    - Add express-session package
 *    - Use passport.js for strategies
 *
 * 3. API Key Auth:
 *    - Check for X-API-Key header
 *    - Validate against stored keys
 *
 * 4. CAC/PIV Authentication (DoD):
 *    - Configure TLS client certificate validation
 *    - Extract user info from certificate DN
 *
 * Once implemented, apply this middleware to routes:
 *   router.get("/protected", authMiddleware, handler);
 */

import { Request, Response, NextFunction } from "express";

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
 * Auth middleware — currently a pass-through.
 * Replace the body of this function with your auth logic.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement authentication
  //
  // Example JWT implementation:
  //
  // const token = req.headers.authorization?.replace('Bearer ', '');
  // if (!token) {
  //   return res.status(401).json({ success: false, error: 'No token provided' });
  // }
  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  //   req.user = decoded as Express.Request['user'];
  //   next();
  // } catch (err) {
  //   return res.status(401).json({ success: false, error: 'Invalid token' });
  // }

  // Pass-through for now
  next();
}

/**
 * Optional: Role-based authorization
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
