import { Request, Response } from 'express';
import Leave, { LeaveStatus } from '../models/leave.model';
import Employee from '../models/employee.model';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiError, ApiResponse } from '@/utils/ApiResponse';

/**
 * @swagger
 * /api/v1/leaves/apply-leave:
 *   post:
 *     summary: Apply for leave
 *     tags:
 *       - Leaves
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *                 description: The ID of the employee applying for leave
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The start date of the leave
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: The end date of the leave
 *               reason:
 *                 type: string
 *                 description: The reason for the leave
 *     responses:
 *       201:
 *         description: Leave request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 data:
 *                   type: object
 *                   properties:
 *                     employeId:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                     reason:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [Pending, Approved, Rejected]
 *       400:
 *         description: Bad request
 *       404:
 *         description: Employee not found
 *       409:
 *         description: Conflict - Overlapping leave request
 */

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
        throw new ApiError(400,'All fields (employeeId, startDate, endDate, reason) are required');
    }

    // 2. Date Conversion and Basic Logic Check
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight for accurate date comparison

    if (start > end) {
        res.status(400); // Bad Request
        throw new ApiError(400,'Start date cannot be after end date.');
    }
    if (start < today) {
        res.status(400); // Bad Request
        throw new ApiError(400,'Cannot apply for leave in the past.');
    }

    // 3. Check if the Employee Exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
        res.status(404); // Not Found
        throw new ApiError(404,'Employee not found.');
    }
    
    // 4. Check if leave date is before the employee's joining date
    if (start < new Date(employee.joiningDate)) {
        res.status(400);
        throw new ApiError(400,"Cannot apply for leave before the employee's joining date.");
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
        throw new ApiError(409,'This leave request overlaps with an existing leave.');
    }

    // 6. Check if the employee has enough available leave
    const leaveDuration = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;
    if (employee.leaveAvailability < leaveDuration) {
        res.status(400);
        throw new ApiError(400,`Insufficient leave balance. Available: ${employee.leaveAvailability}, Required: ${leaveDuration}`);
    }

    // --- If all checks pass, create the leave request ---
    const newLeave = await Leave.create({
        employeId: employeeId,
        startDate: start,
        endDate: end,
        reason: reason
    });

    res.status(201).json(new ApiResponse(201,"Successfully applied for leave",newLeave));
});


/**
 * @swagger
 * /api/v1/leaves/{id}:
 *   patch:
 *     summary: Update the status of a leave request
 *     tags:
 *       - Leaves
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the leave request to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected]
 *                 description: The new status of the leave request
 *     responses:
 *       200:
 *         description: Leave request status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     employeId:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date
 *                     endDate:
 *                       type: string
 *                       format: date
 *                     reason:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [Pending, Approved, Rejected]
 *       400:
 *         description: Bad request
 *       404:
 *         description: Leave request not found
 */

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
        throw new ApiError(400,"Status is required and must be 'Approved' or 'Rejected'.");
    }

    // 2. Find the leave request by its ID
    const leave = await Leave.findById(id);
    if (!leave) {
        res.status(404); // Not Found
        throw new ApiError(404,'Leave request not found');
    }

    // Prevent re-approving or re-rejecting an already processed request
    if (leave.status !== LeaveStatus.PENDING) {
        res.status(400);
        throw new ApiError(400,`This leave request has already been ${leave.status}.`);
    }

    // 3. If the leave is being approved, perform the deduction logic
    if (status === LeaveStatus.APPROVED) {
        const employee = await Employee.findById(leave.employeId);
        if (!employee) {
            res.status(404);
            throw new ApiError(404,"Associated employee for this leave request could not be found.");
        }

        // Calculate the duration of the leave in days
        const leaveDuration =
            (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) /
                (1000 * 3600 * 24) + 1;

        // Final check to ensure the employee still has enough leave
        if (employee.leaveAvailability < leaveDuration) {
            res.status(400);
            throw new ApiError(400,`Cannot approve. Employee has insufficient leave balance. Available: ${employee.leaveAvailability}, Required: ${leaveDuration}`);
        }

        // Deduct the leave days from the employee's balance
        employee.leaveAvailability -= leaveDuration;
        await employee.save(); // Save the updated employee document
    }

    // 4. Update the leave request's status and save it
    leave.status = status;
    await leave.save(); // Save the updated leave document

    // 5. Send a success response
    res.status(200).json(new ApiResponse(200,"Updated leave request status",leave));
});


/**
 * @swagger
 * /api/v1/leaves:
 *   get:
 *     summary: Retrieve all leave requests with optional status filtering and pagination
 *     tags:
 *       - Leaves
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 9
 *         description: The number of documents per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Pending, Approved, Rejected]
 *         description: Filter leave requests by status
 *     responses:
 *       200:
 *         description: A list of leave requests with pagination metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       employeId:
 *                         type: string
 *                         description: The ID of the employee
 *                       startDate:
 *                         type: string
 *                         format: date
 *                       endDate:
 *                         type: string
 *                         format: date
 *                       reason:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [Pending, Approved, Rejected]
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalDocuments:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */

/**
 * @function getAllLeaves
 * @description Retrieves a paginated list of all leave requests. Supports pagination via query params.
 * @route GET /api/leaves
 * @access Private (HR only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getAllLeaves = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 9;
    const status = req.query.status as string; // Optional status filter

    const skip = (page - 1) * limit;

    // Build the query filter based on the status
    const queryFilter: any = {};
    if (status && [LeaveStatus.PENDING, LeaveStatus.APPROVED, LeaveStatus.REJECTED].includes(status as LeaveStatus)) {
        queryFilter.status = status;
    }

    // Fetch the data and the total document count in parallel for efficiency
    const [leaves, totalDocuments] = await Promise.all([
        Leave.find(queryFilter).sort({ createdAt: -1 }).limit(limit).skip(skip).populate('employeId', 'fullName email'),
        Leave.countDocuments(queryFilter)
    ]);

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalDocuments / limit);

    // Send the response with data and pagination metadata
    res.status(200).json(new ApiResponse(
        200,
        "Fetched Required Data",
        {
            data:leaves,
            pagination: {
                totalDocuments,
                totalPages,
                currentPage: page,
                limit,
            }
        }
    ));
});