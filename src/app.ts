import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from 'cors';

// Import your route handlers
import employeeRoutes from './routes/employee.routes';
import leaveRoutes from './routes/leave.routes';

// Import your custom error handler
import { errorHandler } from "./middleware/errorHandler.middleware";

// Import Swagger setup
import { setupSwagger } from './utils/swagger';
import { generalLimiter } from "./middleware/rateLimiter.middleware";

const app: Application = express();

// --- Core Middleware ---
app.set('trust proxy', 1);
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            connectSrc: ["'self'", "http://localhost:5011","https://simple-leave-management.onrender.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            styleSrc: ["'self'", "'unsafe-inline'"]
        },
    },
})); // Sets various security HTTP headers
app.use(cors({
    origin: ['http://localhost:5011',"https://simple-leave-management.onrender.com"], // Allow all origins
    methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Allow specific HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
})); // Enables Cross-Origin Resource Sharing
app.use(generalLimiter); // Apply general rate limiting to all routes
app.use(express.json({ limit: '10mb' })); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// --- Swagger Setup ---
setupSwagger(app);

// --- Health Check Route ---
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        status: "OK",
        message: "Leave Management System API is running."
    });
});

// --- API Routes ---
// Mount the imported routes to specific base paths
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/leaves', leaveRoutes);

// --- Error Handling Middleware ---
// This should be the last middleware in the chain
app.use(errorHandler);

export default app;