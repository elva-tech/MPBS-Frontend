import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchSocieties } from "../../utils/api";
import { litersTooltip, percentTooltip } from "../../shared/charts/tooltips";

function formatNumber(value, suffix = "") {
  return `${Number(value || 0).toLocaleString("en-IN")}${suffix}`;
}

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

const districtColors = ["#1E4B6B", "#2E7FD0", "#3DAF98", "#9DB5CC", "#E9A93A"];

const recentDispatches = [
  { society: "S001", societyName: "Baleri Dairy", product: "Feed", qty: "20 Bags", amount: 34000 },
  { society: "S014", societyName: "Sirgapura", product: "Mineral Mixture", qty: "50 Pkt", amount: 7500 },
  { society: "S022", societyName: "Hospet", product: "Feed", qty: "15 Bags", amount: 18000 },
  { society: "S065", societyName: "Koppal", product: "Calf Starter", qty: "30 Pkt", amount: 4500 },
];

export default function ProcurementDashboard() {
  const navigate = useNavigate();
  const [societies, setSocieties] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const societiesRes = await fetchSocieties();

        if (!alive) return;
        setSocieties(societiesRes?.data || []);
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Unable to load procurement data");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      alive = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const feedRecords = societies.reduce(
      (sum, society) =>
        sum + (society.feedMineral || []).filter((item) => /feed/i.test(item.name || "")).length,
      0
    );
    const mineralRecords = societies.reduce(
      (sum, society) =>
        sum + (society.feedMineral || []).filter((item) => /mineral/i.test(item.name || "")).length,
      0
    );

    return [
      { label: "Total Dispatches Today", value: "42", amount: formatCurrency(675000) },
      {
        label: "Total Feed Distributed (Today)",
        value: formatNumber(Math.max(feedRecords, 1) * 1250, " Bags"),
        amount: formatCurrency(1500000),
      },
      {
        label: "Total Mineral Mixture (Today)",
        value: formatNumber(Math.max(mineralRecords, 1) * 3200, " Packets"),
        amount: formatCurrency(480000),
      },
      { label: "Pending Dispatches", value: "8", amount: formatCurrency(120000) },
    ];
  }, [societies]);

  const districtDistribution = useMemo(() => {
    const counts = new Map();
    societies.forEach((society) => {
      const district = society.district || "Other";
      counts.set(district, (counts.get(district) || 0) + 1);
    });

    const base = counts.size
      ? Array.from(counts.entries()).map(([name, value]) => ({ name, value }))
      : [
          { name: "Ballari", value: 29 },
          { name: "Raichur", value: 24 },
          { name: "Koppal", value: 20 },
          { name: "Vijayanagara", value: 15 },
          { name: "Other", value: 12 },
        ];

    const total = base.reduce((sum, item) => sum + item.value, 0) || 1;
    return base.map((item) => ({
      ...item,
      percent: Math.round((item.value / total) * 100),
    }));
  }, [societies]);

  const productUsage = useMemo(() => {
    const usage = new Map([
      ["Feed", 0],
      ["Mineral Mixture", 0],
      ["Calf Starter", 0],
      ["Others", 0],
    ]);

    societies.forEach((society) => {
      (society.feedMineral || []).forEach((item) => {
        const name = item.name || "";
        const qty = Number.parseFloat(String(item.qty || "").replace(/,/g, "")) || 0;
        if (/feed/i.test(name)) usage.set("Feed", usage.get("Feed") + qty);
        else if (/mineral/i.test(name)) usage.set("Mineral Mixture", usage.get("Mineral Mixture") + qty);
        else if (/calf/i.test(name)) usage.set("Calf Starter", usage.get("Calf Starter") + qty);
        else usage.set("Others", usage.get("Others") + qty);
      });
    });

    const rows = Array.from(usage.entries()).map(([name, value]) => ({ name, value }));
    return rows.some((row) => row.value > 0)
      ? rows
      : [
          { name: "Feed", value: 17500 },
          { name: "Mineral Mixture", value: 12000 },
          { name: "Calf Starter", value: 7500 },
          { name: "Others", value: 5000 },
        ];
  }, [societies]);

  return (
    <div className="module-page text-[#1F2A44]">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="module-stat-grid">
        {metrics.map((item, index) => (
          <div key={item.label} className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
            <div className="flex items-start gap-3">
              <span className={`mt-1 flex h-8 w-8 items-center justify-center rounded-md text-white ${index === 3 ? "bg-[#E9A93A]" : "bg-[#1E4B6B]"}`}>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16v10H4z" />
                  <path d="M8 7V5h8v2" />
                  <path d="M8 12h8" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1E4B6B]">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold text-[#1E4B6B]">{loading ? "-" : item.value}</p>
                <p className="mt-1.5 text-sm font-semibold text-[#1E4B6B]">{loading ? "-" : item.amount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="module-panel-grid-3">
        <section className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-base font-semibold text-[#1E4B6B]">District-wise Distribution (This Month)</h2>
          <div className="mt-5 grid items-center gap-4 md:grid-cols-[190px_1fr] xl:grid-cols-1 2xl:grid-cols-[190px_1fr]">
            <div className="min-h-[240px] h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={districtDistribution} dataKey="percent" nameKey="name" innerRadius={55} outerRadius={88}>
                    {districtDistribution.map((_, index) => (
                      <Cell key={index} fill={districtColors[index % districtColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={percentTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {districtDistribution.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-[#1F2A44]">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: districtColors[index % districtColors.length] }} />
                    {item.name}
                  </span>
                  <span className="font-semibold text-[#1E4B6B]">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-base font-semibold text-[#1E4B6B]">Product-wise Usage (This Month)</h2>
          <div className="mt-5 min-h-[280px] h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productUsage} margin={{ top: 10, right: 6, left: 0, bottom: 0 }}>
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value / 1000}K`} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="value" fill="#1E4B6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-base font-semibold text-[#1E4B6B]">Recent Dispatches</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#D7E4FF] bg-[#F7FAFF] text-[#1E4B6B]">
                <tr>
                  <th className="py-3 pl-3 pr-4 font-semibold">Society</th>
                  <th className="py-3 pr-4 font-semibold">Product</th>
                  <th className="py-3 pr-4 font-semibold">Qty</th>
                  <th className="py-3 pr-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentDispatches.map((row) => (
                  <tr key={`${row.society}-${row.product}`} className="border-b border-[#F2F6FC]">
                    <td className="py-3 pl-3 pr-4">
                      <span className="font-semibold text-[#1E4B6B]">{row.society}</span>
                      <span className="ml-2 text-[#5B6B7F]">{row.societyName}</span>
                    </td>
                    <td className="py-3 pr-4">{row.product}</td>
                    <td className="py-3 pr-4">{row.qty}</td>
                    <td className="py-3 pr-3 font-semibold text-[#1E4B6B]">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-right">
              <button type="button" onClick={() => navigate("/procurement/dispatches")} className="text-sm font-semibold text-[#1E4B6B] hover:text-[#163A54]">
                View All
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
