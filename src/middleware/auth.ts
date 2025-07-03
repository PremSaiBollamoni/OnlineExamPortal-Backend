import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'cutm-exam-portal-secret-key-2024';

// Custom logger function
const log = (...args: any[]) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [auth]`, ...args);
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    log('=== Auth Middleware Start ===');
    log('URL:', req.url);
    log('Method:', req.method);
    log('Headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie
    });

    let token;

    // Check for token in signed cookies first
    if (req.signedCookies && req.signedCookies.token) {
      token = req.signedCookies.token;
      log('Token found in signed cookies');
    }
    // Then check for Bearer token in Authorization header
    else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      log('Token found in Authorization header');
    }

    if (!token) {
      log('No token found');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      log('Verifying token');
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      log('Token verified successfully');

      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        log('User not found');
        return res.status(401).json({ message: 'User not found' });
      }

      log('User authenticated:', {
        id: user._id,
        role: user.role
      });

      req.user = user;
      next();
    } catch (error) {
      log('Token verification failed:', error);
      
      // Clear invalid token
      res.clearCookie('token');
      
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    log('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Role-based authorization middleware
export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    log('=== Role Check ===');
    if (!req.user) {
      log('No user found in request');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    log('Checking role:', {
      required: roles,
      current: req.user.role
    });

    if (!roles.includes(req.user.role)) {
      log('Role check failed');
      return res.status(403).json({
        message: `Not authorized. Required role: ${roles.join(' or ')}, Current role: ${req.user.role}`
      });
    }

    log('Role check passed');
    next();
  };
}; 
