import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
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

// Enable pre-flight requests for all routes
app.options('*', cors({
  origin: 'https://cutmap.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// CORS middleware for all other requests
app.use(cors({
  origin: 'https://cutmap.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'https://cutmap.netlify.app',
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Origin:', req.headers.origin);
  if (req.files) console.log('Request files:', req.files);
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
app.use('/api/exam-papers', examPaperRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/subjects', subjectRoutes);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
