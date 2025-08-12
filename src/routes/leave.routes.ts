import { applyForLeave, getAllLeaves, getPendingLeaves, updateLeaveStatus } from "@/controllers/leave.controller";
import { leaveLimiter, readLimiter, strictLimiter } from "@/middleware/rateLimiter.middleware";
import { Router } from "express";

const router = Router();

// Apply leave-specific rate limiting to leave applications
router.post('/apply-leave', leaveLimiter, applyForLeave);

// --- Routes for HR / Admins ---

// GET a paginated list of all PENDING leave requests
// Used for the HR approval dashboard.
router.get('/pending', readLimiter, getPendingLeaves);

// GET a paginated list of ALL leave requests (pending, approved, rejected)
// Used for a master view or reporting.
router.get('/', readLimiter, getAllLeaves);

// PATCH to update a specific leave request's status (Approve/Reject)
// The ':id' is the ID of the leave request.
router.patch('/:id', strictLimiter, updateLeaveStatus);

export default router;