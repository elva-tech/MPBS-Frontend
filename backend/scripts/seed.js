import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../src/models/User.js";
import { Society } from "../src/models/Society.js";
import { Rate } from "../src/models/Rate.js";
import { MilkEntry } from "../src/models/MilkEntry.js";
import { Verification } from "../src/models/Verification.js";
import { Overhead } from "../src/models/Overhead.js";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });

const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mpbs";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

async function run() {
  await mongoose.connect(MONGO);

  await User.deleteMany({});
  await Society.deleteMany({});
  await Rate.deleteMany({});
  await MilkEntry.deleteMany({});
  await Verification.deleteMany({});
  await Overhead.deleteMany({});

  const adminPass = await bcrypt.hash("admin123", 10);
  await User.create({ username: "admin001", passwordHash: adminPass, role: "Admin", authStatus: "Approved" });

  const societyPass = await bcrypt.hash("password123", 10);
  await User.create({ username: "SOCIETY_001", passwordHash: societyPass, role: "Society", authStatus: "Approved" });

  const bmcPass = await bcrypt.hash("bmc123", 10);
  await User.create({ username: "BMC_001", passwordHash: bmcPass, role: "BMC", authStatus: "Approved" });

  const auditPass = await bcrypt.hash("audit123", 10);
  await User.create({ username: "audit", passwordHash: auditPass, role: "Audit", authStatus: "Approved" });
  const accountPass = await bcrypt.hash("123", 10);
  await User.create({ username: "Account01", passwordHash: accountPass, role: "Account", authStatus: "Approved" });
  const dairyPass = await bcrypt.hash("dairy123", 10);
  await User.create({ username: "DAIRY_001", passwordHash: dairyPass, role: "Dairy", authStatus: "Approved" });
  const procurementPass = await bcrypt.hash("123", 10);
  await User.create({ username: "P&I", passwordHash: procurementPass, role: "ProcurementInputs", authStatus: "Approved" });

  await Society.create({
    societyId: "SOCIETY_001",
    societyNo: "001",
    societyName: "SOCIETY_001",
    district: "Raichur",
    taluk: "Raichur",
    contactNumber: "9876543210",
    bmcId: "BMC_001",
    memberCounts: { total: 34 },
    feedMineral: [
      { name: "Cattle Feed", qty: "200 Kg", lastReceived: "2026-03-01" },
      { name: "Mineral Mix", qty: "50 Kg", lastReceived: "2026-03-02" },
    ],
  });

  await Rate.insertMany([
    { milkType: "Cow", minFat: 3.5, maxFat: 4.0, minSnf: 8.0, maxSnf: 8.5, rate: 28 },
    { milkType: "Cow", minFat: 4.0, maxFat: 4.5, minSnf: 8.5, maxSnf: 9.0, rate: 32 },
    { milkType: "Buffalo", minFat: 6.0, maxFat: 6.5, minSnf: 9.0, maxSnf: 9.5, rate: 52 },
    { milkType: "Buffalo", minFat: 6.5, maxFat: 7.0, minSnf: 9.5, maxSnf: 10.0, rate: 58 },
  ]);

  const today = todayStr();
  const now = new Date();
  const months = [
    new Date(now.getFullYear(), now.getMonth() - 2, 15),
    new Date(now.getFullYear(), now.getMonth() - 1, 15),
    new Date(now.getFullYear(), now.getMonth(), 15),
  ].map((d) => d.toISOString().split("T")[0]);

  // Generate recent dates (last 7 days)
  const recentDates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    recentDates.push(d.toISOString().split("T")[0]);
  }

  const yesterday = recentDates[recentDates.length - 2]; // 2nd to last in array is yesterday

  const milkEntries = [
    // Historical data
    { societyId: "SOCIETY_001", date: months[0], session: "M", milkType: "Cow", fat: 3.6, snf: 8.4, qty: 110, rate: 28, amount: 3080 },
    { societyId: "SOCIETY_001", date: months[0], session: "E", milkType: "Buffalo", fat: 6.4, snf: 9.2, qty: 70, rate: 52, amount: 3640 },
    { societyId: "SOCIETY_001", date: months[1], session: "M", milkType: "Cow", fat: 3.4, snf: 7.8, qty: 90, rate: 28, amount: 2520 },
    { societyId: "SOCIETY_001", date: months[1], session: "E", milkType: "Buffalo", fat: 6.6, snf: 9.4, qty: 85, rate: 58, amount: 4930 },
    { societyId: "SOCIETY_001", date: months[2], session: "M", milkType: "Cow", fat: 3.7, snf: 8.5, qty: 120, rate: 28, amount: 3360 },
    { societyId: "SOCIETY_001", date: months[2], session: "M", milkType: "Buffalo", fat: 6.4, snf: 9.2, qty: 80, rate: 52, amount: 4160 },
    // Recent daily data
    { societyId: "SOCIETY_001", date: yesterday, session: "M", milkType: "Cow", fat: 3.5, snf: 8.2, qty: 115, rate: 28, amount: 3220 },
    { societyId: "SOCIETY_001", date: yesterday, session: "E", milkType: "Buffalo", fat: 6.5, snf: 9.3, qty: 75, rate: 55, amount: 4125 },
    { societyId: "SOCIETY_001", date: today, session: "M", milkType: "Cow", fat: 3.6, snf: 8.3, qty: 118, rate: 28, amount: 3304 },
    { societyId: "SOCIETY_001", date: today, session: "E", milkType: "Buffalo", fat: 6.4, snf: 9.1, qty: 72, rate: 52, amount: 3744 },
  ];

  await MilkEntry.insertMany(milkEntries);

  await Verification.create({
    societyId: "SOCIETY_001",
    bmcId: "BMC_001",
    date: today,
    session: "M",
    verifyChoice: "YES",
    entries: [],
    comparisonStatus: "VERIFIED",
    savedBy: "BMC_001",
  });

  await Verification.create({
    societyId: "SOCIETY_001",
    bmcId: "BMC_001",
    date: today,
    session: "E",
    verifyChoice: "NO",
    entries: [
      { type: "Cow", fat: 3.7, snf: 8.5, qty: 120 },
      { type: "Buffalo", fat: 6.4, snf: 9.2, qty: 80 },
    ],
    bmcEntries: [
      { type: "Cow", fat: 3.6, snf: 8.4, qty: 115 },
      { type: "Buffalo", fat: 6.5, snf: 9.3, qty: 70 },
    ],
    comparisonStatus: "DISCREPANCY FOUND",
    savedBy: "BMC_001",
  });

  await Overhead.insertMany([
    { month: months[0].slice(0, 7), bmcId: "BMC_001", diesel: 300, secretary: 150, repair: 90 },
    { month: months[1].slice(0, 7), bmcId: "BMC_001", diesel: 320, secretary: 160, repair: 100 },
    { month: months[2].slice(0, 7), bmcId: "BMC_001", diesel: 350, secretary: 170, repair: 110 },
  ]);

  console.log("Seeded");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
