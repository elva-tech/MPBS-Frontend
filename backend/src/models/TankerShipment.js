import mongoose from "mongoose";

const StopSchema = new mongoose.Schema(
  {
    bmc: { type: String, required: true },
    bmcId: { type: String, default: "" },
    societies: { type: Number, default: 0 },
    milkType: { type: String, enum: ["Cow", "Buffalo"], required: true },
    expected: { type: Number, required: true },
    received: { type: Number, default: 0 },
  },
  { _id: false }
);

const QualityRowSchema = new mongoose.Schema(
  {
    parameter: { type: String, required: true },
    routeSheet: { type: String, default: "" },
    dairyTest: { type: String, default: "" },
  },
  { _id: false }
);

const DiscrepancySchema = new mongoose.Schema(
  {
    type: { type: String, default: "" },
    remarks: { type: String, default: "" },
    evidenceName: { type: String, default: "" },
    penaltyRate: { type: Number, default: 35 },
    deduction: { type: Number, default: 0 },
  },
  { _id: false }
);

const TankerShipmentSchema = new mongoose.Schema(
  {
    tankerId: { type: String, required: true, index: true },
    route: { type: String, required: true },
    dairyUnit: { type: String, default: "", index: true },
    arrivalTime: { type: String, default: "-" },
    transporter: { type: String, default: "-" },
    shift: { type: String, enum: ["Morning", "Evening"], default: "Morning" },
    receivedDate: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "in_verification", "approved", "penalty", "rejected"],
      default: "pending",
      index: true,
    },
    stops: { type: [StopSchema], default: [] },
    quality: { type: [QualityRowSchema], default: [] },
    discrepancy: { type: DiscrepancySchema, default: null },
    approvedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

TankerShipmentSchema.index({ tankerId: 1, route: 1, receivedDate: 1 });

export const TankerShipment = mongoose.model("TankerShipment", TankerShipmentSchema);
