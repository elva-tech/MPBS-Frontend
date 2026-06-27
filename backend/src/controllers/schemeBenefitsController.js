import { SchemeBenefits } from "../models/SchemeBenefits.js";
import { Society } from "../models/Society.js";

const ALL_SOCIETIES_VALUE = "ALL";

export const createSchemeBenefit = async (req, res) => {
  try {
    const { amount, description, societyId, billingCycleId, schemeType, remarks } = req.body;

    // Validate inputs
    if (!amount || !societyId || !billingCycleId || !schemeType) {
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

    const schemeBenefit = new SchemeBenefits({
      amount,
      description,
      societyId,
      billingCycleId,
      schemeType,
      remarks,
      approvedBy: req.user._id,
      status: "approved",
    });

    await schemeBenefit.save();
    res.status(201).json(schemeBenefit);
  } catch (error) {
    console.error("Error creating scheme benefit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSchemeBenefits = async (req, res) => {
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

    const total = await SchemeBenefits.countDocuments(filter);
    const benefits = await SchemeBenefits.find(filter)
      .populate("approvedBy", "name email")
      .limit(Number(limit))
      .skip(Number(skip))
      .sort({ createdAt: -1 });

    res.json({
      data: benefits,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: Number(skip) + benefits.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching scheme benefits:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSchemeBenefitById = async (req, res) => {
  try {
    const { id } = req.params;

    const benefit = await SchemeBenefits.findById(id).populate("approvedBy", "name email");

    if (!benefit) {
      return res.status(404).json({ error: "Scheme benefit not found" });
    }

    res.json(benefit);
  } catch (error) {
    console.error("Error fetching scheme benefit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateSchemeBenefit = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, remarks, status, schemeType } = req.body;

    const benefit = await SchemeBenefits.findById(id);
    if (!benefit) {
      return res.status(404).json({ error: "Scheme benefit not found" });
    }

    if (benefit.status === "applied" || benefit.status === "cancelled") {
      return res.status(400).json({ error: "Cannot update benefit in current status" });
    }

    if (amount && amount > 0) benefit.amount = amount;
    if (description !== undefined) benefit.description = description;
    if (remarks !== undefined) benefit.remarks = remarks;
    if (status) {
      benefit.status = status;
      if (status === "applied") {
        benefit.appliedDate = new Date();
        benefit.appliedBy = req.user._id;
      }
    }
    if (schemeType) benefit.schemeType = schemeType;

    await benefit.save();
    res.json(benefit);
  } catch (error) {
    console.error("Error updating scheme benefit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSchemeBenefit = async (req, res) => {
  try {
    const { id } = req.params;

    const benefit = await SchemeBenefits.findById(id);
    if (!benefit) {
      return res.status(404).json({ error: "Scheme benefit not found" });
    }

    if (benefit.status === "applied") {
      return res.status(400).json({ error: "Cannot delete applied benefit" });
    }

    await SchemeBenefits.deleteOne({ _id: id });
    res.json({ message: "Scheme benefit deleted successfully" });
  } catch (error) {
    console.error("Error deleting scheme benefit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSchemeBenefitsByCycle = async (req, res) => {
  try {
    const { billingCycleId } = req.params;

    const benefits = await SchemeBenefits.find({ billingCycleId, status: "applied" });

    // Group by society
    const groupedBySociety = {};
    benefits.forEach((benefit) => {
      if (!groupedBySociety[benefit.societyId]) {
        groupedBySociety[benefit.societyId] = [];
      }
      groupedBySociety[benefit.societyId].push(benefit);
    });

    res.json(groupedBySociety);
  } catch (error) {
    console.error("Error fetching scheme benefits by cycle:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
