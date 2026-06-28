import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const trendData = [
  { date: "01 May", value: 50000 },
  { date: "02 May", value: 65000 },
  { date: "03 May", value: 90000 },
  { date: "04 May", value: 65000 },
  { date: "05 May", value: 50000 },
  { date: "06 May", value: 62000 },
  { date: "07 May", value: 85000 },
  { date: "08 May", value: 110000 },
  { date: "09 May", value: 90000 },
  { date: "10 May", value: 100000 },
  { date: "11 May", value: 125000 },
];

const productShare = [
  { name: "Cattle Feed", value: 45 },
  { name: "Mineral Mixture", value: 30 },
  { name: "Calf Starter", value: 15 },
  { name: "Bypass Fat", value: 7 },
  { name: "Others", value: 3 },
];

const societyRows = [
  { society: "S001 - Ballari Dairy", feed: 150000, mineral: 45000, calf: 12000, others: 5000, total: 212000 },
  { society: "S014 - Siruguppa", feed: 125000, mineral: 60000, calf: 18000, others: 6500, total: 209500 },
  { society: "S032 - Hospet", feed: 110000, mineral: 35000, calf: 15000, others: 4000, total: 164000 },
  { society: "S005 - Koppal", feed: 95000, mineral: 25000, calf: 8000, others: 3000, total: 131000 },
];

const colors = ["#1E4B6B", "#2E7FD0", "#3DAF98", "#C17C36", "#6B5B95"];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatAxis(value) {
  if (value >= 100000) return `${value / 100000}L`;
  if (value >= 1000) return `${value / 1000}K`;
  return value;
}

export default function ProcurementReports() {
  const [reportType, setReportType] = useState("Dispatch Report");
  const [dateRange, setDateRange] = useState("01/05/2025 - 12/05/2025");
  const [district, setDistrict] = useState("All Districts");
  const [activeTab, setActiveTab] = useState("Dispatch Summary");
  const [message, setMessage] = useState("");
  const visibleRows = useMemo(() => {
    if (district === "All Districts") return societyRows;
    return societyRows.filter((row) => row.society.toLowerCase().includes(district.toLowerCase()));
  }, [district]);

  const handleSearch = () => {
    setMessage(`${reportType} loaded for ${district} (${dateRange}).`);
  };

  return (
    <div className="module-page text-[#1F2A44]">
      <section className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.1fr_1fr_auto]">
          <label className="block">
            <span className="text-xs font-semibold text-[#1E4B6B]">Report Type</span>
            <select value={reportType} onChange={(event) => setReportType(event.target.value)} className="mt-2 w-full rounded-lg border border-[#D7E4FF] bg-white px-3 py-2.5 text-sm font-medium text-[#1F2A44] focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]">
              <option>Dispatch Report</option>
              <option>Product Usage Report</option>
              <option>Stock Summary Report</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-[#1E4B6B]">Date Range</span>
            <div className="relative mt-2">
              <input
                type="text"
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                className="w-full rounded-lg border border-[#D7E4FF] bg-white px-3 py-2.5 pr-10 text-sm font-medium text-[#1F2A44] focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]"
              />
              <CalendarDays className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1E4B6B]" />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-[#1E4B6B]">District</span>
            <select value={district} onChange={(event) => setDistrict(event.target.value)} className="mt-2 w-full rounded-lg border border-[#D7E4FF] bg-white px-3 py-2.5 text-sm font-medium text-[#1F2A44] focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]">
              <option>All Districts</option>
              <option>Ballari</option>
              <option>Siruguppa</option>
              <option>Hospet</option>
              <option>Koppal</option>
            </select>
          </label>

          <div className="flex items-end">
            <button type="button" onClick={handleSearch} className="h-[42px] rounded-lg bg-[#1E4B6B] px-10 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(30,75,107,0.22)] hover:bg-[#163A54]">
              Search
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-1">
          {["Dispatch Summary", "Product Usage", "Society-wise", "Stock Summary"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-t-lg border px-6 py-2.5 text-sm font-semibold ${
                activeTab === tab
                  ? "border-[#1E4B6B] bg-[#1E4B6B] text-white"
                  : "border-[#D7E4FF] bg-white text-[#1E4B6B] hover:bg-[#F7FAFF]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>
      {message && (
        <div className="rounded-lg border border-[#D7E4FF] bg-white px-4 py-3 text-sm font-semibold text-[#1E4B6B] shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          {message}
        </div>
      )}

      {activeTab !== "Stock Summary" && (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-base font-semibold text-[#1E4B6B]">Dispatch Trend</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E6EDF7" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={formatAxis} />
                <Tooltip formatter={(value) => `Rs ${formatCurrency(value)}`} />
                <Line type="monotone" dataKey="value" stroke="#1E4B6B" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-base font-semibold text-[#1E4B6B]">Top Products (By Amount)</h2>
          <div className="mt-4 grid items-center gap-4 md:grid-cols-[190px_1fr]">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={productShare} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88}>
                    {productShare.map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {productShare.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2 text-[#1F2A44]">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index] }} />
                    {item.name}
                  </span>
                  <span className="font-semibold text-[#1E4B6B]">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      )}

      <section className="overflow-hidden rounded-lg border border-[#D7E4FF] bg-white shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <h2 className="px-5 py-4 text-base font-semibold text-[#1E4B6B]">
          {activeTab === "Stock Summary" ? "Stock Summary" : "Society Dispatch Summary"}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-y border-[#D7E4FF] bg-[#F7FAFF] text-[#1E4B6B]">
              <tr>
                <th className="px-5 py-3 font-semibold">Society</th>
                <th className="px-5 py-3 font-semibold">Feed (Rs)</th>
                <th className="px-5 py-3 font-semibold">Mineral Mixture (Rs)</th>
                <th className="px-5 py-3 font-semibold">Calf Starter (Rs)</th>
                <th className="px-5 py-3 font-semibold">Others (Rs)</th>
                <th className="px-5 py-3 font-semibold">Total Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.society} className="border-b border-[#EEF3FB] last:border-b-0">
                  <td className="px-5 py-3 font-semibold text-[#1E4B6B]">{row.society}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatCurrency(row.feed)}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatCurrency(row.mineral)}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatCurrency(row.calf)}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatCurrency(row.others)}</td>
                  <td className="px-5 py-3 font-semibold text-[#1E4B6B]">{formatCurrency(row.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
