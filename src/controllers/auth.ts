import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const JWT_SECRET = 'cutm-exam-portal-secret-key-2024';

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || JWT_SECRET, {
    expiresIn: '30d',
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
    const user = await User.findOne({ email });
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
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    console.log('Token generated:', token ? 'Yes' : 'No');

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    };
    console.log('Cookie options:', cookieOptions);

    // Set cookie and send response
    res.cookie('token', token, cookieOptions);

    console.log('=== Login Success ===');
    console.log('Response headers to be sent:', res.getHeaders());

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('=== Login Error ===');
    console.error('Error details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}; 
