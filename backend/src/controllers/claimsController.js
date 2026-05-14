import { Claims } from "../models/Claims.js";
import { Society } from "../models/Society.js";

const ALL_SOCIETIES_VALUE = "ALL";

export const createClaim = async (req, res) => {
  try {
    const { category, amount, description, societyId, billingCycleId, remarks } = req.body;

    // Validate inputs
    if (!category || !amount || !societyId || !billingCycleId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    // Verify society exists unless this applies to all societies
    if (societyId !== ALL_SOCIETIES_VALUE) {
      const society = await Society.findOne({ societyId });
      if (!society) {
        return res.status(404).json({ error: "Society not found" });
      }
    }

    const claim = new Claims({
      category,
      amount,
      description,
      societyId,
      billingCycleId,
      remarks,
      approvedBy: req.user._id,
      status: "approved",
    });

    await claim.save();
    res.status(201).json(claim);
  } catch (error) {
    console.error("Error creating claim:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getClaims = async (req, res) => {
  try {
    const { societyId, billingCycleId, status, bmcId, allSocieties, limit = 100, skip = 0 } = req.query;

    const filter = {};
    
    // If allSocieties is true, don't filter by societyId
    if (allSocieties !== "true") {
      // Filter by specific society
      if (societyId) {
        const societyIds = Array.isArray(societyId) ? societyId : [societyId];
        filter.societyId = { $in: [...societyIds, ALL_SOCIETIES_VALUE] };
      }
      
      // Filter by BMC (get all societies under a BMC)
      if (bmcId) {
        const { Society } = await import("../models/Society.js");
        const societies = await Society.find({ bmcId });
        const societyIds = societies.map((s) => s.societyId);
        filter.societyId = { $in: [...societyIds, ALL_SOCIETIES_VALUE] };
      }
    }
    
    if (billingCycleId) filter.billingCycleId = billingCycleId;
    if (status) filter.status = Array.isArray(status) ? { $in: status } : status;

    const total = await Claims.countDocuments(filter);
    const claims = await Claims.find(filter)
      .populate("approvedBy", "name email")
      .limit(Number(limit))
      .skip(Number(skip))
      .sort({ createdAt: -1 });

    res.json({
      data: claims,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: Number(skip) + claims.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getClaimById = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await Claims.findById(id).populate("approvedBy", "name email");

    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    res.json(claim);
  } catch (error) {
    console.error("Error fetching claim:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, description, remarks, status } = req.body;

    const claim = await Claims.findById(id);
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    if (claim.status === "applied" || claim.status === "rejected") {
      return res.status(400).json({ error: "Cannot update claim in current status" });
    }

    if (category) claim.category = category;
    if (amount && amount > 0) claim.amount = amount;
    if (description !== undefined) claim.description = description;
    if (remarks !== undefined) claim.remarks = remarks;
    if (status) {
      claim.status = status;
      if (status === "applied") {
        claim.appliedDate = new Date();
        claim.appliedBy = req.user._id;
      }
    }

    await claim.save();
    res.json(claim);
  } catch (error) {
    console.error("Error updating claim:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteClaim = async (req, res) => {
  try {
    const { id } = req.params;

    const claim = await Claims.findById(id);
    if (!claim) {
      return res.status(404).json({ error: "Claim not found" });
    }

    if (claim.status === "applied") {
      return res.status(400).json({ error: "Cannot delete applied claim" });
    }

    await Claims.deleteOne({ _id: id });
    res.json({ message: "Claim deleted successfully" });
  } catch (error) {
    console.error("Error deleting claim:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getClaimsByCycle = async (req, res) => {
  try {
    const { billingCycleId } = req.params;

    const claims = await Claims.find({ billingCycleId, status: "applied" });

    // Group by society
    const groupedBySociety = {};
    claims.forEach((claim) => {
      if (!groupedBySociety[claim.societyId]) {
        groupedBySociety[claim.societyId] = [];
      }
      groupedBySociety[claim.societyId].push(claim);
    });

    res.json(groupedBySociety);
  } catch (error) {
    console.error("Error fetching claims by cycle:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
