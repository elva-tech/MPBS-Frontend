import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import { getSocietyDashboard } from "../../utils/api";
import { litersTooltip, percentTooltip } from "../../shared/charts/tooltips";

const COLORS = ["#1E4B6B", "#9DB5CC"];
const TOP_CARD_STYLES = [
  { bg: "#F4F0FB", border: "#D9CAE9", iconBg: "#F1ECF8", iconBorder: "#D9CAE9" },
  { bg: "#EEF4FF", border: "#CFE0FF", iconBg: "#EAF1FF", iconBorder: "#CFE0FF" },
  { bg: "#F8F3E8", border: "#EFD5B4", iconBg: "#F5EBDD", iconBorder: "#EFD5B4" },
  { bg: "#EEF2F7", border: "#D4E0EF", iconBg: "#EAF1FF", iconBorder: "#D4E0EF" },
  { bg: "#EEF8F2", border: "#CFE9D9", iconBg: "#E7F6EC", iconBorder: "#CFE9D9" },
];

export default function Dashboard() {
  const username = localStorage.getItem("society_name");
  const avatarLetter = username ? username.charAt(0).toUpperCase() : "";
  
  // State for dashboard data
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [feedMineral, setFeedMineral] = useState([]);
  const [milkBreakdown, setMilkBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const updatedOn = new Date().toLocaleDateString() || "";

  useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const societyId = localStorage.getItem("society_id") || localStorage.getItem("society_name") || "";
        const response = await getSocietyDashboard({ societyId });
        const data = response?.data || {};

        if (!active) return;
        setSummary(
          data.summary || {
            totalMilk: 0,
            totalFarmers: 0,
            session: { morning: 0, evening: 0 },
            type: { cow: 0, buffalo: 0 },
            totalPayable: 0,
          }
        );
        setMilkBreakdown(data.milkBreakdown || []);
        setRevenue(data.revenue || []);
        setFeedMineral(data.feedMineral || []);

        setLoading(false);
      } catch (err) {
        if (!active) return;
        console.error("Error loading dashboard data:", err);
        setError(err.message);
        setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    document.body.classList.add("dashboard-no-scroll");
    return () => {
      document.body.classList.remove("dashboard-no-scroll");
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="module-page flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E4B6B]"></div>
          <p className="mt-4 text-[#5B6B7F]">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="module-page flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">?? Error Loading Dashboard</div>
          <p className="text-[#5B6B7F] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#C7CCD4] text-[#1E4B6B] rounded-lg hover:bg-[#C7CCD4]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Fallback for missing summary data
  if (!summary) {
    return (
      <div className="module-page flex min-h-[50vh] items-center justify-center">
        <p className="text-[#5B6B7F]">No data available</p>
      </div>
    );
  }

  const handleDownloadDashboard = () => {
    const pdf = new jsPDF("portrait", "mm", "a4");
    let y = 14;

    const drawTable = (headers, rows, colWidths, startY) => {
      const marginX = 10;
      const rowHeight = 7;
      let yPos = startY;

      const truncate = (text, maxWidth) => {
        const str = String(text);
        if (pdf.getTextWidth(str) <= maxWidth) return str;
        let out = str;
        while (out.length > 0 && pdf.getTextWidth(`${out}...`) > maxWidth) {
          out = out.slice(0, -1);
        }
        return `${out}...`;
      };

      const drawRow = (cells, isHeader = false) => {
        let x = marginX;
        pdf.setFont("helvetica", isHeader ? "bold" : "normal");
        pdf.setFontSize(9);
        if (isHeader) {
          pdf.setFillColor(0, 0, 0);
          pdf.setTextColor(255, 255, 255);
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.setTextColor(0, 0, 0);
        }
        cells.forEach((cell, idx) => {
          pdf.setDrawColor(0, 0, 0);
          pdf.rect(x, yPos, colWidths[idx], rowHeight, isHeader ? "F" : undefined);
          const text = truncate(cell, colWidths[idx] - 2);
          pdf.text(text, x + 1.5, yPos + 4.8);
          x += colWidths[idx];
        });
        yPos += rowHeight;
      };

      const ensureSpace = () => {
        if (yPos + rowHeight > 287) {
          pdf.addPage();
          yPos = 12;
          drawRow(headers, true);
        }
      };

      drawRow(headers, true);
      rows.forEach((row) => {
        ensureSpace();
        drawRow(row, false);
      });

      return yPos;
    };

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("DASHBOARD REPORT", 105, y, { align: "center" });

    y += 6;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Updated On: ${updatedOn}`, 105, y, { align: "center" });

    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Summary", 10, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Today's Total Milk: ${summary.totalMilk} L`, 10, y);
    pdf.text(`Total Farmers: ${summary.totalFarmers}`, 110, y);
    y += 6;
    pdf.text(`Morning: ${summary.session.morning} L`, 10, y);
    pdf.text(`Evening: ${summary.session.evening} L`, 110, y);
    y += 6;
    pdf.text(`Buffalo: ${summary.type.buffalo} L`, 10, y);
    pdf.text(`Cow: ${summary.type.cow} L`, 110, y);

    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Milk Breakdown", 10, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    milkBreakdown.forEach((m) => {
      pdf.text(`${m.name}: ${m.value} L`, 10, y);
      y += 5;
    });

    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Cattle Feed & Mineral Mix", 10, y);
    y += 6;
    y = drawTable(
      ["Item", "Qty", "Last Received"],
      feedMineral.map((f) => [f.name, f.qty, f.lastReceived]),
      [70, 30, 70],
      y
    );

    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Revenue", 10, y);
    y += 6;
    y = drawTable(
      ["Month", "Buffalo", "Cow"],
      revenue.map((r) => [r.month.slice(0, 3), r.buffalo, r.cow]),
      [30, 40, 40],
      y
    );

    pdf.save("dashboard_report.pdf");
  };

  const handleDownloadDispatchSheet = () => {
    // Dispatch sheet functionality - add API call when needed
    console.log("Download dispatch sheet");
  };

  return (
    <div className="module-page text-[#0F1E33] select-none cursor-default font-bold">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#1E4B6B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <h2 className="font-semibold text-[#1E4B6B]">Dashboard</h2>
        </div>

        <div className="flex items-center gap-3 text-sm text-[#5B6B7F]">
          {username && (
            <svg className="w-4 h-4 text-[#1E4B6B]" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
              />
            </svg>
          )}
          {username && <span className="hidden md:inline">{username}</span>}
          {username && (
            <div className="w-7 h-7 rounded-full bg-[#EAF1FF] text-[#1E4B6B] flex items-center justify-center">
              {avatarLetter}
            </div>
          )}
        </div>
      </div>

      {/* TOP STATS */}
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-stretch">
        <div className="module-stat-grid flex-1 xl:grid-cols-4">
        {/* Total Milk */}
        <div
          className="module-stat-card rounded-md border shadow-[0_6px_14px_rgba(15,41,74,0.12)] flex items-center gap-3"
          style={{ background: TOP_CARD_STYLES[0].bg, borderColor: TOP_CARD_STYLES[0].border }}
        >
          <div
            className="min-h-[76px] w-10 shrink-0 self-stretch rounded-md flex items-center justify-center text-[#1E4B6B] border"
            style={{ background: TOP_CARD_STYLES[0].iconBg, borderColor: TOP_CARD_STYLES[0].iconBorder }}
          ><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0L12 2.7z" /></svg></div>
          <div>
            <div className="text-[16px] text-[#252236] font-medium leading-tight whitespace-nowrap">Today&rsquo;s Total Milk</div>
            <p className="text-[29px] font-medium text-[#252236] leading-none mt-2">{summary.totalMilk} L</p>
          </div>
        </div>

        {/* Total Farmers */}
        <div
          className="module-stat-card rounded-md border shadow-[0_6px_14px_rgba(15,41,74,0.12)] flex items-center gap-3"
          style={{ background: TOP_CARD_STYLES[1].bg, borderColor: TOP_CARD_STYLES[1].border }}
        >
          <div
            className="min-h-[76px] w-10 shrink-0 self-stretch rounded-md flex items-center justify-center text-[#1E4B6B] border"
            style={{ background: TOP_CARD_STYLES[1].iconBg, borderColor: TOP_CARD_STYLES[1].iconBorder }}
          ><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4" /><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
          <div>
            <div className="text-[16px] text-[#252236] font-medium leading-tight whitespace-nowrap">Total Farmers</div>
            <p className="text-[29px] font-medium text-[#252236] leading-none mt-2">{summary.totalFarmers}</p>
          </div>
        </div>

        {/* Morning / Evening */}
        <div
          className="module-stat-card rounded-md border shadow-[0_6px_14px_rgba(15,41,74,0.12)] flex items-center gap-3"
          style={{ background: TOP_CARD_STYLES[2].bg, borderColor: TOP_CARD_STYLES[2].border }}
        >
          <div
            className="min-h-[76px] w-10 shrink-0 self-stretch rounded-md flex items-center justify-center border"
            style={{ background: TOP_CARD_STYLES[2].iconBg, borderColor: TOP_CARD_STYLES[2].iconBorder }}
          >
            <div className="w-6 h-6 rounded-full bg-[#1E4B6B] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#EAF1FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="7.5" />
                <path d="M12 7v5l3 2" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] text-[#3B3124] font-medium leading-tight mb-2 whitespace-nowrap">Types Of Milk</div>
            <div className="module-stat-split">
              <div className="module-stat-split-item">
                <span className="module-stat-split-label text-[#8B806F]">
                  <svg className="w-3.5 h-3.5 shrink-0 text-[#6B7FA0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 15h16" />
                    <path d="M7 13l2-2 2 2" />
                    <path d="M12 6a6 6 0 0 0-6 6" />
                    <path d="M12 6a6 6 0 0 1 6 6" />
                    <path d="M12 2v2" />
                    <path d="M3 17h1M20 17h1" />
                    <path d="M6 9h1M17 9h1" />
                  </svg>
                  Morning
                </span>
                <p className="module-stat-split-value text-[#3B3124]">{summary.session.morning} L</p>
              </div>
              <div className="module-stat-split-item">
                <span className="module-stat-split-label text-[#8B806F]">
                  <svg className="w-3.5 h-3.5 shrink-0 text-[#6B7FA0]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 15h16" />
                    <path d="M13 13l2 2 2-2" />
                    <path d="M12 6a6 6 0 0 0-6 6" />
                    <path d="M12 6a6 6 0 0 1 6 6" />
                    <path d="M12 2v2" />
                    <path d="M3 17h1M20 17h1" />
                    <path d="M6 9h1M17 9h1" />
                  </svg>
                  Evening
                </span>
                <p className="module-stat-split-value text-[#3B3124]">{summary.session.evening} L</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buffalo / Cow */}
        <div
          className="module-stat-card rounded-md border shadow-[0_6px_14px_rgba(15,41,74,0.12)] flex items-center gap-3"
          style={{ background: TOP_CARD_STYLES[3].bg, borderColor: TOP_CARD_STYLES[3].border }}
        >
          <div
            className="min-h-[76px] w-10 shrink-0 self-stretch rounded-md flex items-center justify-center text-[#1E4B6B] border"
            style={{ background: TOP_CARD_STYLES[3].iconBg, borderColor: TOP_CARD_STYLES[3].iconBorder }}
          >
            <svg className="w-5 h-5" viewBox="0 0 64 64" aria-hidden="true">
              <path
                fill="currentColor"
                d="M24 6h16v6l-2 2v8l6 8a15 15 0 0 1 3 9v16c0 5-4 9-9 9H26c-5 0-9-4-9-9V39c0-3 1-6 3-9l6-8v-8l-2-2V6z"
              />
              <path
                fill="#FFFFFF"
                d="M23 33c2-3 5-5 9-5s7 2 9 5v11c0 3-2 6-6 6H20c-3 0-6-3-6-6V33h9z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] text-[#12213A] font-medium leading-tight mb-2 whitespace-nowrap">Types Of Milk</div>
            <div className="module-stat-split">
              <div className="module-stat-split-item">
                <span className="module-stat-split-label text-[#657491]">
                  <svg
                    className="w-3.5 h-3.5 shrink-0 text-[#1E4B6B]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 12c0-3.5 3.6-6 8-6s8 2.5 8 6v2c0 2.8-2.5 5-5.5 5h-5C6.5 19 4 16.8 4 14z" />
                    <path d="M6 7 3 5M18 7l3-2" />
                    <path d="M9 14h.01M15 14h.01" />
                    <path d="M10 17c1.2.8 2.8.8 4 0" />
                  </svg>
                  Buffalo
                </span>
                <p className="module-stat-split-value text-[#12213A]">{summary.type.buffalo} L</p>
              </div>
              <div className="module-stat-split-item">
                <span className="module-stat-split-label text-[#657491]">
                  <svg
                    className="w-3.5 h-3.5 shrink-0 text-[#1E4B6B]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12c0-3 3-5 7-5s7 2 7 5v3c0 2.8-2.2 5-5 5H10c-2.8 0-5-2.2-5-5z" />
                    <path d="M6 7 3 5M18 7l3-2" />
                    <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none" />
                    <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none" />
                    <path d="M10 16c1.2.8 2.8.8 4 0" />
                    <path
                      d="M12.5 9.5c1.3 0 2.4 1 2.4 2.2 0 1.7-1.8 2.8-3.5 2.2-1.2-.4-1.9-1.5-1.9-2.6 0-1 0.9-1.8 2-1.8z"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                  Cow
                </span>
                <p className="module-stat-split-value text-[#12213A]">{summary.type.cow} L</p>
              </div>
            </div>
          </div>
        </div>

        </div>

        <button
          onClick={handleDownloadDispatchSheet}
          className="module-btn w-full xl:w-auto xl:min-w-[240px] bg-[#C7CCD4] hover:bg-[#C7CCD4] text-[#1E4B6B] font-semibold shadow-[0_8px_18px_rgba(15,41,74,0.25)] xl:self-center"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Generate Dispatch Sheet
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="module-panel-grid-3">
        {/* MILK BREAKDOWN */}
        <div className="module-panel border border-[#D7E4FF] rounded-xl p-5 bg-white shadow-[0_8px_18px_rgba(15,41,74,0.08)] flex flex-col">
          <h3 className="text-sm font-semibold text-[#1E4B6B]">Milk Breakdown</h3>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-[#6B7FA0]">
            {milkBreakdown.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span>{item.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-1 min-h-[300px] w-full items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
              <Tooltip formatter={litersTooltip} />
              <Pie
                data={milkBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {milkBreakdown.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* FEED */}
        <div className="module-panel border border-[#D7E4FF] rounded-xl bg-white shadow-[0_8px_18px_rgba(15,41,74,0.08)] flex flex-col">
          <div className="p-5">
            <h3 className="text-sm font-semibold text-[#1E4B6B]">Cattle Feed & Mineral Mix</h3>

            <div className="mt-4 space-y-6 text-sm">
              {feedMineral.map((item, index) => (
                <div key={item.name}>
                <div className="flex items-center justify-between font-semibold text-[#1E4B6B]">
                    <span className="flex items-center gap-2">
                      {index === 0 ? (
                        <svg
                          className="w-5 h-5 text-[#1E4B6B]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 21V10" />
                          <path d="M12 10c-3.8 0-6-2.6-6-5.7C6 3.2 7.8 2 10 2c3.8 0 6 3.2 6 6 0 .7-.1 1.4-.3 2" />
                          <path d="M12 10c3.8 0 6-2.6 6-5.7C18 3.2 16.2 2 14 2c-3.8 0-6 3.2-6 6 0 .7.1 1.4.3 2" />
                          <path d="M12 18c-2.6 0-4.7-1.8-4.7-4.1 0-2 1.6-3.5 4.7-3.5 3.1 0 4.7 1.6 4.7 3.5 0 2.3-2.1 4.1-4.7 4.1z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-[#1E4B6B]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
                          <path d="M4.2 12c2.3-3.3 5-5 7.8-5s5.5 1.7 7.8 5c-2.3 3.3-5 5-7.8 5s-5.5-1.7-7.8-5z" />
                          <path d="M7 5.2c2 1.2 3.5 2.6 4.6 4.2" />
                          <path d="M17 18.8c-2-1.2-3.5-2.6-4.6-4.2" />
                          <path d="M17 5.2c-2 1.2-3.5 2.6-4.6 4.2" />
                          <path d="M7 18.8c2-1.2 3.5-2.6 4.6-4.2" />
                        </svg>
                      )}
                      {item.name}
                    </span>
                    <span>{item.qty}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-[#5B6B7F]">
                    <span>Last Received On</span>
                    <span>{item.lastReceived}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="module-card-footer">
            <button
              onClick={handleDownloadDashboard}
              className="module-btn mx-auto w-full max-w-[240px] border border-[#1E4B6B] text-[#1E4B6B] font-semibold bg-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12" />
                <path d="M7 10l5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              Download Report
            </button>
          </div>
        </div>

        {/* REVENUE */}
        <div className="module-panel border border-[#D7E4FF] rounded-xl bg-white shadow-[0_8px_18px_rgba(15,41,74,0.08)] flex flex-col">
          <div className="p-5">
            <h3 className="text-sm font-semibold text-[#1E4B6B]">Revenue</h3>

            <div className="mt-3 flex justify-end gap-4 text-xs text-[#6B7FA0]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[0] }} />
                Buffalo Milk
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[1] }} />
                Cow Milk
              </div>
            </div>

            <div className="mt-2 min-h-[240px]">
              <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={revenue}
                margin={{ left: 4, right: 16, top: 6, bottom: 12 }}
              >
                <CartesianGrid stroke="#E1E6EB" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => v.slice(0, 3)}
                  tick={{ fontSize: 11, fill: "#6B7FA0" }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  interval={0}
                  padding={{ left: 6, right: 12 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7FA0" }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Security Rating",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#6B7FA0", fontSize: 11 },
                  }}
                />
                <Tooltip formatter={litersTooltip} />
                <Line type="monotone" dataKey="buffalo" stroke={COLORS[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cow" stroke={COLORS[1]} strokeWidth={2} dot={false} />
              </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-1 text-center text-xs text-[#6B7FA0]">Month</div>
          </div>

          <div className="module-card-footer">
            <button
              onClick={handleDownloadDashboard}
              className="module-btn mx-auto w-full max-w-[240px] border border-[#1E4B6B] text-[#1E4B6B] font-semibold bg-white"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12" />
                <path d="M7 10l5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}










