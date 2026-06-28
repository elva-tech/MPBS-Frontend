import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User.js";
import { MilkEntry } from "../src/models/MilkEntry.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mpbs");

  const existing = await User.findOne({ username: "DAIRY_001" });
  if (!existing) {
    const hash = await bcrypt.hash("dairy123", 10);
    await User.create({
      username: "DAIRY_001",
      passwordHash: hash,
      role: "Dairy",
      authStatus: "Approved",
    });
    console.log("Created DAIRY_001 / dairy123");
  } else {
    console.log("DAIRY_001 already exists");
  }

  const all = await MilkEntry.find({}).sort({ createdAt: 1 });
  const seen = new Map();
  let removed = 0;
  for (const entry of all) {
    const key = `${entry.societyId}|${entry.date}|${entry.session}|${entry.milkType}`;
    if (seen.has(key)) {
      await MilkEntry.deleteOne({ _id: entry._id });
      removed += 1;
    } else {
      seen.set(key, entry._id);
    }
  }
  console.log(`Removed ${removed} duplicate milk entries`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
