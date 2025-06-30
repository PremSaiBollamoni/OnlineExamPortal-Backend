import { Response } from 'express';
import Activity from '../models/Activity';
import { AuthRequest } from '../types';

// Get recent activities
export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'name');

    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities' });
  }
};

// Create activity
export const createActivity = async (
  user: string,
  action: string,
  type: 'user' | 'paper' | 'result',
  details?: string
) => {
  try {
    const activity = await Activity.create({
      user,
      action,
      type,
      details
    });

    const populatedActivity = await activity.populate('user', 'name');
    
    // We'll handle socket emissions at the route level where we have access to req.app
    return activity;
  } catch (error) {
    console.error('Error creating activity:', error);
    return null;
  }
}; 