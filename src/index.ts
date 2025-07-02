import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { createServer } from 'http';
import fileUpload from 'express-fileupload';
import * as path from 'path';
import * as os from 'os';
import dotenv from 'dotenv';

import connectDB from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import examPaperRoutes from './routes/examPaper';
import submissionRoutes from './routes/submission';
import resultRoutes from './routes/result';
import activityRoutes from './routes/activity';
import subjectRoutes from './routes/subject';

// Load env vars
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Debug logging middleware - Must be first!
app.use((req, res, next) => {
  console.log('\n=== New Request Debug Log ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Details:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    host: req.headers.host,
    referer: req.headers.referer,
    'user-agent': req.headers['user-agent']
  });
  console.log('Request Headers:', req.headers);
  
  // Log request body for non-GET requests
  if (req.method !== 'GET') {
    console.log('Request Body:', req.body);
  }

  // Track response
  const oldJson = res.json;
  res.json = function(body) {
    console.log('Response Body:', body);
    return oldJson.call(this, body);
  };

  // Log when response finishes
  res.on('finish', () => {
    console.log('\n=== Response Debug Log ===');
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', res.getHeaders());
    console.log('=== End Debug Log ===\n');
  });

  next();
});

// CORS Configuration with debug logging
const corsOptions = {
  origin: function (origin: any, callback: any) {
    console.log('\n=== CORS Debug ===');
    console.log('Request Origin:', origin);
    
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
      'https://cutmap.netlify.app',
      ...(process.env.NODE_ENV !== 'production' ? [
        'http://localhost:8080',
        'http://localhost:5173',
        'http://localhost:3000'
      ] : [])
    ].filter(Boolean);

    console.log('Configured Origins:', {
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      FRONTEND_URL: process.env.FRONTEND_URL,
      NODE_ENV: process.env.NODE_ENV,
      allowedOrigins
    });

    if (!origin) {
      console.log('No origin provided - allowing request');
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      console.log('Origin is allowed:', origin);
      callback(null, true);
      return;
    }

    console.log('Origin not allowed:', origin);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Additional headers middleware with debug
app.use((req, res, next) => {
  console.log('\n=== Headers Middleware Debug ===');
  const origin = req.headers.origin;
  console.log('Setting headers for origin:', origin);

  if (origin && corsOptions.origin) {
    (corsOptions.origin as Function)(origin, (error: Error | null, allowed: boolean) => {
      if (allowed) {
        console.log('Setting CORS headers for allowed origin');
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
        console.log('Headers set:', res.getHeaders());
      } else {
        console.log('Origin not allowed, no headers set');
      }
    });
  } else {
    console.log('No origin or corsOptions.origin not configured');
  }
  next();
});

// Handle preflight requests with debug
app.options('*', (req, res) => {
  console.log('\n=== OPTIONS Request Debug ===');
  console.log('Handling OPTIONS request for path:', req.path);
  console.log('Request headers:', req.headers);
  res.status(200).end();
  console.log('OPTIONS request handled - sent 200 response');
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Configure Socket.IO with debug logging
const io = new Server(httpServer, {
  cors: {
    origin: corsOptions.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie']
  }
});

// Configure express-fileupload
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: path.join(os.tmpdir(), 'uploads'),
  debug: true,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  },
  safeFileNames: true,
  preserveExtension: true,
  createParentPath: true,
  parseNested: true,
  uploadTimeout: 0,
  abortOnLimit: true,
  responseOnLimit: "File size limit has been reached",
  uriDecodeFileNames: true,
  defCharset: 'utf8',
  defParamCharset: 'utf8'
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', req.headers);
  next();
});

// Add response logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(...args) {
    console.log('\n=== Outgoing Response ===');
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.getHeaders());
    return originalSend.apply(res, args);
  };
  next();
});

// Connect to MongoDB
connectDB();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Make io accessible to our routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exam-papers', examPaperRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/activities', activityRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
