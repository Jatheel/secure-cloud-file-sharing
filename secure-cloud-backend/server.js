const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();
console.log('🔌 .env loaded');

// Connect to MongoDB
connectDB();
console.log('🧠 DB connection function called');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true); // Fallback permissive for local dev
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));

app.use(express.json());
console.log('🚀 Middleware initialized');

// Healthcheck & test route
app.get('/test', (req, res) => {
  res.json({ message: "Server is working ✅", status: "ok", timestamp: new Date().toISOString() });
});

// Mount Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const uploadRoutes = require('./routes/upload');
app.use('/api/upload', uploadRoutes);

const roleRoutes = require('./routes/roles');
app.use('/api/roles', roleRoutes);

const shareRoutes = require('./routes/share');
app.use('/api/share', shareRoutes);

// Audit log route: standard endpoint and alias for compatibility
const auditLogRoutes = require('./routes/auditLog');
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/auditLog', auditLogRoutes);

console.log('📡 Routes mounted');

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ SecureCloud Server running on port ${PORT}`));