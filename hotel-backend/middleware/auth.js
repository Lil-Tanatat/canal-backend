const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No token' });

  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...allowed) {
  const roles = allowed.flat();
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: `ต้องการ role: ${roles.join(' หรือ ')}` });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };