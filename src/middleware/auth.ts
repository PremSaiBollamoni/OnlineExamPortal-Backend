import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'cutm-exam-portal-secret-key-2024';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log('=== Auth Middleware Start ===');
    console.log('Headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie
    });

    let token;

    // Check for token in signed cookies first
    if (req.signedCookies && req.signedCookies.token) {
      token = req.signedCookies.token;
      console.log('Token found in signed cookies');
    }
    // Then check for Bearer token in Authorization header
    else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found in Authorization header');
    }

    if (!token) {
      console.log('No token found');
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      console.log('Token verified successfully');

      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        console.log('User not found');
        return res.status(401).json({ message: 'User not found' });
      }

      console.log('User authenticated:', {
        id: user._id,
        role: user.role
      });

      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      
      // Clear invalid token
      res.clearCookie('token');
      
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Role-based authorization middleware
export const checkRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Not authorized. Required role: ${roles.join(' or ')}, Current role: ${req.user.role}`
      });
    }

    next();
  };
}; 
