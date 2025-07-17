require('dotenv').config();
const express = require('express');
const cors = require('cors');
const visionRoutes = require('./src/routes/visionRoutes');
const { initializeVisionClient } = require('./src/controllers/visionController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/', visionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/docs',
      'GET /api/test-sample',
      'POST /api/analyze-image',
      'POST /api/analyze-base64',
      'GET /api/test-local-image'
    ]
  });
});

// Start server
async function startServer() {
  try {
    // Initialize Vision client on startup
    await initializeVisionClient();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`🧪 Test Sample: http://localhost:${PORT}/api/test-sample`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
