import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from 'cors';

// Import your route handlers
import employeeRoutes from './routes/employee.routes';
import leaveRoutes from './routes/leave.routes';

// Import your custom error handler
import { errorHandler } from "./middleware/errorHandler.middleware";

// Import rate limiting middleware
import { generalLimiter } from "./middleware/rateLimiter.middleware";

const app: Application = express();

// --- Core Middleware ---
app.use(helmet()); // Sets various security HTTP headers
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(generalLimiter); // Apply general rate limiting to all routes
app.use(express.json({ limit: '10mb' })); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

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