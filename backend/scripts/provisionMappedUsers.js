import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User.js";
import { Society } from "../src/models/Society.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mpbs";

const BASE_SOCIETY = "SOCIETY_001";
const BASE_BMC = "BMC_001";
const TARGET_BMCS = 3;
const SOCIETIES_PER_BMC = 20;
const TOTAL_SOCIETIES = TARGET_BMCS * SOCIETIES_PER_BMC;

function pad3(n) {
  return String(n).padStart(3, "0");
}

function bmcForSocietyIndex(index) {
  const bmcNo = Math.ceil(index / SOCIETIES_PER_BMC);
  return `BMC_${pad3(bmcNo)}`;
}

function defaultBmcProfile(username) {
  return {
    bmcId: username,
    bmcName: username,
  };
}

function defaultSocietyProfile(username, bmcId, number) {
  return {
    societyId: username,
    societyNo: pad3(number),
    societyName: username,
    bmcId,
  };
}

async function resolvePasswordHash({ username, role, fallbackPassword }) {
  const existing = await User.findOne({ username, role }, "passwordHash username");
  if (existing?.passwordHash) return existing.passwordHash;
  if (!fallbackPassword) {
    throw new Error(
      `Base ${role} user ${username} not found. Provide fallback password via args: societyPassword bmcPassword`
    );
  }
  return bcrypt.hash(fallbackPassword, 10);
}

async function upsertBmcUsers(passwordHash) {
  let created = 0;
  let updated = 0;

  for (let i = 1; i <= TARGET_BMCS; i += 1) {
    const username = `BMC_${pad3(i)}`;
    const current = await User.findOne({ username }, "profile");
    const mergedProfile = { ...(current?.profile || {}), ...defaultBmcProfile(username) };

    const result = await User.updateOne(
      { username },
      {
        $set: {
          passwordHash,
          role: "BMC",
          authStatus: "Approved",
          profile: mergedProfile,
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) created += 1;
    else updated += 1;
  }

  return { created, updated };
}

async function upsertSocietyUsersAndRecords(passwordHash) {
  let createdUsers = 0;
  let updatedUsers = 0;
  let createdSocieties = 0;
  let updatedSocieties = 0;

  for (let i = 1; i <= TOTAL_SOCIETIES; i += 1) {
    const societyId = `SOCIETY_${pad3(i)}`;
    const bmcId = bmcForSocietyIndex(i);

    const currentUser = await User.findOne({ username: societyId }, "profile");
    const mergedProfile = {
      ...(currentUser?.profile || {}),
      ...defaultSocietyProfile(societyId, bmcId, i),
    };

    const userResult = await User.updateOne(
      { username: societyId },
      {
        $set: {
          passwordHash,
          role: "Society",
          authStatus: "Approved",
          profile: mergedProfile,
        },
      },
      { upsert: true }
    );

    if (userResult.upsertedCount > 0) createdUsers += 1;
    else updatedUsers += 1;

    const societyResult = await Society.updateOne(
      { societyId },
      {
        $set: {
          bmcId,
          societyNo: pad3(i),
          societyName: societyId,
        },
        $setOnInsert: {
          district: "",
          taluk: "",
          hobli: "",
          route: "",
          eoId: "",
          contactNumber: "",
          address: "",
          bankDetails: {},
          pan: "",
          buildingType: "",
          memberCounts: {},
          farmerCounts: {},
          feedMineral: [],
        },
      },
      { upsert: true }
    );

    if (societyResult.upsertedCount > 0) createdSocieties += 1;
    else updatedSocieties += 1;
  }

  return { createdUsers, updatedUsers, createdSocieties, updatedSocieties };
}

async function run() {
  const [, , fallbackSocietyPassword = "", fallbackBmcPassword = ""] = process.argv;

  await mongoose.connect(MONGO);

  const societyHash = await resolvePasswordHash({
    username: BASE_SOCIETY,
    role: "Society",
    fallbackPassword: fallbackSocietyPassword,
  });

  const bmcHash = await resolvePasswordHash({
    username: BASE_BMC,
    role: "BMC",
    fallbackPassword: fallbackBmcPassword,
  });

  const bmcResult = await upsertBmcUsers(bmcHash);
  const societyResult = await upsertSocietyUsersAndRecords(societyHash);

  console.log("Provision complete");
  console.log(`BMC users -> created: ${bmcResult.created}, updated: ${bmcResult.updated}`);
  console.log(
    `Society users -> created: ${societyResult.createdUsers}, updated: ${societyResult.updatedUsers}`
  );
  console.log(
    `Society records -> created: ${societyResult.createdSocieties}, updated: ${societyResult.updatedSocieties}`
  );

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
