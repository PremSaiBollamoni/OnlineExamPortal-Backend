import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'cutm-exam-portal-secret-key-2024';

const generateToken = (userId: string) => {
  console.log('\n=== Token Generation Debug ===');
  console.log('Generating token for userId:', userId);
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '30d',
  });
  console.log('Token generated successfully');
  return token;
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
    console.log('\n=== Login Attempt Debug ===');
    console.log('Request headers:', {
      origin: req.headers.origin,
      'content-type': req.headers['content-type'],
      cookie: req.headers.cookie,
      authorization: req.headers.authorization
    });
    console.log('Request body:', { ...req.body, password: '[HIDDEN]' });

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    console.log('User lookup result:', user ? {
      _id: user._id,
      email: user.email,
      role: user.role,
      found: true
    } : 'User not found');

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
      secure: true, // Always use secure cookies
      sameSite: 'none' as const, // Required for cross-origin
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    };
    console.log('Cookie options:', cookieOptions);

    // Set cookie and prepare response
    res.cookie('token', token, cookieOptions);
    
    console.log('Response headers before send:', res.getHeaders());
    
    const response = {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
    
    console.log('Sending response:', { ...response, token: '[HIDDEN]' });
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('\n=== Login Error Debug ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({ message: 'Server error during login' });
  }
}; 
