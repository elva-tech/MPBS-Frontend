import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    sentToRole: { type: String, required: true },
    sentToScope: { type: String, enum: ["all", "specific"], default: "all" },
    sentToUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sentToName: { type: String },
    message: { type: String, required: true },
    fileUrl: { type: String },
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date },
      },
    ],
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", NotificationSchema);
