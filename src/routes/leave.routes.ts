import { applyForLeave, getAllLeaves, getPendingLeaves, updateLeaveStatus } from "@/controllers/leave.controller";
import { Router } from "express";

const router = Router();

router.post('/apply-leave',applyForLeave);

// --- Routes for HR / Admins ---

// GET a paginated list of all PENDING leave requests
// Used for the HR approval dashboard.
router.get('/pending', getPendingLeaves);

// GET a paginated list of ALL leave requests (pending, approved, rejected)
// Used for a master view or reporting.
router.get('/', getAllLeaves);

// PATCH to update a specific leave request's status (Approve/Reject)
// The ':id' is the ID of the leave request.
router.patch('/:id', updateLeaveStatus);

export default router;