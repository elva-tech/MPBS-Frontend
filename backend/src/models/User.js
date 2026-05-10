import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
<<<<<<< HEAD
      enum: ["Admin", "Society", "BMC", "Audit", "EO", "Dairy", "Other"],
=======
      enum: ["Admin", "Society", "BMC", "EO", "Dairy", "Account", "Other"],
>>>>>>> 59c00f5a9f370b54176bb943f7345ef64c5d77f9
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
