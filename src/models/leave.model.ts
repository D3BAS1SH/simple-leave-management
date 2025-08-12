import { Document, model, Schema, Types } from "mongoose";

export enum LeaveStatus {
    PENDING = "Pending",
    APPROVED = "Approved",
    REJECTED = "Rejected"
}

export interface ILeave extends Document {
    employeId: Schema.Types.ObjectId,
    reason: string,
    startDate: Date,
    endDate: Date,
    status: LeaveStatus
}

const LeaveSchema = new Schema<ILeave>(
    {
        employeId:{
            type: Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        reason:{
            type: String,
            required: true,
            maxlength: [300,"The reason is exceeding the length"]
        },
        status: {
            type: String,
            enum: Object.values(LeaveStatus),
            default: LeaveStatus.PENDING
        }
    }
)

export default model<ILeave>("Leave",LeaveSchema);