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

// Simple request logger
app.use((req, res, next) => {
  console.log('\n🔍 REQUEST:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    origin: req.headers.origin || 'no origin',
    host: req.headers.host,
  });
  next();
});

// CORS Configuration
const corsOptions = {
  origin: function (origin: any, callback: any) {
    console.log('👉 Checking CORS for origin:', origin);
    
    const allowedOrigins = [
      'https://cutmap.netlify.app',
      'http://localhost:8080',
      'http://localhost:5173'
    ];

    console.log('✅ Allowed origins:', allowedOrigins);

    if (!origin || allowedOrigins.includes(origin)) {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ Origin rejected:', origin);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
};

// Apply CORS
app.use(cors(corsOptions));

// Response logger
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(...args) {
    console.log('\n📤 RESPONSE:', {
      status: res.statusCode,
      headers: res.getHeaders(),
    });
    return originalSend.apply(res, args);
  };
  next();
});

// Handle OPTIONS requests
app.options('*', (req, res) => {
  console.log('👉 OPTIONS request received');
  console.log('Headers:', req.headers);
  res.status(200).end();
  console.log('✅ OPTIONS request handled');
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: corsOptions
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
  console.error('❌ ERROR:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log('📝 Environment:', process.env.NODE_ENV);
  console.log('🌐 Frontend URL:', process.env.FRONTEND_URL);
}); 
