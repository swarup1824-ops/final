// ShikshaShare Server & Backend Application
// Community Engagement Platform (CEP) Initiative
// "Connecting Students, Resources & Community"

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const requestRoutes = require('./routes/requestRoutes');
const donationRoutes = require('./routes/donationRoutes');
const communityRoutes = require('./routes/communityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// Middleware Configuration
// ==========================================
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure uploads directory exists and is explicitly served
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve existing frontend assets directly
app.use(express.static(__dirname));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });
}

// ==========================================
// API Routes
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// API Health Check & Discovery Endpoint
app.get('/api', (req, res) => {
  res.json({
    platform: 'ShikshaShare CEP API',
    tagline: 'Connecting Students, Resources & Community',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      resources: '/api/resources',
      requests: '/api/requests',
      donations: '/api/donations',
      community: '/api/community',
      admin: '/api/admin'
    }
  });
});

// Fallback for API 404
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.path}' not found.`
  });
});

// Default fallback to index.html for Single Page Application navigation
app.get('*', (req, res) => {
  // Never return index.html for static files (css, js, images, etc.) to prevent MIME type errors
  if (path.extname(req.path)) {
    return res.status(404).type('text/plain').send(`Static asset not found: ${req.path}`);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// Global Error Handler
// ==========================================
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

// ==========================================
// Server Start
// ==========================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`  ShikshaShare Server is running on port ${PORT}`);
    console.log(`  Local URL:   http://localhost:${PORT}`);
    console.log(`  API Base:    http://localhost:${PORT}/api`);
    console.log(`  Database:    JSON DB at ./database/db.json`);
    console.log('====================================================');
  });
}

module.exports = app;
