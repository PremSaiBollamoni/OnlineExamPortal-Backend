"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const resultSchema = new mongoose_1.default.Schema({
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
    submission: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Submission',
        required: [true, 'Please provide submission'],
    },
    score: {
        type: Number,
        required: [true, 'Please provide score'],
    },
    totalMarks: {
        type: Number,
        required: [true, 'Please provide total marks'],
    },
    percentage: {
        type: Number,
        required: [true, 'Please provide percentage'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
exports.default = mongoose_1.default.model('Result', resultSchema);
