const { verifyAccessToken } = require('../utils/tokens');

function optionalAuth(req, res, next) {
  const h = req.headers.authorization;
  const token = h && h.startsWith('Bearer ') ? h.slice(7) : null;
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      req.user = null;
    }
  }
  next();
}

module.exports = { optionalAuth };
