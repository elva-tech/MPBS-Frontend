import { useEffect, useMemo, useState } from "react";
import { fetchAccountState } from "./accountService";
import {
  getAccountDeductionsReport,
  getAccountPayoutReport,
  getAccountSchemesReport,
} from "../../utils/api";

const reportItems = [
  { name: "Society-wise Payout", type: "payout" },
  { name: "Cycle-wise Billing", type: "cycles" },
  { name: "Deductions Report", type: "deductions" },
  { name: "Schemes Impact Report", type: "schemes" },
];

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function buildReportLines(name, state, payload = {}) {
  const cycleId = state.selectedCycleId || state.cycles[0]?.id;
  const billingRows = state.billingResults?.[cycleId] || [];

  if (name === "Society-wise Payout") {
    const rows = payload?.data || billingRows;
    return [
      "Society-wise Payout",
      `Cycle: ${cycleId}`,
      "",
      ...rows.map((row) => `${row.societyId}: ${formatCurrency(row.netPayable)}`),
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
    const rows = payload?.data || billingRows;
    return [
      "Deductions Report",
      `Cycle: ${cycleId}`,
      "",
      ...rows.map(
        (row) =>
          `${row.societyId}: Recoverables ${formatCurrency(row.totalRecoverables)}, Scheme Deductions ${formatCurrency(row.totalSchemeDeductions)}`
      ),
    ];
  }

  const schemes = payload?.data || state.schemes || [];
  return [
    "Schemes Impact Report",
    "",
    ...schemes.map(
      (scheme) =>
        `${scheme.name}: ${scheme.isActive ? "Enabled" : "Disabled"} | Type: ${scheme.type} | Value: ${scheme.value}`
    ),
  ];
}

export default function AccountReports() {
  const [state, setState] = useState({ cycles: [], billingResults: {}, schemes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAccountState()
      .then((next) => {
        if (active) setState(next);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedCycle = state.cycles.find((cycle) => cycle.id === state.selectedCycleId) || state.cycles[0];
  const cycleLabel = selectedCycle ? `${selectedCycle.start} - ${selectedCycle.end}` : "-";

  const handleReportClick = async (item) => {
    const cycle = selectedCycle;
    const cycleKey = cycle?.mongoId || cycle?.id || "";
    let payload = {};

    try {
      if (item.type === "payout") {
        payload = await getAccountPayoutReport({ cycleId: cycleKey });
      } else if (item.type === "deductions") {
        payload = await getAccountDeductionsReport({ cycleId: cycleKey });
      } else if (item.type === "schemes") {
        payload = await getAccountSchemesReport();
      }
    } catch {
      payload = {};
    }

    const lines = buildReportLines(item.name, state, payload);
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${item.name.toLowerCase().replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="module-page module-page-body text-[#1F2A44]">
      <div className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1E4B6B]">Reports</h1>
          <input type="text" value={loading ? "Loading..." : cycleLabel} readOnly className="rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2 text-sm" />
        </div>
        <div className="space-y-3">
          {reportItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleReportClick(item)}
              className="flex w-full items-center justify-between rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-4 py-3 text-left text-base font-semibold text-[#1E4B6B] hover:bg-[#EEF4FF]"
            >
              <span>{item.name}</span>
              <span className="text-xl">{">"}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
