"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const examPaper_1 = require("../controllers/examPaper");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router
    .route('/')
    .post((0, auth_1.authorize)('faculty', 'admin'), examPaper_1.createExamPaper)
    .get(examPaper_1.getExamPapers);
router
    .route('/:id')
    .get(examPaper_1.getExamPaper)
    .patch((0, auth_1.authorize)('faculty', 'admin'), examPaper_1.updateExamPaper)
    .delete((0, auth_1.authorize)('faculty', 'admin'), examPaper_1.deleteExamPaper);
exports.default = router;
