import { loadAccountState } from "./engine";

const reportItems = [
  "Society-wise Payout",
  "Cycle-wise Billing",
  "Deductions Report",
  "Schemes Impact Report",
];

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function buildReportContent(name, state) {
  const cycleId = state.selectedCycleId || state.cycles[0]?.id;
  const billingRows = state.billingResults[cycleId] || [];

  if (name === "Society-wise Payout") {
    return [
      "Society-wise Payout",
      `Cycle: ${cycleId}`,
      "",
      ...billingRows.map((row) => `${row.societyId}: ${formatCurrency(row.netPayable)}`),
    ];
  }

  if (name === "Cycle-wise Billing") {
    return [
      "Cycle-wise Billing",
      "",
      ...state.cycles.map((cycle) => `${cycle.id}: ${cycle.status}`),
    ];
  }

  if (name === "Deductions Report") {
    return [
      "Deductions Report",
      `Cycle: ${cycleId}`,
      "",
      ...billingRows.map(
        (row) =>
          `${row.societyId}: Recoverables ${formatCurrency(row.totalRecoverables)}, Scheme Deductions ${formatCurrency(row.totalSchemeDeductions)}, Transport Penalty ${formatCurrency(row.transportPenalty)}`
      ),
    ];
  }

  return [
    "Schemes Impact Report",
    "",
    ...state.schemes.map(
      (scheme) => `${scheme.name}: ${scheme.isActive ? "Enabled" : "Disabled"} | Type: ${scheme.type} | Value: ${scheme.value}`
    ),
  ];
}

export default function AccountReports() {
  const handleReportClick = (name) => {
    const state = loadAccountState();
    const lines = buildReportContent(name, state);
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 text-[#1F2A44]">
      <div className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1E4B6B]">Reports</h1>
          <input type="text" value="01 Dec 2025  -  10 Dec 2025" readOnly className="rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2 text-sm" />
        </div>
        <div className="space-y-3">
          {reportItems.map((item) => (
            <button
              key={item}
              onClick={() => handleReportClick(item)}
              className="flex w-full items-center justify-between rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-4 py-3 text-left text-base font-semibold text-[#1E4B6B] hover:bg-[#EEF4FF]"
            >
              <span>{item}</span>
              <span className="text-xl">{">"}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
