import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

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
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log('Found user:', user ? { ...user.toObject(), password: '[HIDDEN]' } : null);

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    console.log('Password check result:', isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.log('Password incorrect');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
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
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
}; 