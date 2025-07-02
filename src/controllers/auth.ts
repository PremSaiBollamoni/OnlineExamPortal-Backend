import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'cutm-exam-portal-secret-key-2024';

// Custom logging function
const log = (message: string) => {
  const timestamp = new Date().toISOString();
  process.stdout.write(`[${timestamp}] ${message}\n`);
};

const generateToken = (userId: string) => {
  log(`Generating token for user: ${userId}`);
  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '30d',
  });
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
    log(`
==================================
LOGIN ATTEMPT
User: ${req.body.email}
Origin: ${req.headers.origin}
Cookies Present: ${!!req.headers.cookie}
==================================
`);

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      log('Login failed: Missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      log('Login failed: User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    log(`User found: ${user.email}`);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      log('Login failed: Invalid password');
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    log('Password verified successfully');

    // Generate token
    const token = generateToken(user._id);
    log('Token generated successfully');

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/'
    };
    log(`Cookie options: ${JSON.stringify(cookieOptions, null, 2)}`);

    // Set cookie and send response
    res.cookie('token', token, cookieOptions);
    log('Cookie set successfully');
    
    log(`Response headers: ${JSON.stringify(res.getHeaders(), null, 2)}`);
    
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
    log(`
==================================
LOGIN ERROR
${error instanceof Error ? error.stack : 'No stack trace available'}
==================================
`);
    return res.status(500).json({ message: 'Server error during login' });
  }
}; 
