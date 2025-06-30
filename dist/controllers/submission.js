"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubmission = exports.getSubmissions = exports.submitExam = void 0;
const Submission_1 = __importDefault(require("../models/Submission"));
const ExamPaper_1 = __importDefault(require("../models/ExamPaper"));
const Result_1 = __importDefault(require("../models/Result"));
const submitExam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { examPaperId, answers } = req.body;
        const examPaper = yield ExamPaper_1.default.findById(examPaperId);
        if (!examPaper) {
            return res.status(404).json({ message: 'Exam paper not found' });
        }
        // Calculate score
        let score = 0;
        answers.forEach((answer) => {
            const question = examPaper.questions.find((q) => q._id.toString() === answer.questionId);
            if (question && question.correctAnswer === answer.selectedAnswer) {
                score += question.marks;
            }
        });
        // Create submission
        const submission = yield Submission_1.default.create({
            student: req.user._id,
            examPaper: examPaperId,
            answers,
            score,
            evaluatedBy: req.user._id,
            evaluatedAt: new Date(),
        });
        // Create result
        yield Result_1.default.create({
            student: req.user._id,
            examPaper: examPaperId,
            submission: submission._id,
            score,
            totalMarks: examPaper.totalMarks,
            percentage: (score / examPaper.totalMarks) * 100,
        });
        res.status(201).json(submission);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.submitExam = submitExam;
const getSubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const submissions = yield Submission_1.default.find(Object.assign({}, (req.user.role === 'student' ? { student: req.user._id } : {})))
            .populate('student', 'name')
            .populate('examPaper', 'title subject')
            .populate('evaluatedBy', 'name');
        res.status(200).json(submissions);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.getSubmissions = getSubmissions;
const getSubmission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const submission = yield Submission_1.default.findById(req.params.id)
            .populate('student', 'name')
            .populate('examPaper')
            .populate('evaluatedBy', 'name');
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        res.status(200).json(submission);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.getSubmission = getSubmission;
