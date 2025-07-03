import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'cutm-exam-portal-secret-key-2024';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'cutm-exam-portal-cookie-secret-2024';

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '24h',
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
    });

    const token = generateToken(user._id);

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      signed: true
    };

    // Set cookie
    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        semester: user.semester,
        department: user.department,
        school: user.school,
        specialization: user.specialization
      },
      token
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log('\n=== Login Controller Start ===');
    console.log('Request headers:', {
      origin: req.headers.origin,
      'content-type': req.headers['content-type'],
      cookie: req.headers.cookie,
      authorization: req.headers.authorization
    });
    console.log('Request body:', { ...req.body, password: '[HIDDEN]' });

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch ? 'Yes' : 'No');

    if (!isMatch) {
      console.log('Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('Token generated:', token ? 'Yes' : 'No');

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      signed: true,
      domain: process.env.NODE_ENV === 'production' ? '.netlify.app' : undefined
    };
    console.log('Cookie options:', cookieOptions);

    // Clear any existing cookies
    res.clearCookie('token');

    // Set new cookie
    res.cookie('token', token, cookieOptions);

    console.log('=== Login Success ===');
    console.log('Response headers:', res.getHeaders());

    // Send response with user data and token
    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        semester: user.semester,
        department: user.department,
        school: user.school,
        specialization: user.specialization
      },
      token
    });
  } catch (error) {
    console.error('=== Login Error ===');
    console.error('Error details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}; 
