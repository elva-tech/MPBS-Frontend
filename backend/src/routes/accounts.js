import express from "express";
import { z } from "zod";
import { authRequired, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  accountsReportSummary,
  assignScheme,
  createBillingCycle,
  createClaim,
  createRecoverable,
  createScheme,
  deleteClaimRecord,
  deleteRecoverableRecord,
  deductionsReport,
  disburseBillingCycle,
  getAccountsDashboard,
  getBillingSummary,
  getInvoice,
  getInvoicePdf,
  getSocietyBilling,
  listBillingCycles,
  listClaims,
  listRecoverables,
  listSchemes,
  lockBillingCycle,
  payoutReport,
  schemesReport,
  toggleScheme,
  runBillingCycle,
  updateClaim,
  updateRecoverable,
} from "../controllers/accountsController.js";

const router = express.Router();

const readRoles = ["Admin", "Account", "Accounts", "Audit", "Auditor"];
const writeRoles = ["Admin", "Account", "Accounts"];

router.use(authRequired);

router.get("/accounts/dashboard", requireRole(readRoles), getAccountsDashboard);

router
  .route("/accounts/claims")
  .get(requireRole(readRoles), listClaims)
  .post(
    requireRole(writeRoles),
    validate(
      z.object({
        societyId: z.string().min(1),
        billingCycleId: z.string().min(1),
        type: z.string().min(1),
        amount: z.number(),
        status: z.enum(["APPLIED", "PENDING"]).optional(),
        description: z.string().optional(),
      })
    ),
    createClaim
  );

router.patch(
  "/accounts/claims/:id",
  requireRole(writeRoles),
  validate(
    z.object({
      status: z.enum(["APPLIED", "PENDING"]).optional(),
      amount: z.number().optional(),
      type: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  updateClaim
);
router.delete("/accounts/claims/:id", requireRole(writeRoles), deleteClaimRecord);

router
  .route("/accounts/recoverables")
  .get(requireRole(readRoles), listRecoverables)
  .post(
    requireRole(writeRoles),
    validate(
      z.object({
        societyId: z.string().min(1),
        reason: z.string().min(1),
        totalAmount: z.number(),
        remainingAmount: z.number().optional(),
        installmentAmount: z.number(),
        status: z.enum(["ACTIVE", "CLOSED"]).optional(),
      })
    ),
    createRecoverable
  );

router.patch(
  "/accounts/recoverables/:id",
  requireRole(writeRoles),
  validate(
    z.object({
      status: z.enum(["ACTIVE", "CLOSED"]).optional(),
      installmentAmount: z.number().optional(),
      remainingAmount: z.number().optional(),
      reason: z.string().optional(),
    })
  ),
  updateRecoverable
);
router.delete("/accounts/recoverables/:id", requireRole(writeRoles), deleteRecoverableRecord);

router
  .route("/billing-cycles")
  .get(requireRole(readRoles), listBillingCycles)
  .post(
    requireRole(writeRoles),
    validate(
      z.object({
        date: z.string().min(1).optional(),
        code: z.string().min(1).optional(),
        startDate: z.string().min(1).optional(),
        endDate: z.string().min(1).optional(),
        status: z.enum(["OPEN", "CALCULATED", "LOCKED", "PAID"]).optional(),
      })
    ),
    createBillingCycle
  );

router.post("/billing-cycles/:id/run", requireRole(writeRoles), runBillingCycle);
router.post("/billing-cycles/:id/lock", requireRole(writeRoles), lockBillingCycle);
router.post("/billing-cycles/:id/disburse", requireRole(writeRoles), disburseBillingCycle);

router.get("/billing/:cycleId", requireRole(readRoles), getBillingSummary);
router.get("/billing/:cycleId/society/:societyId", requireRole(readRoles), getSocietyBilling);

router
  .route("/schemes")
  .get(requireRole(readRoles), listSchemes)
  .post(
    requireRole(writeRoles),
    validate(
      z.object({
        name: z.string().min(1),
        type: z.enum(["DEDUCTION", "INCENTIVE", "FIXED", "CONDITIONAL"]),
        calculationType: z.enum(["PER_LITRE", "FIXED", "CONDITION"]),
        value: z.number(),
        isActive: z.boolean().optional(),
        appliesTo: z.array(z.string()).optional(),
        condition: z
          .object({
            metric: z.string().optional(),
            op: z.enum([">", ">=", "<", "<="]),
            threshold: z.number(),
          })
          .optional(),
      })
    ),
    createScheme
  );

router.post("/schemes/:id/toggle", requireRole(writeRoles), toggleScheme);
router.post(
  "/schemes/:id/assign",
  requireRole(writeRoles),
  validate(
    z.object({
      societyId: z.string().optional(),
      societyIds: z.array(z.string()).optional(),
      isEnabled: z.boolean().optional(),
    })
  ),
  assignScheme
);

router
  .route("/claims")
  .get(requireRole(readRoles), listClaims)
  .post(
    requireRole(writeRoles),
    validate(
      z.object({
        societyId: z.string().min(1),
        billingCycleId: z.string().min(1),
        type: z.string().min(1),
        amount: z.number(),
        status: z.enum(["APPLIED", "PENDING"]).optional(),
        description: z.string().optional(),
      })
    ),
    createClaim
  );

router
  .route("/recoverables")
  .get(requireRole(readRoles), listRecoverables)
  .post(
    requireRole(writeRoles),
    validate(
      z.object({
        societyId: z.string().min(1),
        reason: z.string().min(1),
        totalAmount: z.number(),
        remainingAmount: z.number().optional(),
        installmentAmount: z.number(),
        status: z.enum(["ACTIVE", "CLOSED"]).optional(),
      })
    ),
    createRecoverable
  );

router.get("/invoice/:societyBillingId", requireRole(readRoles), getInvoice);
router.get("/invoice/:societyBillingId/pdf", requireRole(readRoles), getInvoicePdf);

router.get("/reports/payout", requireRole(readRoles), payoutReport);
router.get("/reports/deductions", requireRole(readRoles), deductionsReport);
router.get("/reports/schemes", requireRole(readRoles), schemesReport);
router.get("/reports/summary", requireRole(readRoles), accountsReportSummary);

export default router;