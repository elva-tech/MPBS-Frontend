import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,


      enum: ["Admin", "Society", "BMC", "EO", "Dairy", "Account", "Accounts", "Audit", "Auditor", "Other"],

      required: true,
    },
    authStatus: {
      type: String,
      enum: ["Approved", "Pending", "Rejected"],
      default: "Pending",
    },
    profile: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
