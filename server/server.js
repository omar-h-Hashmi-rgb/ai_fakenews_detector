import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { MongoClient } from 'mongodb';
import analyzeRouter from './routes/analyze.js';
import feedbackRouter from './routes/feedback.js';
import historyRouter from './routes/history.js';
import trendingRouter from './routes/trending.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, 'https://ai-fake-news-detector.vercel.app']
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
let db;
const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');

    // Create indexes
    await db.collection('predictions').createIndex({ timestamp: -1 });
    await db.collection('feedback').createIndex({ timestamp: -1 });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Running without database - some features may not work');
  }
};

// Make db available to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// API routes
app.use('/api/analyze', analyzeRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/history', historyRouter);
app.use('/api/trending', trendingRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
  });
};

startServer().catch(console.error);