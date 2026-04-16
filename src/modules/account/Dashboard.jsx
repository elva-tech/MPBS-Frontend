import { useMemo, useState } from "react";
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
import { buildDashboardMetrics, buildTrendData, loadAccountState, setSelections } from "./engine";

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

export default function AccountDashboard() {
  const [state, setState] = useState(() => loadAccountState());
  const selectedCycleId = state.selectedCycleId || state.cycles[0]?.id;

  const metrics = useMemo(() => buildDashboardMetrics(state, selectedCycleId), [state, selectedCycleId]);
  const trend = useMemo(() => buildTrendData(state), [state]);

  const handleCycleChange = (e) => {
    const cycleId = e.target.value;
    const next = setSelections({ cycleId });
    setState(next);
  };

  return (
    <div className="space-y-4 p-6 text-[#1F2A44]">
      <div className="flex items-center justify-between rounded-xl border border-[#D7E4FF] bg-white px-4 py-3 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <h1 className="text-2xl font-semibold text-[#1E4B6B]">Accounts Dashboard</h1>
        <select
          value={selectedCycleId}
          onChange={handleCycleChange}
          className="rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2 text-sm"
        >
          {state.cycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              Current Cycle: {cycle.id} ({cycle.start} to {cycle.end})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.cards.map((card, index) => (
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
              <p className="text-2xl font-semibold leading-none text-[#1E4B6B]">{card.value}</p>
              <p className="mt-1 text-sm font-medium text-[#1E4B6B]">{card.label}</p>
              {card.sub && <p className="mt-0.5 text-xs text-[#5B6B7F]">{card.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">Milk Type Distribution</h2>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.milkDistribution} dataKey="value" nameKey="name" innerRadius={46} outerRadius={70}>
                    {metrics.milkDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {metrics.milkDistribution.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[idx] }} />
                  <span>{item.name}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">Cycle Progress</h2>
          <div className="mt-8 grid grid-cols-3 gap-2 text-center">
            {metrics.cycleProgress.map((item, index) => (
              <div key={item.step}>
                <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#D7E4FF] bg-[#F7FAFF] text-xs font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold">{item.step}</p>
                <p className="text-xs text-[#5B6B7F]">{item.state}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">Trend (Last 6 Months)</h2>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid stroke="#E6EDF7" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
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
