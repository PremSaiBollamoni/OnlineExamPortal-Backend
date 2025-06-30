import { Request, Response } from 'express';
import Result from '../models/Result';

interface AuthRequest extends Request {
  user?: any;
}

export const getResults = async (req: AuthRequest, res: Response) => {
  try {
    const results = await Result.find({
      ...(req.user.role === 'student' ? { student: req.user._id } : {}),
    })
      .populate('student', 'name')
      .populate('examPaper', 'title subject')
      .populate('submission');
    res.status(200).json(results);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getResult = async (req: Request, res: Response) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('student', 'name')
      .populate('examPaper')
      .populate('submission');
    if (!result) {
      return res.status(404).json({ message: 'Result not found' });
    }
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getResultStats = async (req: Request, res: Response) => {
  try {
    const stats = await Result.aggregate([
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$score' },
          highestScore: { $max: '$score' },
          lowestScore: { $min: '$score' },
          totalStudents: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(stats[0] || {});
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}; 