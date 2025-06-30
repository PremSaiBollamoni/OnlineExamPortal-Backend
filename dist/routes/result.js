"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const result_1 = require("../controllers/result");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.protect);
router.route('/').get(result_1.getResults);
router.route('/stats').get((0, auth_1.authorize)('faculty', 'admin'), result_1.getResultStats);
router.route('/:id').get(result_1.getResult);
exports.default = router;
