import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addSchemeRecord, deleteSchemeRecord, fetchAccountState, toggleSchemeRecord } from "./accountService";
import { usePopup } from "../../shared/context/PopupContext";

const SCHEME_TYPES = [
  { value: "INCENTIVE", label: "Incentive", hint: "Adds a per litre benefit" },
  { value: "DEDUCTION", label: "Deduction", hint: "Deducts a per litre amount" },
  { value: "FIXED", label: "Fixed", hint: "Adds one fixed amount" },
  { value: "CONDITIONAL", label: "Conditional", hint: "Applies only when milk data matches" },
];

const CONDITION_METRICS = [
  { value: "avgFat", label: "Average FAT" },
  { value: "qty", label: "Milk Quantity" },
  { value: "milkAmount", label: "Milk Amount" },
];

const CONDITION_OPERATORS = [">", ">=", "<", "<="];

const initialForm = {
  name: "",
  type: "INCENTIVE",
  value: "",
  appliesMode: "ALL",
  selectedSocieties: [],
  conditionMetric: "avgFat",
  conditionOp: ">",
  conditionThreshold: "4",
};

function schemeTypeLabel(type) {
  if (type === "DEDUCTION") return "Deduction";
  if (type === "INCENTIVE") return "Incentive";
  if (type === "FIXED") return "Fixed";
  return "Conditional";
}

function formatSchemeValue(scheme) {
  const sign = scheme.type === "DEDUCTION" ? "-" : "+";
  if (scheme.calculationType === "PER_LITRE" || scheme.calculationType === "CONDITION") return `${sign}Rs ${scheme.value}/L`;
  return `${sign}Rs ${Number(scheme.value || 0).toLocaleString("en-IN")}`;
}

function appliedLabel(scheme) {
  if (scheme.appliesTo?.includes("ALL")) return "All Societies";
  return `${scheme.appliesTo?.length || 0} Societies`;
}

function getCalculationType(type) {
  if (type === "FIXED") return "FIXED";
  if (type === "CONDITIONAL") return "CONDITION";
  return "PER_LITRE";
}

function getStepError(step, form, societies) {
  if (step === 0 && !form.name.trim()) return "Enter a scheme name.";
  if (step === 1 && !SCHEME_TYPES.some((item) => item.value === form.type)) return "Choose a valid scheme type.";
  if (step === 2) {
    const value = Number(form.value);
    if (!form.value || Number.isNaN(value) || value <= 0) return "Enter an amount greater than zero.";
    if (form.type === "CONDITIONAL") {
      const threshold = Number(form.conditionThreshold);
      if (Number.isNaN(threshold)) return "Enter a valid condition threshold.";
    }
  }
  if (step === 3 && form.appliesMode === "SELECTED") {
    if (!societies.length) return "No societies are available to select.";
    if (!form.selectedSocieties.length) return "Select at least one society.";
  }
  return "";
}

function buildPayload(form) {
  const payload = {
    name: form.name.trim(),
    type: form.type,
    calculationType: getCalculationType(form.type),
    value: Number(form.value || 0),
    appliesTo: form.appliesMode === "ALL" ? ["ALL"] : form.selectedSocieties,
  };

  if (form.type === "CONDITIONAL") {
    payload.condition = {
      metric: form.conditionMetric,
      op: form.conditionOp,
      threshold: Number(form.conditionThreshold || 0),
    };
  }

  return payload;
}

function InputLabel({ children }) {
  return <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#5B6B7F]">{children}</label>;
}

export default function Schemes() {
  const { showConfirm } = usePopup();
  const [state, setState] = useState({ schemes: [], societies: [] });
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;
    fetchAccountState().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(() => state.schemes, [state.schemes]);
  const societies = useMemo(() => state.societies || [], [state.societies]);
  const selectedType = SCHEME_TYPES.find((item) => item.value === form.type) || SCHEME_TYPES[0];
  const steps = ["Name", "Type", "Amount", "Apply"];

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "type" && value !== "CONDITIONAL" ? { conditionMetric: "avgFat", conditionOp: ">", conditionThreshold: "4" } : {}),
    }));
    setFormError("");
  };

  const handleToggle = async (schemeId) => {
    try {
      const res = await toggleSchemeRecord(schemeId);
      setState(res.state);
      setMessage(res.message);
    } catch (error) {
      setMessage(error.message || "Unable to update scheme.");
    }
  };

  const handleDelete = async (scheme) => {
    const confirmed = await showConfirm({ message: `Delete scheme "${scheme.name}"?` });
    if (!confirmed) return;
    try {
      const res = await deleteSchemeRecord(scheme.id);
      setState(res.state);
      setMessage(res.message);
    } catch (error) {
      setMessage(error.message || "Unable to delete scheme.");
    }
  };

  const openForm = () => {
    setShowForm(true);
    setStep(0);
    setForm(initialForm);
    setFormError("");
    setMessage("");
  };

  const closeForm = () => {
    setShowForm(false);
    setStep(0);
    setForm(initialForm);
    setFormError("");
  };

  const goNext = () => {
    const error = getStepError(step, form, societies);
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

  const handleSocietyToggle = (societyId) => {
    setForm((current) => {
      const selected = new Set(current.selectedSocieties);
      if (selected.has(societyId)) selected.delete(societyId);
      else selected.add(societyId);
      return { ...current, selectedSocieties: Array.from(selected) };
    });
    setFormError("");
  };

  const handleSave = async () => {
    const error = getStepError(step, form, societies);
    if (error) {
      setFormError(error);
      return;
    }

    try {
      const res = await addSchemeRecord(buildPayload(form));
      setState(res.state);
      setMessage(res.message);
      closeForm();
    } catch (error) {
      setMessage(error.message || "Unable to save scheme.");
    }
  };

  return (
    <div className="module-page module-page-body text-[#1F2A44]">
      <div className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1E4B6B]">Schemes Management</h1>
            <p className="mt-1 text-sm text-[#5B6B7F]">Create and manage society-level payout rules.</p>
          </div>
          <button
            type="button"
            onClick={showForm ? closeForm : openForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1E73BE] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#185F9D]"
          >
            {!showForm ? <Plus className="h-4 w-4" /> : null}
            {showForm ? "Close" : "Add Scheme"}
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
              <div>
                <InputLabel>Scheme name</InputLabel>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Example: Quality Incentive"
                  className="w-full rounded-lg border border-[#C9D8EE] bg-white px-3 py-2 text-sm text-[#1F2A44]"
                />
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {SCHEME_TYPES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => updateForm("type", item.value)}
                    className={`rounded-lg border p-3 text-left ${
                      form.type === item.value ? "border-[#1E73BE] bg-white shadow-sm" : "border-[#D7E4FF] bg-[#FBFDFF]"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-[#1E4B6B]">{item.label}</span>
                    <span className="mt-1 block text-xs text-[#5B6B7F]">{item.hint}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
                <div>
                  <InputLabel>{selectedType.label} amount</InputLabel>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={(event) => updateForm("value", event.target.value)}
                    placeholder={form.type === "FIXED" ? "Fixed amount" : "Amount per litre"}
                    className="w-full rounded-lg border border-[#C9D8EE] bg-white px-3 py-2 text-sm text-[#1F2A44]"
                  />
                  <p className="mt-2 text-xs text-[#5B6B7F]">
                    {form.type === "FIXED" ? "This amount is added once per bill." : "This amount is calculated against the milk quantity."}
                  </p>
                </div>

                {form.type === "CONDITIONAL" ? (
                  <div className="rounded-lg border border-[#D7E4FF] bg-white p-3">
                    <InputLabel>Condition</InputLabel>
                    <div className="grid grid-cols-[1fr_80px_1fr] gap-2">
                      <select
                        value={form.conditionMetric}
                        onChange={(event) => updateForm("conditionMetric", event.target.value)}
                        className="rounded-lg border border-[#C9D8EE] bg-white px-2 py-2 text-sm"
                      >
                        {CONDITION_METRICS.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={form.conditionOp}
                        onChange={(event) => updateForm("conditionOp", event.target.value)}
                        className="rounded-lg border border-[#C9D8EE] bg-white px-2 py-2 text-sm"
                      >
                        {CONDITION_OPERATORS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={form.conditionThreshold}
                        onChange={(event) => updateForm("conditionThreshold", event.target.value)}
                        className="rounded-lg border border-[#C9D8EE] bg-white px-2 py-2 text-sm"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <InputLabel>Apply scheme to</InputLabel>
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => updateForm("appliesMode", "ALL")}
                    className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold ${
                      form.appliesMode === "ALL" ? "border-[#1E73BE] bg-white text-[#1E4B6B]" : "border-[#D7E4FF] bg-[#FBFDFF] text-[#5B6B7F]"
                    }`}
                  >
                    All societies
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm("appliesMode", "SELECTED")}
                    className={`rounded-lg border px-3 py-2 text-left text-sm font-semibold ${
                      form.appliesMode === "SELECTED" ? "border-[#1E73BE] bg-white text-[#1E4B6B]" : "border-[#D7E4FF] bg-[#FBFDFF] text-[#5B6B7F]"
                    }`}
                  >
                    Selected societies
                  </button>
                </div>

                {form.appliesMode === "SELECTED" ? (
                  <div className="grid max-h-52 gap-2 overflow-y-auto rounded-lg border border-[#D7E4FF] bg-white p-2 sm:grid-cols-2 lg:grid-cols-3">
                    {societies.map((society) => (
                      <label key={society.id} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-[#F2F7FF]">
                        <input
                          type="checkbox"
                          checked={form.selectedSocieties.includes(society.id)}
                          onChange={() => handleSocietyToggle(society.id)}
                          className="h-4 w-4 accent-[#1E73BE]"
                        />
                        <span className="font-semibold text-[#1F2A44]">{society.id}</span>
                        <span className="truncate text-[#5B6B7F]">{society.name}</span>
                      </label>
                    ))}
                    {!societies.length ? <p className="px-2 py-3 text-sm text-[#8A6A1F]">No societies loaded yet.</p> : null}
                  </div>
                ) : null}
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
                  Save Scheme
                </button>
              )}
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EDF7] text-left text-[#5B6B7F]">
                <th className="py-2 pr-4">Scheme Name</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Value</th>
                <th className="py-2 pr-4">Applied To</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Delete</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[#F2F6FC]">
                  <td className="py-3 pr-4 font-semibold">{row.name}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-xs font-semibold text-[#1E4B6B]">{schemeTypeLabel(row.type)}</span>
                  </td>
                  <td className="py-3 pr-4">{formatSchemeValue(row)}</td>
                  <td className="py-3 pr-4">{appliedLabel(row)}</td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleToggle(row.id)}
                      className={`inline-flex min-w-[122px] items-center justify-between gap-2 rounded-full border px-2 py-1 text-xs font-semibold transition-colors ${
                        row.isActive
                          ? "border-[#25A772] bg-[#25A772] text-white hover:bg-[#1D8C5F]"
                          : "border-[#CBD5E1] bg-[#F1F5F9] text-[#64748B] hover:bg-[#E8EEF5]"
                      }`}
                      aria-pressed={row.isActive}
                      aria-label={`${row.isActive ? "Mark not included" : "Include"} ${row.name}`}
                    >
                      <span>{row.isActive ? "Included" : "Not Included"}</span>
                      <span
                        className={`relative h-5 w-9 rounded-full transition-colors ${row.isActive ? "bg-white/30" : "bg-[#CBD5E1]"}`}
                        aria-hidden="true"
                      >
                        <span
                          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full shadow-sm transition-transform ${
                            row.isActive ? "translate-x-4" : "translate-x-0.5"
                          } ${row.isActive ? "bg-white" : "bg-white"}`}
                        />
                      </span>
                    </button>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => handleDelete(row)}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#F3C3C3] bg-[#FFF1F1] px-3 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-[#FFE4E4]"
                      aria-label={`Delete ${row.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-sm text-[#5B6B7F]">
                    No schemes added yet.
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
