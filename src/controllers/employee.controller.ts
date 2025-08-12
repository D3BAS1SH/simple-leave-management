import EmployeeModel, { IEmployee } from "@/models/employee.model";
import { asyncHandler } from "@/utils/asyncHandler";
import { Request, Response } from "express"

export const createEmployee = asyncHandler(async(req: Request, res: Response)=>{
    const { fullName, email, department, joiningDate, leaveAvailability } = req.body;
    if(!fullName || !email || !department || !joiningDate){
        res.status(400);
        throw new Error('fields not available or invalid');
    }

    const employeeExistance = await EmployeeModel.findOne({
        email: email
    });

    if(employeeExistance){
        res.status(409)
        throw new Error("Already employee exists on given email");
    }

    const newEmployee = await EmployeeModel.create({
        fullName: fullName,
        email: email,
        department: department,
        joiningDate: joiningDate,
        leaveAvailability: leaveAvailability
    });

    console.log("Employe created with the email: ",newEmployee.email);

    res.status(201).json({
        message: "Employee Created Successfully",
        body: newEmployee
    });
})