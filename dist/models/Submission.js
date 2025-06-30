"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const submissionSchema = new mongoose_1.default.Schema({
    student: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide student'],
    },
    examPaper: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'ExamPaper',
        required: [true, 'Please provide exam paper'],
    },
    answers: [{
            questionId: {
                type: String,
                required: [true, 'Please provide question ID'],
            },
            selectedAnswer: {
                type: String,
                required: [true, 'Please provide selected answer'],
            },
        }],
    score: {
        type: Number,
        default: 0,
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    evaluatedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    },
    evaluatedAt: {
        type: Date,
    },
});
exports.default = mongoose_1.default.model('Submission', submissionSchema);
