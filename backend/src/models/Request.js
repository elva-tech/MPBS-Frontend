import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: { type: String },
    role: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    message: { type: String },
    newPasswordHash: { type: String },
    attachmentName: { type: String },
    attachmentUrl: { type: String },
  },
  { timestamps: true }
);

export const Request = mongoose.model("Request", RequestSchema);
