const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "pharma-dev-secret-change-in-production";
const JWT_EXPIRY = "8h";

/**
 * Issue a JWT for a wallet address + role.
 */
function issueToken(walletAddress, role) {
  return jwt.sign(
    { walletAddress: walletAddress.toLowerCase(), role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

/**
 * Verify a JWT and return the decoded payload, or null if invalid/expired.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Express middleware: requires a valid Bearer JWT.
 * Attaches { walletAddress, role } to req.user on success.
 * Returns 401 for missing/invalid/expired tokens.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided", code: "NO_TOKEN" });
  }
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token. Please re-authenticate.", code: "INVALID_TOKEN" });
  }
  req.user = { walletAddress: decoded.walletAddress, role: decoded.role };
  next();
}

/**
 * Role guard factory — call after requireAuth.
 * Usage: router.post("/route", requireAuth, roleGuard("Manufacturer"), handler)
 * @param {...string} allowedRoles - One or more role names allowed.
 */
function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated", code: "NOT_AUTH" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        code: "FORBIDDEN"
      });
    }
    next();
  };
}

module.exports = { issueToken, verifyToken, requireAuth, roleGuard, JWT_SECRET, JWT_EXPIRY };
