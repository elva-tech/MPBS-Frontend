import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Tooltip,
} from "recharts";
import { getBmcDashboard, getReportQuality, getReportOverheads } from "../../utils/api";
import { litersTooltip, percentTooltip } from "../../shared/charts/tooltips";

const milkShareColors = ["#1E4B6B", "#9DB5CC"];
const TOP_CARD_STYLES = [
  { bg: "#F4F0FB", border: "#D9CAE9", iconBg: "#F1ECF8", iconBorder: "#D9CAE9" },
  { bg: "#EEF4FF", border: "#CFE0FF", iconBg: "#EAF1FF", iconBorder: "#CFE0FF" },
  { bg: "#F8F3E8", border: "#EFD5B4", iconBg: "#F5EBDD", iconBorder: "#EFD5B4" },
  { bg: "#EEF2F7", border: "#D4E0EF", iconBg: "#EAF1FF", iconBorder: "#D4E0EF" },
];

export default function BmcDashboard() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const username = localStorage.getItem("bmc_name");
  const avatarLetter = username ? username.charAt(0).toUpperCase() : "";
  
  // State for dashboard data
  const [summary, setSummary] = useState(null);
  const [milkBreakdown, setMilkBreakdown] = useState([]);
  const [milkProcuredByMonth, setMilkProcuredByMonth] = useState({});
  const [milkRejectedByMonth, setMilkRejectedByMonth] = useState({});
  const [dispatchStats, setDispatchStats] = useState(null);
  const [monthQualityData, setMonthQualityData] = useState([]);
  const [overheadData, setOverheadData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [monthProcured, setMonthProcured] = useState("Jan");
  const [monthRejected, setMonthRejected] = useState("Jan");
  const [monthQualityFilter, setMonthQualityFilter] = useState("Jan");
  const [monthOverheads, setMonthOverheads] = useState("Jan");

  // Fetch dashboard data
  useEffect(() => {
    let active = true;

    async function loadBmcDashboard() {
      try {
        setLoading(true);
        setError(null);

        const bmcId = localStorage.getItem("bmc_id") || localStorage.getItem("bmc_name") || "";
        const response = await getBmcDashboard({ bmcId });
        const data = response?.data || {};

        const [qualityRes, overheadRes] = await Promise.all([
          getReportQuality({}),
          getReportOverheads({ bmcId }),
        ]);

        if (!active) return;
        setSummary(
          data.summary || {
            totalMilk: 0,
            totalVerified: 0,
            type: { cow: 0, buffalo: 0 },
          }
        );
        setMilkBreakdown(data.milkBreakdown || []);
        setMilkProcuredByMonth(data.milkProcuredByMonth || {});
        setMilkRejectedByMonth(data.milkRejectedByMonth || {});
        setDispatchStats(data.dispatchStats || { totalDispatches: 0, pendingDispatches: 0 });
        const qualityList = qualityRes?.data || [];
        const overheadList = overheadRes?.data || [];
        setMonthQualityData(qualityList);
        setOverheadData(overheadList);
        if (qualityList.length) setMonthQualityFilter(qualityList[0].name);
        if (overheadList.length) setMonthOverheads(overheadList[0].name);

        setLoading(false);
      } catch (err) {
        if (!active) return;
        console.error("Error loading BMC dashboard:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    loadBmcDashboard();
    return () => {
      active = false;
    };
  }, []);

  // const handleDownloadDispatchSheet = () => {
  // };
  const downloadPdfTable = ({ title, subtitle, headers, rows, filename }) => {
    if (!rows || rows.length === 0) return;
    const pdf = new jsPDF("portrait", "mm", "a4");
    const marginX = 10;
    const pageWidth = 210;
    const usableWidth = pageWidth - marginX * 2;
    const rowHeight = 7;
    const colWidth = Math.floor(usableWidth / headers.length);
    const colWidths = headers.map((_, idx) =>
      idx === headers.length - 1 ? usableWidth - colWidth * (headers.length - 1) : colWidth
    );

    let yPos = 14;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(title, marginX, yPos);
    if (subtitle) {
      yPos += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(subtitle, marginX, yPos);
    }
    yPos += 8;

    const drawRow = (cells, isHeader = false) => {
      let x = marginX;
      pdf.setFont("helvetica", isHeader ? "bold" : "normal");
      pdf.setFontSize(9);
      if (isHeader) {
        pdf.setFillColor(30, 75, 107);
        pdf.setTextColor(255, 255, 255);
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.setTextColor(0, 0, 0);
      }
      cells.forEach((cell, idx) => {
        pdf.setDrawColor(200, 208, 220);
        pdf.rect(x, yPos, colWidths[idx], rowHeight, isHeader ? "F" : undefined);
        pdf.text(String(cell), x + 1.5, yPos + 4.8);
        x += colWidths[idx];
      });
      yPos += rowHeight;
    };

    drawRow(headers, true);
    rows.forEach((row) => {
      if (yPos + rowHeight > 287) {
        pdf.addPage();
        yPos = 12;
        drawRow(headers, true);
      }
      drawRow(row, false);
    });

    pdf.save(filename);
  };

  // Compute derived values
  const totalMilk = milkBreakdown.reduce((sum, item) => sum + item.value, 0);
  const milkShare = milkBreakdown.map((item, index) => ({
    name: item.name,
    value: totalMilk > 0 ? Number(((item.value / totalMilk) * 100).toFixed(2)) : 0,
    color: milkShareColors[index] || "#1E4B6B",
  }));
  const milkProcured = milkProcuredByMonth[monthProcured] || [];
  const milkRejected = milkRejectedByMonth[monthRejected] || [];
  const societiesVerified = dispatchStats
    ? {
        verified: Math.max(0, dispatchStats.totalDispatches - dispatchStats.pendingDispatches),
        total: dispatchStats.totalDispatches,
      }
    : { verified: 0, total: 0 };
  const dispatchStatus = dispatchStats && dispatchStats.pendingDispatches > 0 ? "Pending" : "On Time";
  const monthQuality = monthQualityData;
  const overheads = overheadData;

  // Loading state
  if (loading) {
    return (
      <div className="module-page flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4B6B]"></div>
          <p className="mt-4 text-[#5B6B7F]">Loading BMC dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="module-page flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error Loading Dashboard</div>
          <p className="text-[#5B6B7F] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#1E4B6B] text-white rounded-lg hover:bg-[#162d47]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Fallback for missing data
  if (!summary || !milkBreakdown || milkBreakdown.length === 0) {
    return (
      <div className="module-page flex min-h-[50vh] items-center justify-center">
        <p className="text-[#5B6B7F]">No data available</p>
      </div>
    );
  }

  return (
    <div className="module-page text-[#0F1E33] select-none cursor-default font-bold">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-[#1E4B6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <h2 className="font-semibold text-[#1E4B6B]">Dashboard</h2>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#5B6B7F]">
          {/*
          <button
            onClick={handleDownloadDispatchSheet}
            className="rounded-md bg-[#1E4B6B] px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_6px_rgba(30,75,107,0.25)] hover:bg-[#173A55]"
          >
            Generate Dispatch Sheet
          </button>
          */}
          {username && (
            <svg className="h-4 w-4 text-[#1E4B6B]" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
              />
            </svg>
          )}
          {username && <span>{username}</span>}
          {username && (
            <div className="w-7 h-7 rounded-full bg-[#EAF1FF] text-[#1E4B6B] flex items-center justify-center">
              {avatarLetter}
            </div>
          )}
        </div>
      </div>

      <div className="module-stat-grid">
          <div
            className="module-stat-card flex items-center gap-2.5 rounded-lg shadow-[0_6px_14px_rgba(15,41,74,0.12)] border"
            style={{ background: TOP_CARD_STYLES[0].bg, borderColor: TOP_CARD_STYLES[0].border }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#1E4B6B] border"
              style={{ background: TOP_CARD_STYLES[0].iconBg, borderColor: TOP_CARD_STYLES[0].iconBorder }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="7" height="7" rx="1" />
                <rect x="13" y="4" width="7" height="7" rx="1" />
                <rect x="4" y="13" width="7" height="7" rx="1" />
                <rect x="13" y="13" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div>
              <div className="text-[32px] leading-none font-semibold text-[#1E4B6B]">{summary.type.cow} L</div>
              <div className="text-[12px] font-medium text-[#5B6B7F] mt-1">Cow Milk Procured</div>
            </div>
          </div>

          <div
            className="module-stat-card flex items-center gap-2.5 rounded-lg shadow-[0_6px_14px_rgba(15,41,74,0.12)] border"
            style={{ background: TOP_CARD_STYLES[1].bg, borderColor: TOP_CARD_STYLES[1].border }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#1E4B6B] border"
              style={{ background: TOP_CARD_STYLES[1].iconBg, borderColor: TOP_CARD_STYLES[1].iconBorder }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 9h16" />
                <path d="M6 9l2-3h8l2 3" />
                <path d="M7 13h10" />
                <path d="M9 13v4M15 13v4" />
              </svg>
            </div>
            <div>
              <div className="text-[32px] leading-none font-semibold text-[#1E4B6B]">{summary.type.buffalo} L</div>
              <div className="text-[12px] font-medium text-[#5B6B7F] mt-1">Buffalo Milk Procured</div>
            </div>
          </div>

          <div
            className="module-stat-card flex items-center gap-2.5 rounded-lg shadow-[0_6px_14px_rgba(15,41,74,0.12)] border"
            style={{ background: TOP_CARD_STYLES[2].bg, borderColor: TOP_CARD_STYLES[2].border }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#1E4B6B] border"
              style={{ background: TOP_CARD_STYLES[2].iconBg, borderColor: TOP_CARD_STYLES[2].iconBorder }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-[30px] leading-none font-semibold text-[#1E4B6B]">
                {societiesVerified.verified} / {societiesVerified.total}
              </div>
              <div className="text-[12px] font-medium text-[#5B6B7F] mt-1">Societies Verified</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-[#E5E7EB]">
                <div className="h-1.5 w-[70%] rounded-full bg-[#1E4B6B]" />
              </div>
            </div>
          </div>

          <div
            className="module-stat-card flex items-center gap-2.5 rounded-lg shadow-[0_6px_14px_rgba(15,41,74,0.12)] border"
            style={{ background: TOP_CARD_STYLES[3].bg, borderColor: TOP_CARD_STYLES[3].border }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md text-[#1E4B6B] border"
              style={{ background: TOP_CARD_STYLES[3].iconBg, borderColor: TOP_CARD_STYLES[3].iconBorder }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7h12v8H3z" />
                <path d="M15 10h3l3 3v2h-6z" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="18" cy="18" r="2" />
              </svg>
            </div>
            <div>
              <div className="text-[18px] leading-none font-semibold text-[#1E4B6B]">Status :- {dispatchStatus}</div>
              <div className="text-[12px] text-[#5B6B7F] mt-1">Last trip on time</div>
            </div>
          </div>
      </div>

      <div className="mt-6 module-panel-grid-3">
        <div className="module-panel rounded-xl border border-[#D7E4FF] bg-[#F7FAFF] p-5 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
          <div className="text-sm font-semibold text-[#1E4B6B]">Milk Breakdown</div>
          <div className="mt-3 flex items-center gap-6">
            <div className="h-52 w-52 min-w-[12rem] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={litersTooltip} />
                  <Pie
                    data={milkShare}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {milkShare.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs font-semibold text-[#6B7FA0]">
              {milkShare.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name} {entry.value}%
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#D7E4FF] bg-[#F7FAFF] p-5 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1E4B6B]">Milk Procured</div>
            <div className="flex items-center gap-2">
              <select
                value={monthProcured}
                onChange={(e) => setMonthProcured(e.target.value)}
                className="rounded-lg border border-[#D7E4FF] bg-[#F1F6FF] px-3 py-1 text-xs font-semibold text-[#5B6B7F]"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  downloadPdfTable({
                    title: "Milk Procured Report",
                    subtitle: `Month: ${monthProcured}`,
                    headers: ["Society", "Value (L)"],
                    rows: milkProcured.map((entry) => [entry.name, entry.value]),
                    filename: `milk_procured_${monthProcured}.pdf`,
                  })
                }
                className="rounded border border-[#1E4B6B] bg-[#F1F6FF] px-3 py-1.5 text-[11px] font-semibold text-[#1E4B6B]"
              >
                Download Report
              </button>
            </div>
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={milkProcured}>
                <CartesianGrid stroke="#E1E6EB" strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "#6B7FA0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7FA0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={litersTooltip} />
                <Bar dataKey="value" fill="#1E4B6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#6B7FA0]">
            <span className="h-2 w-2 rounded-full bg-[#1E4B6B]" />
            Milk Procured from Societies
          </div>
        </div>

        <div className="rounded-xl border border-[#D7E4FF] bg-[#F7FAFF] p-5 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1E4B6B]">Milk Rejected / Adjusted</div>
            <div className="flex items-center gap-2">
              <select
                value={monthRejected}
                onChange={(e) => setMonthRejected(e.target.value)}
                className="rounded-lg border border-[#D7E4FF] bg-[#F1F6FF] px-3 py-1 text-xs font-semibold text-[#5B6B7F]"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  downloadPdfTable({
                    title: "Milk Rejected / Adjusted Report",
                    subtitle: `Month: ${monthRejected}`,
                    headers: ["Society", "Value (L)"],
                    rows: milkRejected.map((entry) => [entry.name, entry.value]),
                    filename: `milk_rejected_${monthRejected}.pdf`,
                  })
                }
                className="rounded border border-[#1E4B6B] bg-[#F1F6FF] px-3 py-1.5 text-[11px] font-semibold text-[#1E4B6B]"
              >
                Download Report
              </button>
            </div>
          </div>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={milkRejected}>
                <CartesianGrid stroke="#E1E6EB" strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "#6B7FA0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7FA0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={litersTooltip} />
                <Bar dataKey="value" fill="#E24C4C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#6B7FA0]">
            <span className="h-2 w-2 rounded-full bg-[#E24C4C]" />
            Milk Rejected / Adjusted
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#D7E4FF] bg-[#F7FAFF] p-5 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1E4B6B]">Month Wise Milk Quality</div>
            <div className="flex items-center gap-2">
              <select
                value={monthQualityFilter}
                onChange={(e) => setMonthQualityFilter(e.target.value)}
                className="rounded-lg border border-[#D7E4FF] bg-[#F1F6FF] px-3 py-1 text-xs font-semibold text-[#5B6B7F]"
              >
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  downloadPdfTable({
                    title: "Month Wise Milk Quality Report",
                    subtitle: `Month: ${monthQualityFilter}`,
                    headers: ["Month", "Good", "Penalised"],
                    rows: monthQuality
                      .filter((entry) => entry.name === monthQualityFilter)
                      .map((entry) => [entry.name, entry.good, entry.penalised]),
                    filename: `milk_quality_${monthQualityFilter}.pdf`,
                  })
                }
                className="rounded border border-[#1E4B6B] bg-[#F1F6FF] px-3 py-1.5 text-[11px] font-semibold text-[#1E4B6B]"
              >
                Download Report
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-[#6B7FA0]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#1E4B6B]" />
              Good Milk
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#E24C4C]" />
              Penalised
            </span>
          </div>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthQuality}>
                <CartesianGrid stroke="#E1E6EB" strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "#6B7FA0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7FA0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={litersTooltip} />
                <Bar dataKey="good" fill="#1E4B6B" radius={[6, 6, 0, 0]} />
                <Bar dataKey="penalised" fill="#E24C4C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#D7E4FF] bg-[#F7FAFF] p-5 shadow-[0_8px_18px_rgba(15,41,74,0.08)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1E4B6B]">Overheads</div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#6B7FA0]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#1E4B6B]" />
                Diesel
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#9DB5CC]" />
                Secretary Incentive
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#E24C4C]" />
                Repair & Maintenance
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <select
              value={monthOverheads}
              onChange={(e) => setMonthOverheads(e.target.value)}
              className="rounded-lg border border-[#D7E4FF] bg-[#F1F6FF] px-3 py-1 text-xs font-semibold text-[#5B6B7F]"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                downloadPdfTable({
                  title: "Overheads Report",
                  subtitle: `Month: ${monthOverheads}`,
                  headers: ["Month", "Diesel", "Secretary", "Repair"],
                  rows: overheads
                    .filter((entry) => entry.name === monthOverheads)
                    .map((entry) => [entry.name, entry.diesel, entry.secretary, entry.repair]),
                  filename: `overheads_${monthOverheads}.pdf`,
                })
              }
              className="rounded border border-[#1E4B6B] bg-[#F1F6FF] px-3 py-1.5 text-[11px] font-semibold text-[#1E4B6B]"
            >
              Download Report
            </button>
          </div>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overheads}>
                <CartesianGrid stroke="#E1E6EB" strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "#6B7FA0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7FA0", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={litersTooltip} />
                <Line type="monotone" dataKey="diesel" stroke="#1E4B6B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="secretary" stroke="#9DB5CC" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="repair" stroke="#E24C4C" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}












