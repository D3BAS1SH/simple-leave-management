import EmployeeModel from "@/models/employee.model";
import { ApiError, ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { Request, Response } from "express"
import { Department } from "@/models/employee.model";

/**
 * @swagger
 * /api/v1/employees/create:
 *   post:
 *     summary: Create a new employee
 *     tags:
 *       - Employees
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name of the employee
 *               email:
 *                 type: string
 *                 description: Email address of the employee
 *               department:
 *                 type: string
 *                 enum: [SDE-I, SDE-II, SDE-III, DESIGNER-UI/UX, FRONTEND, TESTING, HR]
 *                 description: Department of the employee
 *               joiningDate:
 *                 type: string
 *                 format: date
 *                 description: Joining date of the employee
 *               leaveAvailability:
 *                 type: integer
 *                 description: Optional. Leave availability must be undefined or an integer greater than 0
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 body:
 *                   type: object
 *                   properties:
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     department:
 *                       type: string
 *                     joiningDate:
 *                       type: string
 *                       format: date
 *                     leaveAvailability:
 *                       type: integer
 *                     _id:
 *                       type: string
 *       400:
 *         description: Bad request
 *       409:
 *         description: Conflict - Employee already exists
 */

export const createEmployee = asyncHandler(async(req: Request, res: Response)=>{
    const { fullName, email, department, joiningDate, leaveAvailability } = req.body;
    if(!fullName || !email || !department || !joiningDate){
        res.status(400);
        throw new ApiError(400,'fields not available or invalid');
    }

    // Validate department against the Department enum
    if (!Object.values(Department).includes(department)) {
        res.status(400);
        throw new ApiError(400, `Invalid department. Must be one of: ${Object.values(Department).join(', ')}`);
    }

    const employeeExistance = await EmployeeModel.findOne({
        email: email
    });

    if(employeeExistance){
        res.status(409)
        throw new ApiError(409,"Already employee exists on given email");
    }

    if(leaveAvailability!==undefined && typeof leaveAvailability === 'number' && Number.isInteger(leaveAvailability) && leaveAvailability < 1){
        throw new ApiError(400,"Given leave Availability is invalid. the leaveAvailability must be undefined or an integer number greater than 1.");;
    }

    const newEmployee = await EmployeeModel.create({
        fullName: fullName,
        email: email,
        department: department,
        joiningDate: joiningDate,
        leaveAvailability: leaveAvailability
    });

    console.log("Employe created with the email: ",newEmployee.email);

    const response = new ApiResponse(200,"Employee created.",{
        fullName: newEmployee.fullName,
        email: newEmployee.email,
        department: newEmployee.department,
        joiningDate: newEmployee.joiningDate,
        leaveAvailability: newEmployee.leaveAvailability,
        _id: newEmployee._id
    });

    res.status(response.statusCode).json({
        message: "Employee Created Successfully",
        body: response.data
    });
})