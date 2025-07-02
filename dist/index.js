"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("./config/database"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const examPaper_1 = __importDefault(require("./routes/examPaper"));
const submission_1 = __importDefault(require("./routes/submission"));
const result_1 = __importDefault(require("./routes/result"));
// Load env vars
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: 'https://cutmap.netlify.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
    exposedHeaders: ['set-cookie'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: 86400
}));
app.use(express_1.default.json());
// Connect to MongoDB
(0, database_1.default)();
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/exam-papers', examPaper_1.default);
app.use('/api/submissions', submission_1.default);
app.use('/api/results', result_1.default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
