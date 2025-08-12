import { Document, Schema, model } from "mongoose";

export interface IEmployee extends Document {
    fullName: string;
    email: string;
    department: string;
    joiningDate: Date;
    leaveAvailability: number;
}

const EmployeeSchema = new Schema<IEmployee>(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
            minlength: [3,"The length of the full name can't be smaller than 3 characters"],
            maxlength: [30,"The length can't exceed "],
            match: [/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces']
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            minlength: [5, 'Email must be at least 5 characters long'],
            maxlength: [254, 'Email cannot exceed 254 characters'],
            match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
        },
        department: {
            type: String,
            required: [true,"Department is required"],
            trim: true
        },
        joiningDate: {
            type: Date,
            required: [true,"Joining Date is required"]
        },
        leaveAvailability: {
            type: Number,
            default: 40
        }
    },
    {
        timestamps: true,
    }
)

const EmployeeModel = model<IEmployee>('Employee',EmployeeSchema);

export default EmployeeModel;