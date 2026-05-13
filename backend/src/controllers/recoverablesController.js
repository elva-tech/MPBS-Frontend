import { Recoverables } from "../models/Recoverables.js";
import { Society } from "../models/Society.js";

const ALL_SOCIETIES_VALUE = "ALL";

export const createRecoverable = async (req, res) => {
  try {
    const {
      category,
      totalAmount,
      totalCycles,
      description,
      societyId,
      startCycleId,
      remarks,
    } = req.body;

    // Validate inputs
    if (!category || !totalAmount || !totalCycles || !societyId || !startCycleId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (totalAmount <= 0 || totalCycles <= 0) {
      return res.status(400).json({ error: "Amount and cycles must be greater than 0" });
    }

    // Verify society exists unless this applies to all societies
    if (societyId !== ALL_SOCIETIES_VALUE) {
      const society = await Society.findOne({ societyId });
      if (!society) {
        return res.status(404).json({ error: "Society not found" });
      }
    }

    const amountPerCycle = totalAmount / totalCycles;

    const recoverable = new Recoverables({
      category,
      totalAmount,
      amountPerCycle,
      totalCycles,
      description,
      societyId,
      startCycleId,
      remainingAmount: totalAmount,
      remarks,
      createdBy: req.user._id,
      status: "active",
    });

    await recoverable.save();
    res.status(201).json(recoverable);
  } catch (error) {
    console.error("Error creating recoverable:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRecoverables = async (req, res) => {
  try {
    const { societyId, status, bmcId, allSocieties, limit = 100, skip = 0 } = req.query;

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
    
    if (status) filter.status = Array.isArray(status) ? { $in: status } : status;

    const total = await Recoverables.countDocuments(filter);
    const recoverables = await Recoverables.find(filter)
      .populate("createdBy", "name email")
      .limit(Number(limit))
      .skip(Number(skip))
      .sort({ createdAt: -1 });

    res.json({
      data: recoverables,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: Number(skip) + recoverables.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching recoverables:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRecoverableById = async (req, res) => {
  try {
    const { id } = req.params;

    const recoverable = await Recoverables.findById(id).populate("createdBy", "name email");

    if (!recoverable) {
      return res.status(404).json({ error: "Recoverable not found" });
    }

    res.json(recoverable);
  } catch (error) {
    console.error("Error fetching recoverable:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateRecoverable = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, totalAmount, totalCycles, description, remarks, status } = req.body;

    const recoverable = await Recoverables.findById(id);
    if (!recoverable) {
      return res.status(404).json({ error: "Recoverable not found" });
    }

    if (recoverable.status === "completed") {
      return res.status(400).json({ error: "Cannot update completed recoverable" });
    }

    if (category) recoverable.category = category;
    if (description !== undefined) recoverable.description = description;
    if (remarks !== undefined) recoverable.remarks = remarks;
    if (status) recoverable.status = status;

    await recoverable.save();
    res.json(recoverable);
  } catch (error) {
    console.error("Error updating recoverable:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteRecoverable = async (req, res) => {
  try {
    const { id } = req.params;

    const recoverable = await Recoverables.findById(id);
    if (!recoverable) {
      return res.status(404).json({ error: "Recoverable not found" });
    }

    if (recoverable.appliedCycles && recoverable.appliedCycles.length > 0) {
      return res.status(400).json({ error: "Cannot delete recoverable that has been applied" });
    }

    await Recoverables.deleteOne({ _id: id });
    res.json({ message: "Recoverable deleted successfully" });
  } catch (error) {
    console.error("Error deleting recoverable:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const applyRecoverableForCycle = async (req, res) => {
  try {
    const { id, cycleId } = req.params;

    const recoverable = await Recoverables.findById(id);
    if (!recoverable) {
      return res.status(404).json({ error: "Recoverable not found" });
    }

    if (recoverable.status === "completed" || recoverable.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "Cannot apply recoverable with status: " + recoverable.status });
    }

    if (recoverable.currentCycleIndex >= recoverable.totalCycles) {
      recoverable.status = "completed";
      await recoverable.save();
      return res.status(400).json({ error: "All cycles completed for this recoverable" });
    }

    recoverable.appliedCycles.push({
      cycleId,
      amount: recoverable.amountPerCycle,
      appliedDate: new Date(),
    });

    recoverable.currentCycleIndex += 1;
    recoverable.remainingAmount = Math.max(
      0,
      recoverable.totalAmount - recoverable.amountPerCycle * recoverable.currentCycleIndex
    );

    if (recoverable.currentCycleIndex >= recoverable.totalCycles) {
      recoverable.status = "completed";
    }

    await recoverable.save();
    res.json(recoverable);
  } catch (error) {
    console.error("Error applying recoverable:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getActiveRecoverablesForCycle = async (req, res) => {
  try {
    const { billingCycleId } = req.params;

    // Find all active recoverables that haven't been completed
    const recoverables = await Recoverables.find({ status: "active" });

    // Filter those that apply to this cycle
    const applicableRecoverables = recoverables.filter((rec) => {
      const cyclesCompleted = rec.appliedCycles.length;
      return cyclesCompleted < rec.totalCycles;
    });

    // Group by society
    const groupedBySociety = {};
    applicableRecoverables.forEach((rec) => {
      if (!groupedBySociety[rec.societyId]) {
        groupedBySociety[rec.societyId] = [];
      }
      groupedBySociety[rec.societyId].push(rec);
    });

    res.json(groupedBySociety);
  } catch (error) {
    console.error("Error fetching active recoverables:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
