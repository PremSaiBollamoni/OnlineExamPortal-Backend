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
import jwt from 'jsonwebtoken';

// Custom logger function
const log = (...args: any[]) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
};

// Load env vars
dotenv.config();

log('Starting server...');
log('Environment:', process.env.NODE_ENV);
log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
log('JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
log('Cookie Secret:', process.env.COOKIE_SECRET ? 'Set' : 'Not set');

const app = express();
const httpServer = createServer(app);

// CORS configuration
const allowedOrigins = ['https://cutmap.netlify.app'];
log('Allowed CORS origins:', allowedOrigins);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    log('Incoming request origin:', origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins[0],
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Add authentication middleware to Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
  log('Socket auth token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      log('Socket invalid token');
      return next(new Error('Invalid token'));
    }
    socket.data.userId = decoded.userId;
    log('Socket authenticated for user:', decoded.userId);
    next();
  } catch (error) {
    log('Socket auth error:', error);
    next(new Error('Authentication error'));
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
  log('\n=== Incoming Request ===');
  log('Method:', req.method);
  log('URL:', req.url);
  log('Origin:', req.headers.origin);
  log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Add response logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(...args) {
    log('\n=== Outgoing Response ===');
    log('Status:', res.statusCode);
    log('Headers:', JSON.stringify(res.getHeaders(), null, 2));
    return originalSend.apply(res, args);
  };
  next();
});

// Connect to MongoDB
import connectDB from './config/database';
connectDB();

// Socket.io connection handling
io.on('connection', (socket) => {
  log('Socket connected:', socket.id);
  
  socket.on('disconnect', () => {
    log('Socket disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    log('Socket error:', error);
  });
});

// Make io accessible to our routes
app.set('io', io);

// Add a root route for health check
app.get('/', (req, res) => {
  log('Health check request');
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import examPaperRoutes from './routes/examPaper';
import submissionRoutes from './routes/submission';
import resultRoutes from './routes/result';
import activityRoutes from './routes/activity';
import subjectRoutes from './routes/subject';

log('=== Registering Routes ===');

// API Routes with error handling
const registerRoute = (path: string, router: express.Router) => {
  try {
    log(`Registering route: ${path}`);
    app.use(path, router);
    log(`Successfully registered route: ${path}`);
  } catch (error) {
    log(`Error registering route ${path}:`, error);
    throw error;
  }
};

registerRoute('/api/auth', authRoutes);
registerRoute('/api/users', userRoutes);
registerRoute('/api/subjects', subjectRoutes);
registerRoute('/api/exam-papers', examPaperRoutes);
registerRoute('/api/submissions', submissionRoutes);
registerRoute('/api/results', resultRoutes);
registerRoute('/api/activities', activityRoutes);

log('=== All Routes Registered ===');

// Print registered routes
log('\n=== Registered Routes ===');
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    log('Route:', {
      path: middleware.route.path,
      methods: Object.keys(middleware.route.methods)
    });
  } else if (middleware.name === 'router') {
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        log('Router:', {
          path: handler.route.path,
          methods: Object.keys(handler.route.methods)
        });
      }
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  log('=== Error Handler ===');
  log('Error:', err.stack);
  log('Request URL:', req.url);
  log('Request Method:', req.method);
  log('Request Headers:', JSON.stringify(req.headers, null, 2));
  log('Error Message:', err.message);
  log('Error Name:', err.name);
  log('=== End Error Handler ===');
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Add 404 handler - this must be last
app.use((req: express.Request, res: express.Response) => {
  log('=== 404 Not Found ===');
  log('Request URL:', req.url);
  log('Request Method:', req.method);
  log('Request Headers:', JSON.stringify(req.headers, null, 2));
  log('=== End 404 Not Found ===');
  res.status(404).json({ message: `Cannot ${req.method} ${req.url}` });
});

const PORT = process.env.PORT || 10000;

httpServer.listen(PORT, () => {
  log(`Server is running on port ${PORT}`);
  log('Environment:', process.env.NODE_ENV);
  log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  log('JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  log('Cookie Secret:', process.env.COOKIE_SECRET ? 'Set' : 'Not set');
}); 
