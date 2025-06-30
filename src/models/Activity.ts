import mongoose from 'mongoose';

export interface IActivity {
  action: string;
  user: mongoose.Types.ObjectId;
  type: 'user' | 'paper' | 'result';
  details?: string;
  createdAt: Date;
}

const activitySchema = new mongoose.Schema<IActivity>({
  action: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['user', 'paper', 'result'],
    required: true
  },
  details: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IActivity>('Activity', activitySchema); 