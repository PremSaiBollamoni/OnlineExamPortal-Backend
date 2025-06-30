import { Request, Response } from 'express';
import User from '../models/User';
import { UploadedFile } from 'express-fileupload';

interface AuthRequest extends Request {
  user?: any;
  files?: any;
}

// Get all users
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password');
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Get single user
export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Create user (admin only)
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, school, department, specialization, semester, studentId, facultyId } = req.body;

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create user with all fields
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      school,
      department,
      specialization,
      semester: semester ? parseInt(semester) : undefined,
      studentId: role === 'student' ? studentId : undefined,
      facultyId: role === 'faculty' ? facultyId : undefined
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
      department: user.department,
      specialization: user.specialization,
      semester: user.semester,
      studentId: user.studentId,
      facultyId: user.facultyId
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    res.status(400).json({ message: error.message });
  }
};

// Bulk create users
export const bulkCreateUsers = async (req: AuthRequest, res: Response) => {
  try {
    let users;

    // Check if the request has a file upload
    if (req.files && req.files.file) {
      const file = req.files.file as UploadedFile;
      console.log('Received file:', {
        name: file.name,
        size: file.size,
        mimetype: file.mimetype,
        encoding: file.encoding,
        tempFilePath: file.tempFilePath
      });

      // Read file content
      try {
        // First try reading from temp file
        const fs = require('fs');
        const fileContent = fs.readFileSync(file.tempFilePath, 'utf8');
        console.log('File size:', fileContent.length);
        console.log('File content preview (first 200 chars):', fileContent.substring(0, 200));
        console.log('File content last 200 chars:', fileContent.substring(fileContent.length - 200));

        // Remove any BOM characters and normalize line endings
        const cleanContent = fileContent
          .replace(/^\uFEFF/, '') // Remove BOM
          .replace(/\r\n/g, '\n') // Normalize line endings
          .trim(); // Remove any leading/trailing whitespace

        console.log('Cleaned content length:', cleanContent.length);

        // Try to parse the JSON
        try {
          users = JSON.parse(cleanContent);
          console.log('Successfully parsed JSON data, found', Array.isArray(users) ? users.length : 'non-array', 'records');
        } catch (parseError: any) {
          console.error('JSON parse error:', parseError);
          return res.status(400).json({
            message: 'Invalid JSON format',
            details: parseError.message,
            preview: cleanContent.substring(0, 200),
            contentLength: cleanContent.length
          });
        }
      } catch (readError: any) {
        console.error('File read error:', readError);
        return res.status(400).json({
          message: 'Error reading file',
          details: readError.message
        });
      }
    } else {
      // If no file, expect users in request body
      users = req.body.users;
    }

    if (!Array.isArray(users)) {
      console.error('Users is not an array:', typeof users);
      return res.status(400).json({
        message: 'Invalid data format. Expected an array of users.',
        received: typeof users
      });
    }

    // Validate user objects
    const invalidUsers = users.filter(user => !user.email || !user.name || !user.password);
    if (invalidUsers.length > 0) {
      return res.status(400).json({
        message: 'Some users are missing required fields (email, name, password)',
        invalidUsers: invalidUsers.map(user => ({
          email: user.email,
          name: user.name,
          hasPassword: !!user.password
        }))
      });
    }

    // Check for duplicate emails in the request
    const emails = users.map(user => user.email);
    const uniqueEmails = new Set(emails);
    if (emails.length !== uniqueEmails.size) {
      const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
      return res.status(400).json({
        message: 'Duplicate emails in request',
        duplicates
      });
    }

    // Check for existing emails in database
    const existingEmails = await User.find({ email: { $in: emails } }).select('email');
    if (existingEmails.length > 0) {
      return res.status(400).json({
        message: 'Some emails already exist',
        emails: existingEmails.map(user => user.email)
      });
    }

    // Create all users
    const createdUsers = await User.create(users.map(user => ({
      ...user,
      semester: user.semester ? parseInt(user.semester.toString()) : undefined,
      studentId: user.role === 'student' ? user.studentId : undefined,
      facultyId: user.role === 'faculty' ? user.facultyId : undefined
    })));

    res.status(201).json({
      message: `Successfully created ${createdUsers.length} users`,
      users: createdUsers.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: user.school,
        department: user.department,
        specialization: user.specialization,
        semester: user.semester,
        studentId: user.studentId,
        facultyId: user.facultyId
      }))
    });
  } catch (error: any) {
    console.error('Bulk create users error:', error);
    res.status(400).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, school, department, specialization, semester } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.school = school || user.school;
    user.department = department || user.department;
    user.specialization = specialization || user.specialization;
    user.semester = semester ? parseInt(semester) : user.semester;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      school: updatedUser.school,
      department: updatedUser.department,
      specialization: updatedUser.specialization,
      semester: updatedUser.semester
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk delete users
export const bulkDeleteUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ message: 'userIds must be an array' });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No users found to delete' });
    }

    res.status(200).json({ 
      message: `Successfully deleted ${result.deletedCount} users`,
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}; 