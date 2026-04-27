const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Decoded JWT:', decoded); // Debug log
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.warn('⚠️ JWT expired at:', err.expiredAt);
      return res.status(401).json({
        message: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('❌ JWT verification failed:', err.message);
    res.status(401).json({
      message: 'Token is not valid',
      code: 'TOKEN_INVALID'
    });
  }
};

module.exports = { authenticateUser };