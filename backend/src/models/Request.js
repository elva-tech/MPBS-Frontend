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

// Indexes for performance
RequestSchema.index({ userId: 1, status: 1 });
RequestSchema.index({ status: 1, createdAt: -1 });
RequestSchema.index({ type: 1 });

export const Request = mongoose.model("Request", RequestSchema);
