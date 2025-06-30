"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const submission_1 = require("../controllers/submission");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.route('/').post(submission_1.submitExam).get(submission_1.getSubmissions);
router.route('/:id').get(submission_1.getSubmission);
exports.default = router;
