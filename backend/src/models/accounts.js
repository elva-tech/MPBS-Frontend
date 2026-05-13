import mongoose from "mongoose";

const BillingCycleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["OPEN", "CALCULATED", "LOCKED", "PAID"],
      default: "OPEN",
    },
    createdBy: { type: String },
    reviewedBy: { type: String },
  },
  { timestamps: true }
);

BillingCycleSchema.index({ code: 1 }, { unique: true });

const SchemeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["DEDUCTION", "INCENTIVE", "FIXED", "CONDITIONAL"],
      required: true,
    },
    calculationType: {
      type: String,
      enum: ["PER_LITRE", "FIXED", "CONDITION"],
      required: true,
    },
    value: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    appliesTo: { type: [String], default: [] },
    condition: {
      metric: { type: String },
      op: { type: String },
      threshold: { type: Number },
    },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

const ClaimSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, index: true },
    billingCycleId: { type: String, required: true, index: true },
    type: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["APPLIED", "PENDING"],
      default: "APPLIED",
    },
    description: { type: String, default: "" },
    createdBy: { type: String },
  },
  { timestamps: true }
);

const RecoverableSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, index: true },
    reason: { type: String, required: true, trim: true },
    totalAmount: { type: Number, required: true },
    remainingAmount: { type: Number, required: true },
    installmentAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "CLOSED"],
      default: "ACTIVE",
    },
    createdBy: { type: String },
  },
  { timestamps: true }
);

const RecoverableTransactionSchema = new mongoose.Schema(
  {
    recoverableId: { type: String, required: true, index: true },
    billingCycleId: { type: String, required: true, index: true },
    societyId: { type: String, required: true, index: true },
    deductedAmount: { type: Number, required: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

const SocietyBillingSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, index: true },
    billingCycleId: { type: String, required: true, index: true },
    totalMilkQty: { type: Number, default: 0 },
    milkAmount: { type: Number, default: 0 },
    totalClaims: { type: Number, default: 0 },
    totalRecoverables: { type: Number, default: 0 },
    totalSchemeDeductions: { type: Number, default: 0 },
    totalSchemeBenefits: { type: Number, default: 0 },
    transportPenalty: { type: Number, default: 0 },
    netPayable: { type: Number, default: 0 },
    averageFat: { type: Number, default: 0 },
    averageSnf: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["CALCULATED", "LOCKED", "PAID"],
      default: "CALCULATED",
    },
    lockedAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

SocietyBillingSchema.index({ societyId: 1, billingCycleId: 1 }, { unique: true });

const BillingLineItemSchema = new mongoose.Schema(
  {
    societyBillingId: { type: String, required: true, index: true },
    billingCycleId: { type: String, required: true, index: true },
    societyId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["MILK", "CLAIM", "RECOVERABLE", "SCHEME", "PENALTY"],
      required: true,
    },
    referenceId: { type: String, default: "" },
    amount: { type: Number, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const PaymentSchema = new mongoose.Schema(
  {
    societyId: { type: String, required: true, index: true },
    billingCycleId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["INITIATED", "SUCCESS", "FAILED"],
      default: "INITIATED",
    },
    transactionRef: { type: String, default: "" },
    createdBy: { type: String },
  },
  { timestamps: true }
);

const AccountAuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, trim: true },
    entityType: { type: String, default: "" },
    entityId: { type: String, default: "" },
    performedBy: { type: String, default: "" },
    performedRole: { type: String, default: "" },
    details: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const BillingCycle = mongoose.model("BillingCycle", BillingCycleSchema);
export const Scheme = mongoose.model("Scheme", SchemeSchema);
export const Claim = mongoose.model("Claim", ClaimSchema);
export const Recoverable = mongoose.model("Recoverable", RecoverableSchema);
export const RecoverableTransaction = mongoose.model("RecoverableTransaction", RecoverableTransactionSchema);
export const SocietyBilling = mongoose.model("SocietyBilling", SocietyBillingSchema);
export const BillingLineItem = mongoose.model("BillingLineItem", BillingLineItemSchema);
export const Payment = mongoose.model("Payment", PaymentSchema);
export const AccountAuditLog = mongoose.model("AccountAuditLog", AccountAuditLogSchema);