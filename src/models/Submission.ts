import mongoose from 'mongoose';

interface IAnswer {
  questionIndex: number;
  selectedOption: string;
  marks?: number;
  comment?: string;
}

export interface ISubmission {
  student: mongoose.Types.ObjectId;
  examPaper: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number | null;
  startTime: Date;
  endTime: Date;
  isSubmitted: boolean;
  evaluatedAt: Date | null;
  evaluatedBy: mongoose.Types.ObjectId | null;
  status: 'pending' | 'evaluated' | 'submitted_to_admin' | 'published';
  submittedToAdminAt: Date | null;
  publishedAt: Date | null;
}

const submissionSchema = new mongoose.Schema<ISubmission>({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examPaper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamPaper',
    required: true
  },
  answers: [{
    questionIndex: Number,
    selectedOption: String,
    marks: {
      type: Number,
      default: null
    },
    comment: {
      type: String,
      default: null
    }
  }],
  score: {
    type: Number,
    default: null
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  isSubmitted: {
    type: Boolean,
    default: false
  },
  evaluatedAt: {
    type: Date,
    default: null
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'evaluated', 'submitted_to_admin', 'published'],
    default: 'pending'
  },
  submittedToAdminAt: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model<ISubmission>('Submission', submissionSchema); 