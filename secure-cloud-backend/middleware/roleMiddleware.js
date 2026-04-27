// middleware/roleMiddleware.js
const Role = require('../models/Role');

module.exports = (permission) => {
  return async (req, res, next) => {
    try {
      const roles = req.user.roles || [];

      for (const role of roles) {
        if (typeof role === 'object' && role !== null) {
          if (role.name === 'admin') {
            return next();
          }

          if (role[permission] === true) {
            return next();
          }
        }

        if (typeof role === 'string') {
          if (role === 'admin') {
            return next();
          }

          if (role === 'user' && (permission === 'upload' || permission === 'download')) {
            return next();
          }

          const matchedRole = await Role.findOne({ name: role.toLowerCase() }).lean();
          if (matchedRole && matchedRole[permission] === true) {
            return next();
          }
        }
      }

      return res.status(403).json({ message: `❌ Access denied: Missing ${permission} permission` });
    } catch (err) {
      console.error("❌ RBAC middleware error:", err.message);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
};