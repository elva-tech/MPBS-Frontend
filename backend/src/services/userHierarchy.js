import { User } from "../models/User.js";
import { Society } from "../models/Society.js";

function buildMemberCounts(profile = {}) {
  return {
    farmersType: {
      sc: Number(profile.totalMemSC || 0),
      st: Number(profile.totalMemST || 0),
      women: Number(profile.totalMemWomen || 0),
      general: Number(profile.totalMemGeneral || 0),
    },
    totalFarmersType: {
      sc: Number(profile.funcMemSC || 0),
      st: Number(profile.funcMemST || 0),
      women: Number(profile.funcMemWomen || 0),
      general: Number(profile.funcMemGeneral || 0),
    },
  };
}

function buildFarmerCounts(profile = {}) {
  return {
    functional: {
      small: Number(profile.totalFarSmall || 0),
      agri: Number(profile.totalFarAgri || 0),
      marginal: Number(profile.totalFarMarginal || 0),
      others: Number(profile.totalFarOthers || 0),
    },
    totalFunctional: {
      small: Number(profile.funcFarSmall || 0),
      agri: Number(profile.funcFarAgri || 0),
      marginal: Number(profile.funcFarMarginal || 0),
      others: Number(profile.funcFarOthers || 0),
    },
  };
}

export function resolveBmcId(profile = {}, username = "") {
  return String(profile.bmcId || profile.bmc || username || "").trim();
}

export function resolveDairyId(profile = {}) {
  return String(profile.dairyId || profile.dairy || "").trim();
}

export async function listHierarchyOptions() {
  const [bmcUsers, dairyUsers] = await Promise.all([
    User.find({ role: "BMC" }, "username profile authStatus").sort({ username: 1 }).lean(),
    User.find({ role: "Dairy" }, "username profile authStatus").sort({ username: 1 }).lean(),
  ]);

  return {
    bmcs: bmcUsers.map((user) => ({
      id: user.username,
      label: user.profile?.societyName || user.profile?.bmcId || user.username,
      dairyId: resolveDairyId(user.profile),
      authStatus: user.authStatus,
    })),
    dairies: dairyUsers.map((user) => ({
      id: user.username,
      label: user.profile?.dairyName || user.username,
      authStatus: user.authStatus,
    })),
  };
}

export async function assertBmcExists(bmcId) {
  if (!bmcId) throw new Error("BMC is required for a society.");
  const bmc = await User.findOne({ username: bmcId, role: "BMC" });
  if (!bmc) throw new Error(`BMC "${bmcId}" was not found. Create and approve the BMC first.`);
  return bmc;
}

export async function assertDairyExists(dairyId) {
  if (!dairyId) throw new Error("Dairy is required for a BMC.");
  const dairy = await User.findOne({ username: dairyId, role: "Dairy" });
  if (!dairy) throw new Error(`Dairy "${dairyId}" was not found.`);
  return dairy;
}

export async function syncSocietyRecord(username, profile = {}) {
  const societyId = String(username || "").trim();
  const bmcId = resolveBmcId(profile);
  await assertBmcExists(bmcId);

  const payload = {
    societyId,
    societyNo: profile.societyNo || "",
    societyName: profile.societyName || societyId,
    district: profile.district || "",
    taluk: profile.taluk || "",
    hobli: profile.hobli || "",
    bmcId,
    eoId: profile.eo || profile.eoId || "",
    contactNumber: profile.contactNo || "",
    address: profile.address || "",
    pan: profile.pan || "",
    buildingType: profile.buildingType || "",
    memberCounts: buildMemberCounts(profile),
    farmerCounts: buildFarmerCounts(profile),
    bankDetails: {
      bankName: profile.bankName || "",
      branch: profile.branch || "",
      accountNo: profile.accountNo || "",
      ifsc: profile.ifsc || "",
    },
  };

  if (profile.route) {
    payload.route = profile.route;
  }

  return Society.findOneAndUpdate({ societyId }, payload, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
}

export function normalizeBmcProfile(username, profile = {}) {
  const dairyId = resolveDairyId(profile);
  return {
    ...profile,
    bmcId: String(username || "").trim(),
    dairyId,
  };
}

export function normalizeDairyProfile(username, profile = {}) {
  return {
    ...profile,
    dairyId: String(username || "").trim(),
    dairyName: profile.dairyName || username,
  };
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findLinkedBmcIds(dairyUnit = "", dairyUserId = "") {
  const bmcUsers = await User.find({ role: "BMC" }, "username profile").lean();
  const unit = String(dairyUnit || "").trim().toLowerCase();
  const userId = String(dairyUserId || "").trim();

  const linked = bmcUsers
    .filter((bmc) => {
      const profile = bmc.profile || {};
      const dairyId = resolveDairyId(profile);
      if (userId && dairyId === userId) return true;
      if (userId && bmc.username === userId) return false;
      if (unit && dairyId.toLowerCase() === unit) return true;
      const dairyName = String(profile.dairyName || "").trim().toLowerCase();
      if (unit && dairyName && dairyName.includes(unit)) return true;
      return false;
    })
    .map((bmc) => bmc.username);

  return [...new Set(linked.filter(Boolean))];
}

/** Resolve societies visible to a dairy via BMC links, with legacy fuzzy fallback. */
export async function getSocietiesForDairy({ dairyUnit = "", dairyUserId = "" } = {}) {
  const linkedBmcIds = await findLinkedBmcIds(dairyUnit, dairyUserId);
  if (linkedBmcIds.length) {
    const linked = await Society.find(
      { bmcId: { $in: linkedBmcIds } },
      "societyId district route bmcId societyName"
    ).lean();
    if (linked.length) return linked;
  }

  const unit = String(dairyUnit || "").trim();
  if (unit) {
    const regex = new RegExp(escapeRegExp(unit), "i");
    const fuzzy = await Society.find(
      {
        $or: [{ route: unit }, { route: regex }, { district: regex }, { bmcId: regex }],
      },
      "societyId district route bmcId societyName"
    ).lean();
    if (fuzzy.length) return fuzzy;
  }

  if (dairyUserId) {
    const dairyUser = await User.findOne({ username: dairyUserId, role: "Dairy" }, "username profile").lean();
    const dairyName = dairyUser?.profile?.dairyName;
    if (dairyName) {
      const regex = new RegExp(escapeRegExp(dairyName), "i");
      const byName = await Society.find(
        {
          $or: [{ route: regex }, { district: regex }],
        },
        "societyId district route bmcId societyName"
      ).lean();
      if (byName.length) return byName;
    }
  }

  return Society.find({}, "societyId district route bmcId societyName").lean();
}
