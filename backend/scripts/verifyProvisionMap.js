import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "../src/models/User.js";
import { Society } from "../src/models/Society.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mpbs";

async function run() {
  await mongoose.connect(MONGO);

  const bmcs = ["BMC_001", "BMC_002", "BMC_003"];
  for (const bmcId of bmcs) {
    const societies = await Society.find({ bmcId }, "societyId").sort({ societyId: 1 });
    const count = societies.length;
    const first = count ? societies[0].societyId : "-";
    const last = count ? societies[count - 1].societyId : "-";
    console.log(`${bmcId}: count=${count}, first=${first}, last=${last}`);
  }

  const societyApproved = await User.countDocuments({
    role: "Society",
    authStatus: "Approved",
    username: /^SOCIETY_\d{3}$/,
  });

  const bmcApproved = await User.countDocuments({
    role: "BMC",
    authStatus: "Approved",
    username: /^BMC_\d{3}$/,
  });

  console.log(`Approved Society users: ${societyApproved}`);
  console.log(`Approved BMC users: ${bmcApproved}`);

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
