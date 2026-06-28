import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { buildDashboardMetrics, buildTrendData, hydrateAccountSocieties } from "./engine";
import { lockCycleBilling, runCycleBilling, setAccountSelections } from "./accountService";
import { getAccountsDashboard } from "../../utils/api";
import { litersTooltip, percentTooltip } from "../../shared/charts/tooltips";

const chartColors = {
  darkBlue: "#1E4B6B",
  lightBlue: "#9DB5CC",
};
const pieColors = [chartColors.darkBlue, chartColors.lightBlue];
const topCardStyles = [
  { bg: "#F4F0FB", border: "#D9CAE9", iconBg: "#F1ECF8", iconBorder: "#D9CAE9" },
  { bg: "#EEF4FF", border: "#CFE0FF", iconBg: "#EAF1FF", iconBorder: "#CFE0FF" },
  { bg: "#F8F3E8", border: "#EFD5B4", iconBg: "#F5EBDD", iconBorder: "#EFD5B4" },
  { bg: "#EEF2F7", border: "#D4E0EF", iconBg: "#EAF1FF", iconBorder: "#D4E0EF" },
];
const cycleProgressStyles = {
  Completed: {
    circle: "border-[#3DAF98] bg-[#3DAF98] text-white",
    line: "bg-[#3DAF98]",
  },
  "In Progress": {
    circle: "border-[#2E7FD0] bg-[#2E7FD0] text-white",
    line: "bg-[#2E7FD0]",
  },
  Pending: {
    circle: "border-[#CED6E1] bg-[#F5F7FA] text-[#475569]",
    line: "bg-[#D9DEE7]",
  },
};
const cycleProgressRanges = ["1-10", "11-20", "21-End"];

function formatCycleProgressRange(range) {
  return String(range || "").replace(/END/i, "End");
}

function formatDateLabel(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getMonthLabel(cycle) {
  if (!cycle) return "-";
  const dateStr = cycle.start || cycle.startDate || "";
  if (!dateStr) return "-";
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function generateAllMonths(cycles = []) {
  if (cycles.length === 0) {
    // Generate current year months if no cycles
    const now = new Date();
    const year = now.getFullYear();
    const months = [];
    for (let month = 0; month < 12; month++) {
      months.push(new Date(year, month, 1));
    }
    return months;
  }

  // Find min and max dates from cycles
  const dates = cycles
    .map((c) => new Date(c.start || c.startDate || 0))
    .filter((d) => !isNaN(d.getTime()));

  if (dates.length === 0) {
    const now = new Date();
    const year = now.getFullYear();
    const months = [];
    for (let month = 0; month < 12; month++) {
      months.push(new Date(year, month, 1));
    }
    return months;
  }

  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const months = [];
  let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  while (current <= maxDate) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}
export default function AccountDashboard() {
  const [state, setState] = useState({
    cycles: [],
    societies: [],
    schemes: [],
    claims: [],
    recoverables: [],
    milkData: [],
    billingResults: {},
    selectedCycleId: "",
    selectedSocietyId: "",
  });
  const [serverDashboard, setServerDashboard] = useState(null);
  const [selectedTrendMonthId, setSelectedTrendMonthId] = useState(null);
  const [loading, setLoading] = useState(true);
  const selectedCycleId = state.selectedCycleId || state.cycles[0]?.id || "";
  const currentCycle = state.cycles.find((cycle) => cycle.id === selectedCycleId) || state.cycles[0];
  
  const sortedCycles = useMemo(() => {
    return [...state.cycles].sort((a, b) => {
      const aTime = new Date(a.start || a.startDate || 0).getTime();
      const bTime = new Date(b.start || b.startDate || 0).getTime();
      return aTime - bTime;
    });
  }, [state.cycles]);
  
  const defaultTrendMonthId = useMemo(() => {
    return selectedTrendMonthId || sortedCycles[sortedCycles.length - 1]?.id || null;
  }, [selectedTrendMonthId, sortedCycles]);

  const allMonths = useMemo(() => generateAllMonths(sortedCycles), [sortedCycles]);

  const monthOptions = useMemo(() => {
    return allMonths.map((monthDate) => {
      const label = monthDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      // Find the closest cycle for this month (usually the first cycle of that month)
      const yearMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      const matchingCycle = sortedCycles.find((cycle) => {
        const cycleDate = new Date(cycle.start || cycle.startDate || 0);
        return (
          cycleDate.getFullYear() === monthDate.getFullYear() &&
          cycleDate.getMonth() === monthDate.getMonth()
        );
      });
      return {
        label,
        monthDate: monthDate.toISOString().split("T")[0],
        cycleId: matchingCycle?.id || null,
      };
    });
  }, [allMonths, sortedCycles]);

  useEffect(() => {
    let alive = true;

    hydrateAccountSocieties()
      .then((next) => {
        if (!alive) return;
        setState(next);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadCycleMilkQty() {
      if (!selectedCycleId) {
        setServerDashboard(null);
        return;
      }

      try {
        const response = await getAccountsDashboard({ cycleId: selectedCycleId });
        if (!alive) return;
        setServerDashboard(response?.data || null);
      } catch {
        if (!alive) return;
        setServerDashboard(null);
      }
    }

    loadCycleMilkQty();
    return () => {
      alive = false;
    };
  }, [selectedCycleId]);

  const metrics = useMemo(() => buildDashboardMetrics(state, selectedCycleId), [state, selectedCycleId]);
  const trend = useMemo(() => buildTrendData(state, defaultTrendMonthId), [state, defaultTrendMonthId]);
  const dashboardCards = useMemo(() => {
    if (!serverDashboard?.cards) return metrics.cards;

    const cards = serverDashboard.cards;
    return [
      { label: "Total Milk Procured", value: `${Number(cards.totalMilkQty || 0).toLocaleString("en-IN")} L`, sub: `(Cycle ${serverDashboard.cycle?.code || selectedCycleId})` },
      { label: "Total Payable", value: `Rs ${Number(cards.totalPayable || 0).toLocaleString("en-IN")}`, sub: "" },
      { label: "Total Deductions", value: `Rs ${Number(cards.totalDeductions || 0).toLocaleString("en-IN")}`, sub: "" },
      { label: "Net Payout", value: `Rs ${Number(cards.netPayout || 0).toLocaleString("en-IN")}`, sub: "" },
    ];
  }, [metrics.cards, selectedCycleId, serverDashboard]);

  const dashboardMilkDistribution = useMemo(() => {
    if (!serverDashboard?.milkDistribution?.length) return metrics.milkDistribution;
    return serverDashboard.milkDistribution;
  }, [metrics.milkDistribution, serverDashboard]);

  const dashboardCycleProgress = useMemo(() => {
    return metrics.cycleProgress;
  }, [metrics.cycleProgress]);

  const dashboardTrend = useMemo(() => {
    if (Array.isArray(serverDashboard?.revenueTrend) && serverDashboard.revenueTrend.length > 0) {
      return serverDashboard.revenueTrend.map((item) => ({
        month: item.cycle,
        milkQty: Number(item.value || 0),
        payout: Number(item.value || 0),
      }));
    }
    return trend;
  }, [serverDashboard, trend]);

  const handleCycleChange = (e) => {
    const cycleId = e.target.value;
    setAccountSelections({ cycleId });
    setState((current) => ({ ...current, selectedCycleId: cycleId }));
  };

  const handleRunBilling = async () => {
    try {
      const res = await runCycleBilling(selectedCycleId);
      setState(res.state);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLockCycle = async () => {
    try {
      const res = await lockCycleBilling(selectedCycleId);
      setState(res.state);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="module-page module-page-body text-[#1F2A44]">
        <p className="text-sm text-[#5B6B7F]">Loading accounts dashboard...</p>
      </div>
    );
  }

  return (
    <div className="module-page module-page-body text-[#1F2A44]">
      <div className="flex items-center justify-between rounded-xl border border-[#D7E4FF] bg-white px-4 py-3 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <h1 className="text-2xl font-semibold text-[#1E4B6B]">Accounts Dashboard</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedCycleId}
            onChange={handleCycleChange}
            className="rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2 text-sm"
          >
            {currentCycle ? (
              <option key={currentCycle.id} value={currentCycle.id}>
                Current Cycle: {currentCycle.id} ({formatDateLabel(currentCycle.start || currentCycle.startDate)} to {formatDateLabel(currentCycle.end || currentCycle.endDate)})
              </option>
            ) : null}
          </select>
          <button
            onClick={handleRunBilling}
            className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            Run Billing
          </button>
          <button
            onClick={handleLockCycle}
            className="rounded-lg border border-[#D7E4FF] bg-white px-4 py-2 text-sm font-medium text-[#1E4B6B] hover:bg-[#F7FAFF]"
          >
            Lock Cycle
          </button>
        </div>
      </div>

      

      <div className="module-stat-grid">
        {dashboardCards.map((card, index) => (
          (() => {
            const displayValue = card.value;

            return (
          <div
            key={card.label}
            className="flex items-center gap-3 rounded-lg border px-3 py-3 shadow-[0_6px_14px_rgba(15,41,74,0.12)]"
            style={{
              background: topCardStyles[index]?.bg || "#EEF2F7",
              borderColor: topCardStyles[index]?.border || "#D4E0EF",
            }}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border text-[#1E4B6B]"
              style={{
                background: topCardStyles[index]?.iconBg || "#EAF1FF",
                borderColor: topCardStyles[index]?.iconBorder || "#D4E0EF",
              }}
            >
              {index === 0 ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="4" width="7" height="7" rx="1" />
                  <rect x="13" y="4" width="7" height="7" rx="1" />
                  <rect x="4" y="13" width="7" height="7" rx="1" />
                  <rect x="13" y="13" width="7" height="7" rx="1" />
                </svg>
              ) : null}
              {index === 1 ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 9h16" />
                  <path d="M6 9l2-3h8l2 3" />
                  <path d="M7 13h10" />
                  <path d="M9 13v4M15 13v4" />
                </svg>
              ) : null}
              {index === 2 ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              ) : null}
              {index === 3 ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7h12v8H3z" />
                  <path d="M15 10h3l3 3v2h-6z" />
                  <circle cx="7" cy="18" r="2" />
                  <circle cx="18" cy="18" r="2" />
                </svg>
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-semibold leading-none text-[#1E4B6B]">{displayValue}</p>
              <p className="mt-1 text-sm font-medium text-[#1E4B6B]">{card.label}</p>
              {card.sub && <p className="mt-0.5 text-xs text-[#5B6B7F]">{card.sub}</p>}
            </div>
          </div>
            );
          })()
        ))}
      </div>

      <div className="module-panel-grid-3">
        <section className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">Milk Type Distribution</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-52 w-52 min-w-[12rem] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dashboardMilkDistribution} dataKey="value" nameKey="name" innerRadius={46} outerRadius={70}>
                    {dashboardMilkDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={percentTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {dashboardMilkDistribution.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[idx] }} />
                  <span>{item.name}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#DDE3EB] bg-white px-4 pb-[22px] pt-[15px] shadow-[0_2px_7px_rgba(15,41,74,0.10)]">
          <h2 className="text-[13px] font-bold leading-none text-[#11182D]">Cycle Progress</h2>
          <div className="relative mt-[18px] grid grid-cols-3 text-center">
            <div className="absolute left-[9%] right-[9%] top-[17px] h-[2px] bg-[#D9DEE7]" />
            {dashboardCycleProgress.map((item, index) => {
              const step = item?.step || "Pending";
              const style = cycleProgressStyles[step] || cycleProgressStyles.Pending;
              const rangeLabel = cycleProgressRanges[index] || item?.range || item?.cycle || "-";

              return (
                <div key={`${item.range}-${step}`} className="relative flex min-w-0 flex-col items-center px-1">
                  {index < dashboardCycleProgress.length - 1 ? (
                    <div className={`absolute left-1/2 top-[17px] h-[2px] w-full ${style.line}`} />
                  ) : null}
                  <div
                    className={`relative z-10 mx-auto flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 text-[13px] font-bold shadow-[0_1px_3px_rgba(15,41,74,0.14)] ${style.circle}`}
                  >
                    {String(index + 1)}
                  </div>
                  <div className="relative z-10 mt-[11px]">
                    <p className="text-[13px] font-bold leading-[1.1] text-[#11182D]">
                      {formatCycleProgressRange(rangeLabel)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid gap-2 text-[11px] text-[#5B6B7F] sm:grid-cols-3">
            <div className="rounded-md bg-[#F8FAFC] px-2 py-1.5 text-center">
              <span className="font-semibold text-[#1E4B6B]">Completed</span>
              <span className="ml-1">- dates are over</span>
            </div>
            <div className="rounded-md bg-[#F8FAFC] px-2 py-1.5 text-center">
              <span className="font-semibold text-[#1E4B6B]">In Progress</span>
              <span className="ml-1">- within the date range</span>
            </div>
            <div className="rounded-md bg-[#F8FAFC] px-2 py-1.5 text-center">
              <span className="font-semibold text-[#1E4B6B]">Pending</span>
              <span className="ml-1">- upcoming dates</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1E4B6B]">Trend</h2>
            <select
              value={selectedTrendMonthId || ""}
              onChange={(e) => setSelectedTrendMonthId(e.target.value || null)}
              className="rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2 text-sm font-medium"
            >
              {monthOptions.map((month) => (
                <option key={month.monthDate} value={month.cycleId || month.monthDate}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardTrend}>
                <CartesianGrid stroke="#E6EDF7" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={litersTooltip} />
                <Line type="monotone" dataKey="milkQty" stroke={chartColors.darkBlue} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="payout" stroke={chartColors.lightBlue} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
