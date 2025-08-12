import { createEmployee } from "@/controllers/employee.controller";
import { strictLimiter } from "@/middleware/rateLimiter.middleware";
import { Router } from "express";

const router = Router();

// Apply strict rate limiting to employee creation
router.post('/create', strictLimiter, createEmployee);

export default router;