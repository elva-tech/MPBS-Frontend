import { Check, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  addAdjustmentRecord,
  deleteAdjustmentRecord,
  fetchAccountState,
  setAccountSelections,
  toggleAdjustmentRecord,
} from "./accountService";
import { usePopup } from "../../shared/context/PopupContext";

const initialForm = {
  kind: "CLAIM",
  societyId: "ALL",
  cycleId: "",
  amount: "",
  installmentAmount: "",
  reason: "",
};

const ADJUSTMENT_TYPES = [
  { value: "CLAIM", label: "Claim", hint: "Add an approved payable amount" },
  { value: "RECOVERABLE", label: "Recoverable", hint: "Recover an amount through installments" },
];

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatSignedCurrency(value, sign) {
  return `${sign}${formatCurrency(value)}`;
}

function formatSocietyLabel(societyId, societies = []) {
  if (societyId === "ALL") return "All Societies";
  const society = societies.find((item) => item.id === societyId);
  return society ? `${society.id} - ${society.name}` : societyId || "-";
}

function getStepError(step, form, state) {
  if (step === 0 && !ADJUSTMENT_TYPES.some((item) => item.value === form.kind)) return "Choose claim or recoverable.";
  if (step === 1) {
    if (!form.societyId) return "Select a society.";
    if (!form.cycleId) return "Select a billing cycle.";
    if (form.societyId !== "ALL" && !state.societies?.some((society) => society.id === form.societyId)) {
      return "Selected society is not available.";
    }
    if (!state.cycles?.some((cycle) => cycle.id === form.cycleId)) return "Selected billing cycle is not available.";
  }
  if (step === 2) {
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) return "Enter an amount greater than zero.";
    if (form.kind === "RECOVERABLE") {
      const installment = Number(form.installmentAmount || form.amount);
      if (Number.isNaN(installment) || installment <= 0) return "Enter an installment amount greater than zero.";
      if (installment > amount) return "Installment cannot be greater than total recoverable amount.";
    }
  }
  if (step === 3 && !form.reason.trim()) return "Enter a reason.";
  return "";
}

function buildPayload(form) {
  const amount = Number(form.amount || 0);
  return {
    kind: form.kind,
    societyId: form.societyId,
    cycleId: form.cycleId,
    amount,
    reason: form.reason.trim(),
    installmentAmount: form.kind === "RECOVERABLE" ? Number(form.installmentAmount || amount) : undefined,
  };
}

function InputLabel({ children }) {
  return <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#5B6B7F]">{children}</label>;
}

export default function ClaimsRecoverables() {
  const { showConfirm } = usePopup();
  const [state, setState] = useState({ claims: [], recoverables: [], societies: [], cycles: [], selectedCycleId: "" });
  const [tab, setTab] = useState("All");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;
    fetchAccountState().then((next) => {
      if (!active) return;
      setState(next);
      setForm((current) => ({
        ...current,
        cycleId: current.cycleId || next.selectedCycleId || next.cycles?.at(-1)?.id || "",
      }));
    });
    return () => {
      active = false;
    };
  }, []);

  const steps = ["Type", "Society", "Amount", "Reason"];
  const selectedType = ADJUSTMENT_TYPES.find((item) => item.value === form.kind) || ADJUSTMENT_TYPES[0];

  const rows = useMemo(() => {
    const claimRows = state.claims.map((item) => ({
      id: item.id,
      type: "Claim",
      society: formatSocietyLabel(item.societyId, state.societies),
      amount: formatSignedCurrency(item.amount, "+"),
      reason: item.reason,
      cycle: item.cycleId,
      status: item.status === "APPLIED" ? "Enabled" : "Disabled",
    }));

    const recoverableRows = state.recoverables.map((item) => ({
      id: item.id,
      type: "Recoverable",
      society: formatSocietyLabel(item.societyId, state.societies),
      amount: formatSignedCurrency(item.remainingAmount, "-"),
      reason: `${item.reason} (Inst: ${formatCurrency(item.installmentAmount)})`,
      cycle: state.selectedCycleId,
      status: item.status === "ACTIVE" ? "Enabled" : "Disabled",
    }));

    return [...claimRows, ...recoverableRows];
  }, [state]);

  const filtered = useMemo(() => {
    if (tab === "All") return rows;
    if (tab === "Claims") return rows.filter((item) => item.type === "Claim");
    return rows.filter((item) => item.type === "Recoverable");
  }, [rows, tab]);

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "kind" && value === "CLAIM" ? { installmentAmount: "" } : {}),
    }));
    setFormError("");
  };

  const resetForm = (nextState = state) => {
    setStep(0);
    setForm({
      ...initialForm,
      societyId: "ALL",
      cycleId: nextState.selectedCycleId || nextState.cycles?.at(-1)?.id || "",
    });
    setFormError("");
  };

  const openForm = () => {
    setShowForm(true);
    resetForm();
    setMessage("");
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const goNext = () => {
    const error = getStepError(step, form, state);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setFormError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSave = async () => {
    const error = getStepError(step, form, state);
    if (error) {
      setFormError(error);
      return;
    }

    const payload = buildPayload(form);
    try {
      const res = await addAdjustmentRecord(payload);
      setAccountSelections({ cycleId: payload.cycleId, societyId: payload.societyId === "ALL" ? "" : payload.societyId });
      setState(res.state);
      setMessage(res.message);
      setShowForm(false);
      resetForm(res.state);
    } catch (error) {
      setMessage(error.message || "Unable to save adjustment.");
    }
  };

  const handleDelete = async (row) => {
    const confirmed = await showConfirm({
      message: `Delete ${row.type.toLowerCase()} entry for ${row.society}?`,
    });
    if (!confirmed) return;
    try {
      const res = await deleteAdjustmentRecord(row.type === "Claim" ? "CLAIM" : "RECOVERABLE", row.id);
      setState(res.state);
      setMessage(res.message);
    } catch (error) {
      setMessage(error.message || "Unable to delete entry.");
    }
  };

  const handleStatusToggle = async (row) => {
    try {
      const res = await toggleAdjustmentRecord(row.type === "Claim" ? "CLAIM" : "RECOVERABLE", row.id);
      setState(res.state);
      setMessage(res.message);
    } catch (error) {
      setMessage(error.message || "Unable to update status.");
    }
  };

  return (
    <div className="module-page module-page-body text-[#1F2A44]">
      <div className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1E4B6B]">Claims & Recoverables</h1>
            <p className="mt-1 text-sm text-[#5B6B7F]">Add claims and recoverable deductions with a guided entry flow.</p>
          </div>
          <button
            type="button"
            onClick={showForm ? closeForm : openForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E73BE] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#185F9D]"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Close" : "Add Entry"}
          </button>
        </div>

        {message ? <p className="mb-3 rounded-lg bg-[#EEF4FF] px-3 py-2 text-sm text-[#1E4B6B]">{message}</p> : null}

        {showForm ? (
          <div className="mb-5 rounded-lg border border-[#D7E4FF] bg-[#F8FBFF] p-4">
            <div className="mb-4 grid gap-2 sm:grid-cols-4">
              {steps.map((item, index) => (
                <div
                  key={item}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    index === step
                      ? "border-[#1E73BE] bg-white text-[#1E4B6B]"
                      : index < step
                        ? "border-[#BFE5D3] bg-[#E6F5EE] text-[#1D7F50]"
                        : "border-[#E6EDF7] bg-white text-[#6B7A90]"
                  }`}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-current text-[11px] text-white">
                    {index < step ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  {item}
                </div>
              ))}
            </div>

            {step === 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {ADJUSTMENT_TYPES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateForm("kind", item.value)}
                    className={`rounded-lg border p-3 text-left ${
                      form.kind === item.value ? "border-[#1E73BE] bg-white shadow-sm" : "border-[#D7E4FF] bg-[#FBFDFF]"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-[#1E4B6B]">{item.label}</span>
                    <span className="mt-1 block text-xs text-[#5B6B7F]">{item.hint}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <InputLabel>Society</InputLabel>
                  <select
                    value={form.societyId}
                    onChange={(event) => updateForm("societyId", event.target.value)}
                    className="w-full rounded-lg border border-[#C9D8EE] bg-white px-3 py-2 text-sm text-[#1F2A44]"
                  >
                    <option value="ALL">All Societies</option>
                    {state.societies.map((society) => (
                      <option key={society.id} value={society.id}>
                        {society.id} - {society.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <InputLabel>Billing cycle</InputLabel>
                  <select
                    value={form.cycleId}
                    onChange={(event) => updateForm("cycleId", event.target.value)}
                    className="w-full rounded-lg border border-[#C9D8EE] bg-white px-3 py-2 text-sm text-[#1F2A44]"
                  >
                    <option value="">Select cycle</option>
                    {state.cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <InputLabel>{selectedType.label} amount</InputLabel>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => updateForm("amount", event.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-lg border border-[#C9D8EE] bg-white px-3 py-2 text-sm text-[#1F2A44]"
                  />
                </div>
                {form.kind === "RECOVERABLE" ? (
                  <div>
                    <InputLabel>Installment amount</InputLabel>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.installmentAmount}
                      onChange={(event) => updateForm("installmentAmount", event.target.value)}
                      placeholder="Defaults to full amount"
                      className="w-full rounded-lg border border-[#C9D8EE] bg-white px-3 py-2 text-sm text-[#1F2A44]"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#D7E4FF] bg-white px-3 py-2 text-sm text-[#5B6B7F]">
                    Claim entries are added directly to the selected billing cycle.
                  </div>
                )}
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <InputLabel>Reason</InputLabel>
                <textarea
                  value={form.reason}
                  onChange={(event) => updateForm("reason", event.target.value)}
                  placeholder={form.kind === "CLAIM" ? "Example: Approved subsidy claim" : "Example: Advance recovery"}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#C9D8EE] bg-white px-3 py-2 text-sm text-[#1F2A44]"
                />
              </div>
            ) : null}

            {formError ? <p className="mt-3 rounded-lg bg-[#FFF5DD] px-3 py-2 text-sm text-[#8A6A1F]">{formError}</p> : null}

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-[#C9D8EE] bg-white px-3 py-2 text-sm font-semibold text-[#1E4B6B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1E73BE] px-3 py-2 text-sm font-semibold text-white hover:bg-[#185F9D]"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#25A772] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1D8C5F]"
                >
                  <Check className="h-4 w-4" />
                  Save Entry
                </button>
              )}
            </div>
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-2">
          {["All", "Claims", "Recoverables"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded px-3 py-1.5 text-sm ${tab === item ? "bg-[#1E4B6B] text-white" : "bg-[#EEF4FF] text-[#1E4B6B]"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EDF7] text-left text-[#5B6B7F]">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Society</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2 pr-4">Cycle</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, index) => (
                <tr key={row.id || `${row.society}-${index}`} className="border-b border-[#F2F6FC]">
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.type === "Claim" ? "bg-[#E6F5EE] text-[#1D7F50]" : "bg-[#FFF5DD] text-[#8A6A1F]"
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-semibold">{row.society}</td>
                  <td className="py-3 pr-4">{row.amount}</td>
                  <td className="py-3 pr-4">{row.reason}</td>
                  <td className="py-3 pr-4">{row.cycle}</td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(row)}
                      className={`inline-flex min-w-[122px] items-center justify-between gap-2 rounded-full border px-2 py-1 text-xs font-semibold transition-colors ${
                        row.status === "Enabled"
                          ? "border-[#25A772] bg-[#25A772] text-white hover:bg-[#1D8C5F]"
                          : "border-[#CBD5E1] bg-[#F1F5F9] text-[#64748B] hover:bg-[#E8EEF5]"
                      }`}
                      aria-pressed={row.status === "Enabled"}
                      aria-label={`${row.status === "Enabled" ? "Disable" : "Enable"} ${row.type} for ${row.society}`}
                    >
                      <span>{row.status}</span>
                      <span
                        className={`relative h-5 w-9 rounded-full transition-colors ${
                          row.status === "Enabled" ? "bg-white/30" : "bg-[#CBD5E1]"
                        }`}
                        aria-hidden="true"
                      >
                        <span
                          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform ${
                            row.status === "Enabled" ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </span>
                    </button>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#F3C3C3] bg-[#FFF1F1] px-3 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-[#FFE4E4]"
                      aria-label={`Delete ${row.type} for ${row.society}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-sm text-[#5B6B7F]">
                    No entries found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
