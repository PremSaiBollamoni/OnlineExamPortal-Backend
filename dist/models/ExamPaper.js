"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const questionSchema = new mongoose_1.default.Schema({
    question: {
        type: String,
        required: [true, 'Please provide question'],
    },
    options: {
        type: [String],
        required: [true, 'Please provide options'],
        validate: [(val) => val.length === 4, 'Must provide exactly 4 options'],
    },
    correctAnswer: {
        type: String,
        required: [true, 'Please provide correct answer'],
    },
    marks: {
        type: Number,
        required: [true, 'Please provide marks'],
        min: 1,
    },
});
const examPaperSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: [true, 'Please provide title'],
        minlength: 3,
        maxlength: 100,
    },
    subject: {
        type: String,
        required: [true, 'Please provide subject'],
    },
    duration: {
        type: Number,
        required: [true, 'Please provide duration in minutes'],
        min: 1,
    },
    totalMarks: {
        type: Number,
        required: [true, 'Please provide total marks'],
        min: 1,
    },
    questions: {
        type: [questionSchema],
        required: [true, 'Please provide questions'],
        validate: [(val) => val.length > 0, 'Must provide at least one question'],
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide creator'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
exports.default = mongoose_1.default.model('ExamPaper', examPaperSchema);
