import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mpbs";
const ALLOWED_ROLES = new Set(["Admin", "Society", "BMC", "EO", "Dairy", "Account", "ProcurementInputs", "Other"]);

function normalizeRole(inputRole) {
  const role = String(inputRole || "").trim();
  const matched = Array.from(ALLOWED_ROLES).find((item) => item.toLowerCase() === role.toLowerCase());
  return matched || "";
}

function readArgs() {
  const [, , usernameArg, passwordArg, roleArg] = process.argv;
  const username = String(usernameArg || "").trim();
  const password = String(passwordArg || "");
  const role = normalizeRole(roleArg);

  if (!username || !password || !role) {
    console.error("Usage: npm run set-user -- <username> <password> <role>");
    console.error("Allowed roles: Admin, Society, BMC, EO, Dairy, Account, ProcurementInputs, Other");
    process.exit(1);
  }

  return { username, password, role };
}

async function run() {
  const { username, password, role } = readArgs();
  await mongoose.connect(MONGO);

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.findOneAndUpdate(
    { username },
    {
      $set: {
        username,
        passwordHash,
        role,
        authStatus: "Approved",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log(`User credentials updated for username: ${user.username} (${user.role})`);
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
