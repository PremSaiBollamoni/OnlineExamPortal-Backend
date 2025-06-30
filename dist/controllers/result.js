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
exports.getResultStats = exports.getResult = exports.getResults = void 0;
const Result_1 = __importDefault(require("../models/Result"));
const getResults = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield Result_1.default.find(Object.assign({}, (req.user.role === 'student' ? { student: req.user._id } : {})))
            .populate('student', 'name')
            .populate('examPaper', 'title subject')
            .populate('submission');
        res.status(200).json(results);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.getResults = getResults;
const getResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield Result_1.default.findById(req.params.id)
            .populate('student', 'name')
            .populate('examPaper')
            .populate('submission');
        if (!result) {
            return res.status(404).json({ message: 'Result not found' });
        }
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.getResult = getResult;
const getResultStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield Result_1.default.aggregate([
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
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.getResultStats = getResultStats;
