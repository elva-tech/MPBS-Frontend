import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mpbs";

async function run() {
  await mongoose.connect(MONGO);

  const username = "admin001";
  const passwordHash = await bcrypt.hash("admin123", 10);

  const user = await User.findOneAndUpdate(
    { username },
    { username, passwordHash, role: "Admin", authStatus: "Approved" },
    { new: true, upsert: true }
  );

  console.log(`Admin ready: ${user.username} (${user.role})`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
