import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mpbs";

function readArgs() {
  const [, , username, password] = process.argv;
  if (!username || !password) {
    console.error("Usage: npm run set-admin -- <username> <password>");
    process.exit(1);
  }
  return { username: String(username).trim(), password: String(password) };
}

async function run() {
  const { username, password } = readArgs();
  await mongoose.connect(MONGO);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.findOneAndUpdate(
    { username },
    {
      $set: {
        username,
        passwordHash,
        role: "Admin",
        authStatus: "Approved",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin credentials updated for username: ${user.username}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});
