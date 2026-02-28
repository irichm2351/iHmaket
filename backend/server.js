const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://ihmaket.com',
  'https://www.ihmaket.com',
  'https://ihmaket-frontend.onrender.com'
];

// Initialize Socket.io for real-time messaging
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Paystack webhook requires raw body for signature verification
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));

// Increase limits for file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev')); // Logging

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Make io accessible to routes
app.set('io', io);

// Debug middleware: Log all requests
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  console.log('   Headers:', {
    'content-type': req.headers['content-type'],
    'authorization': req.headers['authorization'] ? '✓ Present' : '✗ Missing',
    'origin': req.headers['origin'] || 'not specified',
    'user-agent': req.headers['user-agent']
  });
  
  // Log body for upload endpoints
  if (req.url.includes('upload')) {
    console.log('   Upload endpoint detected');
    console.log('   Files:', req.files ? 'Yes' : 'No');
    console.log('   File object:', req.file ? `${req.file.fieldname} (${req.file.size} bytes)` : 'No single file');
  }
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscription', subscriptionRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ServiceHub API is running' });
});

// Cloudinary configuration test route
app.get('/api/cloudinary-check', (req, res) => {
  const cloudinary = require('./config/cloudinary');
  const config = cloudinary.config();
  
  res.json({
    status: 'OK',
    cloudinary: {
      cloud_name: config.cloud_name ? '✅ Set' : '❌ Not set',
      api_key: config.api_key ? '✅ Set' : '❌ Not set',
      api_secret: config.api_secret ? '✅ Set' : '❌ Not set',
    },
    environment: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Not set',
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Not set',
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? '✅ Set (hidden)' : '❌ Not set',
    }
  });
});

// User online status check
app.get('/api/users/:userId/online-status', (req, res) => {
  const { userId } = req.params;
  const isOnline = app.get('onlineUsers').has(userId);
  res.json({ 
    userId,
    isOnline 
  });
});

// Socket.io connection handling
const onlineUsers = new Map();

// Make onlineUsers accessible to routes
app.set('onlineUsers', onlineUsers);

io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // User joins with their ID
  socket.on('user_connected', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected with socket ${socket.id}`);
    
    // Broadcast to all clients that this user is online
    io.emit('user_online', { userId });
  });

  // Handle sending messages
  socket.on('send_message', (data) => {
    const recipientSocketId = onlineUsers.get(data.receiverId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive_message', data);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const recipientSocketId = onlineUsers.get(data.receiverId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user_typing', data);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    let disconnectedUserId = null;
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
    
    // Broadcast to all clients that this user is offline
    if (disconnectedUserId) {
      io.emit('user_offline', { userId: disconnectedUserId });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Keep-alive mechanism to prevent Render from sleeping
// Ping self every 14 minutes (Render free tier sleeps after 15 mins)
const KEEP_ALIVE_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds
let keepAliveInterval;

function startKeepAlive() {
  // Only run in production and if not explicitly disabled
  if (process.env.NODE_ENV === 'production' && process.env.DISABLE_KEEP_ALIVE !== 'true') {
    const axios = require('axios');
    const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.BASE_URL;
    
    if (baseUrl) {
      keepAliveInterval = setInterval(async () => {
        try {
          await axios.get(`${baseUrl}/api/health`);
          console.log(`🏓 Keep-alive ping sent at ${new Date().toISOString()}`);
        } catch (error) {
          console.error('❌ Keep-alive ping failed:', error.message);
        }
      }, KEEP_ALIVE_INTERVAL);
      
      console.log('🔄 Keep-alive mechanism started');
    } else {
      console.warn('⚠️ Keep-alive disabled: RENDER_EXTERNAL_URL or BASE_URL not set');
    }
  }
}

// Cleanup on process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, cleaning up...');
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV}`);
  
  // Start keep-alive after server is running
  startKeepAlive();
});
