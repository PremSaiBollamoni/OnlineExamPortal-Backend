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
import connectDB from './config/database';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import examPaperRoutes from './routes/examPaper';
import submissionRoutes from './routes/submission';
import resultRoutes from './routes/result';
import activityRoutes from './routes/activity';
import subjectRoutes from './routes/subject';

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
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      log('CORS blocked origin:', origin);
      // During development, log the blocked origin but still allow it
      callback(null, true);
      // In production, uncomment the following line:
      // callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      log('Socket.IO request origin:', origin);
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        log('Socket.IO CORS blocked origin:', origin);
        // During development, log the blocked origin but still allow it
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
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
connectDB().then(() => {
  log('MongoDB connected successfully');
  
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
      timestamp: new Date().toISOString(),
      routes: app._router.stack
        .filter((r: any) => r.route)
        .map((r: any) => ({
          path: r.route.path,
          methods: Object.keys(r.route.methods)
        }))
    });
  });

  // Test route without auth
  app.get('/test', (req, res) => {
    log('Test route hit');
    res.json({ 
      message: 'Server is working',
      timestamp: new Date().toISOString()
    });
  });

  // Register routes after DB connection
  log('=== Registering Routes ===');
  try {
    // Test routes first
    app.get('/api/test', (req, res) => {
      log('API test route hit');
      res.json({ 
        message: 'API is working',
        timestamp: new Date().toISOString()
      });
    });

    // Register all routes with debug logging
    const routes = [
      { path: '/api/auth', router: authRoutes },
      { path: '/api/users', router: userRoutes },
      { path: '/api/exam-papers', router: examPaperRoutes },
      { path: '/api/submissions', router: submissionRoutes },
      { path: '/api/results', router: resultRoutes },
      { path: '/api/activities', router: activityRoutes },
      { path: '/api/subjects', router: subjectRoutes }
    ];

    routes.forEach(({ path, router }) => {
      try {
        log(`Registering route: ${path}`);
        app.use(path, router);
        log(`Successfully registered route: ${path}`);
        
        // Log available methods for this route
        const stack = (router as any).stack;
        if (stack) {
          const methods = stack.map((layer: any) => {
            return `${layer.route?.path || ''} [${Object.keys(layer.route?.methods || {}).join(', ')}]`;
          }).filter(Boolean);
          log(`Available endpoints for ${path}:`, methods);
        }
      } catch (error) {
        log(`Error registering route ${path}:`, error);
        throw error;
      }
    });

    log('=== Route Registration Complete ===');

    // Add 404 handler - this must be last
    app.use((req: express.Request, res: express.Response) => {
      log('=== 404 Not Found ===');
      log('Request URL:', req.url);
      log('Request Method:', req.method);
      log('Request Headers:', JSON.stringify(req.headers, null, 2));
      log('=== End 404 Not Found ===');
      res.status(404).json({ message: `Cannot ${req.method} ${req.url}` });
    });

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      log('Error middleware:', err);
      res.status(err.status || 500).json({
        error: {
          message: err.message || 'Internal Server Error',
          status: err.status || 500
        }
      });
    });

    // Start server
    const PORT = process.env.PORT || 10000;
    httpServer.listen(PORT, () => {
      log(`Server running on port ${PORT}`);
      log('Environment:', process.env.NODE_ENV);
      log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
      log('JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not set');
      log('Cookie Secret:', process.env.COOKIE_SECRET ? 'Set' : 'Not set');
    });

    // Handle server errors
    httpServer.on('error', (error: Error) => {
      log('Server error:', error);
    });
  } catch (error) {
    log('Fatal error during server setup:', error);
    process.exit(1);
  }
}).catch((error) => {
  log('MongoDB connection error:', error);
  process.exit(1);
});

// Export for testing
export default app; 
