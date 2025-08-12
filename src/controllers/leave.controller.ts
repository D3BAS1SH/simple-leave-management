
import { Request, Response } from 'express';
import Leave, { LeaveStatus } from '../models/leave.model';
import Employee from '../models/employee.model';
import { asyncHandler } from '@/utils/asyncHandler';

/**
 * @function applyForLeave
 * @description Handles leave application requests. Validates input, checks employee existence, ensures no overlapping leaves, and sufficient leave balance. Creates a new leave request if all checks pass.
 * @route POST /api/leaves
 * @access Private (Employee)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const applyForLeave = asyncHandler(async (req: Request, res: Response) => {
    const { employeeId, startDate, endDate, reason } = req.body;

    // 1. Basic Input Validation
    if (!employeeId || !startDate || !endDate ||!reason) {
        res.status(400); // Bad Request
        throw new Error('All fields (employeeId, startDate, endDate, reason) are required');
    }

    // 2. Date Conversion and Basic Logic Check
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight for accurate date comparison

    if (start > end) {
        res.status(400); // Bad Request
        throw new Error('Start date cannot be after end date.');
    }
    if (start < today) {
        res.status(400); // Bad Request
        throw new Error('Cannot apply for leave in the past.');
    }

    // 3. Check if the Employee Exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
        res.status(404); // Not Found
        throw new Error('Employee not found.');
    }
    
    // 4. Check if leave date is before the employee's joining date
    if (start < new Date(employee.joiningDate)) {
        res.status(400);
        throw new Error("Cannot apply for leave before the employee's joining date.");
    }

    // 5. Check for Overlapping Leave Requests for the same employee
    const overlappingLeave = await Leave.findOne({
        employeId: employeeId,
        status: { $in: ['Pending', 'Approved'] }, // Check against existing pending or approved leaves
        $or: [
            // Case 1: New leave starts during an existing leave
            { startDate: { $lte: start }, endDate: { $gte: start } },
            // Case 2: New leave ends during an existing leave  
            { startDate: { $lte: end }, endDate: { $gte: end } },
            // Case 3: New leave completely encompasses an existing leave
            { startDate: { $gte: start }, endDate: { $lte: end } },
            // Case 4: Existing leave completely encompasses the new leave
            { startDate: { $lte: start }, endDate: { $gte: end } }
        ]
    });

    if (overlappingLeave) {
        res.status(409); // Conflict
        throw new Error('This leave request overlaps with an existing leave.');
    }

    // 6. Check if the employee has enough available leave
    const leaveDuration = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;
    if (employee.leaveAvailability < leaveDuration) {
        res.status(400);
        throw new Error(`Insufficient leave balance. Available: ${employee.leaveAvailability}, Required: ${leaveDuration}`);
    }

    // --- If all checks pass, create the leave request ---
    const newLeave = await Leave.create({
        employeId: employeeId,
        startDate: start,
        endDate: end,
        reason: reason
    });

    res.status(201).json({
        message: 'Leave request submitted successfully.',
        data: newLeave
    });
});


/**
 * @function updateLeaveStatus
 * @description Updates the status of a leave request (Approve/Reject). Checks validity, ensures leave is pending, and if approving, deducts leave from employee's balance.
 * @route PATCH /api/leaves/:id
 * @access Private (HR only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updateLeaveStatus = asyncHandler(async (req: Request, res: Response) => {
    // The ID of the leave request from the URL parameters
    const { id } = req.params;
    // The new status ('Approved' or 'Rejected') from the request body
    const { status } = req.body;

    // 1. Validate the incoming status
    if (!status || ![LeaveStatus.APPROVED, LeaveStatus.REJECTED].includes(status)) {
        res.status(400); // Bad Request
        throw new Error("Status is required and must be 'Approved' or 'Rejected'.");
    }

    // 2. Find the leave request by its ID
    const leave = await Leave.findById(id);
    if (!leave) {
        res.status(404); // Not Found
        throw new Error('Leave request not found');
    }

    // Prevent re-approving or re-rejecting an already processed request
    if (leave.status !== LeaveStatus.PENDING) {
        res.status(400);
        throw new Error(`This leave request has already been ${leave.status}.`);
    }

    // 3. If the leave is being approved, perform the deduction logic
    if (status === LeaveStatus.APPROVED) {
        const employee = await Employee.findById(leave.employeId);
        if (!employee) {
            res.status(404);
            throw new Error("Associated employee for this leave request could not be found.");
        }

        // Calculate the duration of the leave in days
        const leaveDuration =
            (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
                (1000 * 3600 * 24) + 1;

        // Final check to ensure the employee still has enough leave
        if (employee.leaveAvailability < leaveDuration) {
            res.status(400);
            throw new Error(`Cannot approve. Employee has insufficient leave balance. Available: ${employee.leaveAvailability}, Required: ${leaveDuration}`);
        }

        // Deduct the leave days from the employee's balance
        employee.leaveAvailability -= leaveDuration;
        await employee.save(); // Save the updated employee document
    }

    // 4. Update the leave request's status and save it
    leave.status = status;
    await leave.save(); // Save the updated leave document

    // 5. Send a success response
    res.status(200).json({
        message: `Leave request has been successfully ${status}.`,
        data: leave
    });
});


/**
 * @function getPendingLeaves
 * @description Retrieves a paginated list of all pending leave requests. Supports pagination via query params.
 * @route GET /api/leaves/pending
 * @access Private (HR only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getPendingLeaves = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;

    // 2. Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // 3. Define the filter condition for pending leaves
    const queryFilter = { status: LeaveStatus.PENDING };

    // 4. Fetch the pending leaves and the total count of pending leaves in parallel
    const [pendingLeaves, totalDocuments] = await Promise.all([
        Leave.find(queryFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .populate('employeId', 'fullName email'), // Populate employee details
        Leave.countDocuments(queryFilter)
    ]);

    // 5. Calculate the total number of pages based on the filtered count
    const totalPages = Math.ceil(totalDocuments / limit);

    // 6. Send the response
    res.status(200).json({
        data: pendingLeaves,
        pagination: {
            totalDocuments,
            totalPages,
            currentPage: page,
            limit,
        },
    });
});

/**
 * @function getAllLeaves
 * @description Retrieves a paginated list of all leave requests. Supports pagination via query params.
 * @route GET /api/leaves
 * @access Private (HR only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getAllLeaves = asyncHandler( async(req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9; 

    const skip = (page - 1) * limit;

    // 3. Fetch the data and the total document count in parallel for efficiency
    const [leaves, totalDocuments] = await Promise.all([
        Leave.find({}).sort({ createdAt: -1 }).limit(limit).skip(skip).populate('employeId', 'fullName email'),
        Leave.countDocuments()
    ]);

    // 4. Calculate the total number of pages
    const totalPages = Math.ceil(totalDocuments / limit);

    // 5. Send the response with data and pagination metadata
    res.status(200).json({
        data: leaves,
        pagination: {
            totalDocuments,
            totalPages,
            currentPage: page,
            limit,
        },
    });
});