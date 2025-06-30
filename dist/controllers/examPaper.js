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
exports.deleteExamPaper = exports.updateExamPaper = exports.getExamPaper = exports.getExamPapers = exports.createExamPaper = void 0;
const ExamPaper_1 = __importDefault(require("../models/ExamPaper"));
const createExamPaper = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const examPaper = yield ExamPaper_1.default.create(Object.assign(Object.assign({}, req.body), { createdBy: req.user._id }));
        res.status(201).json(examPaper);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createExamPaper = createExamPaper;
const getExamPapers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const examPapers = yield ExamPaper_1.default.find().populate('createdBy', 'name');
        res.status(200).json(examPapers);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.getExamPapers = getExamPapers;
const getExamPaper = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const examPaper = yield ExamPaper_1.default.findById(req.params.id).populate('createdBy', 'name');
        if (!examPaper) {
            return res.status(404).json({ message: 'Exam paper not found' });
        }
        res.status(200).json(examPaper);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.getExamPaper = getExamPaper;
const updateExamPaper = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const examPaper = yield ExamPaper_1.default.findOneAndUpdate({ _id: req.params.id, createdBy: req.user._id }, req.body, { new: true, runValidators: true });
        if (!examPaper) {
            return res.status(404).json({ message: 'Exam paper not found' });
        }
        res.status(200).json(examPaper);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updateExamPaper = updateExamPaper;
const deleteExamPaper = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const examPaper = yield ExamPaper_1.default.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user._id,
        });
        if (!examPaper) {
            return res.status(404).json({ message: 'Exam paper not found' });
        }
        res.status(200).json({ message: 'Exam paper deleted successfully' });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.deleteExamPaper = deleteExamPaper;
