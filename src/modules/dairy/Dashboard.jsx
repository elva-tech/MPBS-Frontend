import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { getDairyDashboard } from "../../utils/api";
import { percentTooltip } from "../../shared/charts/tooltips";

function Card({ label, value }) {
  const toneMap = {
    "Milk Received Today": "border-[#D6C8E7] bg-[#F4F0FB]",
    "Tankers Received": "border-[#CFE0FF] bg-[#EEF4FF]",
    "Pending Verification": "border-[#EFD5B4] bg-[#F8F3E8]",
    "Total Shortage Today": "border-[#CFE0FF] bg-[#EEF4FF]",
  };
  const tone = toneMap[label] || "border-[#D7E4FF] bg-white";

  return (
    <div className={`module-stat-card rounded-xl border shadow-[0_4px_12px_rgba(15,41,74,0.08)] ${tone}`}>
      <p className="text-[13px] font-medium text-[#5B6B7F]">{label}</p>
      <p className="mt-2 text-[26px] font-semibold leading-none text-[#1E4B6B]">{value}</p>
    </div>
  );
}

function Donut({ data, colors = ["#1E4B6B", "#9DB5CC"] }) {
  return (
    <div className="module-dashboard-donut">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip formatter={percentTooltip} />
          <Pie data={data} dataKey="value" nameKey="label" innerRadius="48%" outerRadius="72%" stroke="none">
            {data.map((_, index) => (
              <Cell key={`slice-${index}`} fill={colors[index] || colors[0]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartLegend({ items }) {
  return (
    <div className="min-w-[140px] space-y-2 text-sm text-[#334155]">
      {items.map((item) => (
        <p key={item.label}>
          {item.label} <span className="font-semibold text-[#1E4B6B]">{item.value}%</span>
        </p>
      ))}
    </div>
  );
}

export default function DairyDashboard() {
  const [selectedShift, setSelectedShift] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState({
    cards: {
      milkReceived: 0,
      tankerCount: 0,
      pendingVerification: 0,
      totalShortage: 0,
    },
    milkTypeDistribution: [
      { label: "Cow Milk", value: 0 },
      { label: "Buffalo Milk", value: 0 },
    ],
    districtProcurement: [],
    qualityStatus: [
      { label: "Approved Milk", value: 0 },
      { label: "Rejected / Penalised", value: 0 },
    ],
    shiftOptions: ["All", "Morning", "Evening"],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const dairyUnit = localStorage.getItem("dairy_unit") || "";
        const sessionMap = { Morning: "M", Evening: "E" };
        const today = new Date().toISOString().slice(0, 10);

        const params = { date: selectedDate || today };
        if (dairyUnit) params.dairyUnit = dairyUnit;
        if (selectedShift !== "All") {
          params.session = sessionMap[selectedShift] || "";
        }

        const response = await getDairyDashboard(params);
        if (!cancelled) {
          setDashboardData((prev) => ({
            ...prev,
            ...(response?.data || {}),
            shiftOptions: response?.data?.shiftOptions?.length
              ? response.data.shiftOptions
              : ["All", "Morning", "Evening"],
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load dairy dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedShift]);

  const shiftOptions = useMemo(() => {
    const base = ["All", "Morning", "Evening"];
    return dashboardData.shiftOptions?.length ? dashboardData.shiftOptions : base;
  }, [dashboardData.shiftOptions]);

  const dashboardCards = useMemo(
    () => [
      {
        label: "Milk Received Today",
        value: `${Number(dashboardData.cards?.milkReceived || 0).toLocaleString()} L`,
      },
      { label: "Tankers Received", value: String(dashboardData.cards?.tankerCount || 0) },
      { label: "Pending Verification", value: String(dashboardData.cards?.pendingVerification || 0) },
      {
        label: "Total Shortage Today",
        value: `${Number(dashboardData.cards?.totalShortage || 0).toLocaleString()} L`,
      },
    ],
    [dashboardData.cards]
  );

  const milkTypeDistribution = dashboardData.milkTypeDistribution || [];
  const districtProcurement = dashboardData.districtProcurement || [];
  const qualityStatus = dashboardData.qualityStatus || [];

  const maxDistrictValue = Math.max(...districtProcurement.map((item) => item.liters), 1);

  return (
    <div className="module-page text-[#1F2A44]">
      <div>
        <h1 className="text-2xl font-semibold text-[#1E4B6B]">Dairy Dashboard</h1>
        <p className="mt-1 text-sm text-[#5B6B7F]">Operational overview for the current shift.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-[#F3C4C4] bg-[#FFF5F5] px-4 py-3 text-sm text-[#A12626]">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)] md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#5B6B7F]">Shift</label>
          <select
            value={selectedShift}
            onChange={(event) => setSelectedShift(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2 text-sm"
          >
            {shiftOptions.map((shift) => (
              <option key={shift} value={shift}>
                {shift}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[#5B6B7F]">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setSelectedDate("");
              setSelectedShift("All");
            }}
            className="w-full rounded-lg border border-[#1E4B6B] px-3 py-2 text-sm font-semibold text-[#1E4B6B] hover:bg-[#EEF4FF]"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="module-stat-grid">
        {dashboardCards.map((item) => (
          <Card key={item.label} label={item.label} value={item.value} />
        ))}
      </div>

      {loading ? <p className="text-sm text-[#5B6B7F]">Loading dashboard data...</p> : null}

      <div className="module-panel-grid-3">
        <section className="module-dashboard-panel">
          <h2 className="text-base font-semibold text-[#1E4B6B]">Milk Type Distribution</h2>
          <div className="module-dashboard-panel-chart-row">
            <Donut data={milkTypeDistribution} colors={["#1E4B6B", "#9DB5CC"]} />
            <ChartLegend items={milkTypeDistribution} />
          </div>
        </section>

        <section className="module-dashboard-panel">
          <h2 className="text-base font-semibold text-[#1E4B6B]">District Procurement</h2>
          <div className="mt-3 space-y-2.5">
            {districtProcurement.length === 0 ? (
              <p className="text-sm text-[#5B6B7F]">No procurement data for this date.</p>
            ) : null}
            {districtProcurement.map((item) => {
              const width = (item.liters / maxDistrictValue) * 100;
              return (
                <div key={item.district}>
                  <div className="mb-1 flex items-center justify-between text-sm text-[#334155]">
                    <span>{item.district}</span>
                    <span className="font-medium">{item.liters.toLocaleString()} L</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E6EDF7]">
                    <div className="h-2 rounded-full bg-[#2F7FA4]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="module-dashboard-panel">
          <h2 className="text-base font-semibold text-[#1E4B6B]">Quality Status</h2>
          <div className="module-dashboard-panel-chart-row">
            <Donut data={qualityStatus} colors={["#1E4B6B", "#9DB5CC"]} />
            <ChartLegend items={qualityStatus} />
          </div>
        </section>
      </div>
    </div>
  );
}
