import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { fetchRateAndAmount, getMilkEntries, getSocietyDashboard } from "../../utils/api";
import {
  ChevronDown,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function RateSheet() {
  const [reportSelections, setReportSelections] = useState({
    "Cattle Feed & Mineral Mixture": true,
    Revenue: true,
    "Milk Collection Report": true,
  });
  const [periods, setPeriods] = useState({
    "Cattle Feed & Mineral Mixture": { from: "", to: "" },
    Revenue: { from: "", to: "" },
    "Milk Collection Report": { from: "", to: "" },
  });
  const [openPeriod, setOpenPeriod] = useState("");

  const [calcType, setCalcType] = useState("Buffalo");
  const [calcFat, setCalcFat] = useState("3.0");
  const [calcSnf, setCalcSnf] = useState("8.0");
  const [calcRate, setCalcRate] = useState("");
  const [calcLoading, setCalcLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [downloadLoading, setDownloadLoading] = useState(false);
  useEffect(() => {
    const handleCopy = (event) => {
      event.preventDefault();
    };
    const handleCut = (event) => {
      event.preventDefault();
    };
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
        event.preventDefault();
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCut);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCut);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const reportCards = [
    {
      title: "Cattle Feed & Mineral Mixture",
      description:
        "Overview of total cattle feed & mineral mixture for the period",
    },
    {
      title: "Revenue",
      description: "Overview of total sales, revenue, and transactions for the period",
    },
    {
      title: "Milk Collection Report",
      description: "Overview of Milk collection Report for the period",
    },
  ];

  const rowsPerPage = 4;
  const buffaloData = useMemo(
    () =>
      Array.from({ length: 92 }, (_, i) => ({
        no: String(i + 1).padStart(2, "0"),
        fat: (0.1 + (i % 9) * 0.1).toFixed(1),
        snf: (0.1 + (i % 5) * 0.1).toFixed(1),
        rate: "52.00",
      })),
    []
  );
  const cowData = useMemo(
    () =>
      Array.from({ length: 92 }, (_, i) => ({
        no: String(i + 1).padStart(2, "0"),
        fat: (0.1 + (i % 9) * 0.1).toFixed(1),
        snf: (0.1 + (i % 5) * 0.1).toFixed(1),
        rate: "52.00",
      })),
    []
  );

  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(buffaloData.length, cowData.length) / rowsPerPage)
  );
  const clampedPage = Math.min(Math.max(page, 1), totalPages);
  const pageStart = (clampedPage - 1) * rowsPerPage;
  const pageEnd = pageStart + rowsPerPage;
  const buffaloRows = buffaloData.slice(pageStart, pageEnd);
  const cowRows = cowData.slice(pageStart, pageEnd);

  const updateRate = async (nextType, nextFat, nextSnf, changedField = "") => {
    if (!nextType || nextFat === "" || nextSnf === "") {
      setCalcRate("");
      return;
    }

    const fatValue = Number(nextFat);
    const snfValue = Number(nextSnf);
    if (!Number.isFinite(fatValue) || !Number.isFinite(snfValue)) {
      setCalcRate("");
      return;
    }
    const isFatValid = fatValue >= 3 && fatValue <= 6;
    const isSnfValid = snfValue >= 8 && snfValue <= 9;

    if (!isFatValid || !isSnfValid) {
      if (
        (changedField === "fat" && !isFatValid) ||
        (changedField === "snf" && !isSnfValid)
      ) {
        window.alert(
          "Fat % must be between 3 and 6, and SNF % must be between 8 and 9."
        );
      }
      setCalcRate("");
      return;
    }

    setCalcLoading(true);
    try {
      const res = await fetchRateAndAmount({
        milkType: nextType,
        fat: fatValue,
        snf: snfValue,
      });
      setCalcRate(res?.rate ? String(res.rate) : "");
    } catch (_) {
      setCalcRate("");
    } finally {
      setCalcLoading(false);
    }
  };

  const onSelectPeriod = (title, field, value) => {
    setPeriods((prev) => ({
      ...prev,
      [title]: { ...prev[title], [field]: value },
    }));
  };

  const toggleSelection = (title) => {
    setReportSelections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleDownloadAll = async () => {
    const selected = reportCards.filter((r) => reportSelections[r.title]);
    if (!selected.length) return;

    const hasInvalidPeriod = selected.some((report) => {
      const period = periods[report.title] || {};
      return !period.from || !period.to;
    });

    if (hasInvalidPeriod) {
      window.alert("Please select both From and To dates for all selected reports.");
      return;
    }

    const toNum = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const monthLabel = (dateValue) => {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return "Unknown";
      return date.toLocaleString("en-US", { month: "short", year: "numeric" });
    };

    setDownloadLoading(true);

    const societyId = localStorage.getItem("society_id") || localStorage.getItem("society_name") || "";
    let fetched = [];

    try {
      fetched = await Promise.all(
        selected.map(async (report) => {
          const period = periods[report.title];

          if (report.title === "Cattle Feed & Mineral Mixture") {
            const response = await getSocietyDashboard({
              societyId,
              from: period.from,
              to: period.to,
            });
            return {
              title: report.title,
              period,
              data: {
                feedMineral: response?.data?.feedMineral || [],
              },
            };
          }

          const response = await getMilkEntries({
            societyId,
            from: period.from,
            to: period.to,
          });

          const entries = response?.data?.milkEntries || [];

          if (report.title === "Revenue") {
            const revenueMap = new Map();
            entries.forEach((entry) => {
              const label = monthLabel(entry.date);
              const bucket = revenueMap.get(label) || { month: label, buffalo: 0, cow: 0 };
              if (entry.milkType === "Buffalo") {
                bucket.buffalo += toNum(entry.amount);
              } else if (entry.milkType === "Cow") {
                bucket.cow += toNum(entry.amount);
              }
              revenueMap.set(label, bucket);
            });

            const revenueArray = Array.from(revenueMap.values());
            console.log("Revenue data for PDF:", revenueArray);
            
            return {
              title: report.title,
              period,
              data: {
                entries,
                revenue: revenueArray,
              },
            };
          }

          return {
            title: report.title,
            period,
            data: { entries },
          };
        })
      );
    } catch (error) {
      window.alert(`Failed to fetch report data: ${error.message || "Unknown error"}`);
      setDownloadLoading(false);
      return;
    }

    const pdf = new jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Reports Download", 14, 18);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    const drawTable = (headers, rows, colWidths, startY) => {
      const marginX = 14;
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

    const rows = fetched.map((report) => {
      const from = report.period.from || "N/A";
      const to = report.period.to || "N/A";
      return [
        report.title,
        `${from} - ${to}`,
        "Fetched from backend",
      ];
    });

    let y = drawTable(
      ["Report", "Period", "Description"],
      rows,
      [60, 40, 82],
      28
    );

    const ensureY = (nextHeight = 14) => {
      if (y + nextHeight > 287) {
        pdf.addPage();
        y = 14;
      }
    };

    fetched.forEach((report) => {
      ensureY(20);
      y += 8;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(report.title, 14, y);
      y += 6;

      if (report.title === "Revenue") {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text("Revenue breakdown by milk type (in Rupees)", 14, y);
        y += 5;
        pdf.setTextColor(0, 0, 0);
        
        const revenueRows = (report.data.revenue || []).map((r) => [
          r.month || "-",
          toNum(r.buffalo).toFixed(2),
          toNum(r.cow).toFixed(2),
          (toNum(r.buffalo) + toNum(r.cow)).toFixed(2),
        ]);
        console.log("Rendering Revenue - revenueRows:", revenueRows);
        const tableRows = revenueRows.length
          ? revenueRows
          : [["No data", "0.00", "0.00", "0.00"]];
        y = drawTable(["Month", "Buffalo (Rs)", "Cow (Rs)", "Total (Rs)"], tableRows, [40, 50, 50, 50], y + 2);
      }

      if (report.title === "Milk Collection Report") {
        const milkRows = (report.data.entries || []).map((entry) => [
          entry.date || "-",
          entry.session === "M" ? "Morning" : entry.session === "E" ? "Evening" : entry.session || "-",
          entry.milkType || "-",
          toNum(entry.fat).toFixed(1),
          toNum(entry.snf).toFixed(1),
          toNum(entry.qty).toFixed(2),
          toNum(entry.rate).toFixed(2),
          toNum(entry.amount).toFixed(2),
        ]);
        const tableRows = milkRows.length
          ? milkRows
          : [["No data", "-", "-", "0.0", "0.0", "0.00", "0.00", "0.00"]];
        y = drawTable(
          ["Date", "Session", "Type", "Fat", "SNF", "Qty", "Rate", "Amount"],
          tableRows,
          [20, 18, 22, 16, 16, 20, 20, 24],
          y + 2
        );
      }

      if (report.title === "Cattle Feed & Mineral Mixture") {
        const feedRows = (report.data.feedMineral || []).map((f) => [
          f.name || "-",
          f.qty || "-",
          f.lastReceived || "-",
        ]);
        const tableRows = feedRows.length
          ? feedRows
          : [["No data", "-", "-"]];
        y = drawTable(["Item", "Quantity", "Last Received"], tableRows, [70, 45, 50], y + 2);
      }
    });

    pdf.save("reports_download.pdf");
    setDownloadLoading(false);
  };

  const handleDownloadRateSheet = () => {
    const pdf = new jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Milk Rates", 14, 18);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Page ${clampedPage} / ${totalPages}`, 14, 26);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Calculate Rate", 14, 36);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Type: ${calcType} Milk`, 14, 44);
    pdf.text(`Fat %: ${calcFat}`, 14, 50);
    pdf.text(`SNF %: ${calcSnf}`, 14, 56);
    pdf.text(`Rate (Rs/L): ${calcRate || "-"}`, 14, 62);

    const drawTable = (headers, rows, colWidths, startY) => {
      const marginX = 14;
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
          pdf.setFillColor(255, 255, 255);
          pdf.setTextColor(0, 0, 0);
          pdf.setDrawColor(0, 0, 0);
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.setTextColor(0, 0, 0);
          pdf.setDrawColor(0, 0, 0);
        }
        cells.forEach((cell, idx) => {
          pdf.rect(
            x,
            yPos,
            colWidths[idx],
            rowHeight,
            isHeader ? "D" : undefined
          );
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

    const renderRateTable = (title, rows, startY) => {
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(title, 14, startY);
      return drawTable(
        ["No", "Fat", "SNF", "Rate"],
        rows.map((r) => [r.no, r.fat, r.snf, r.rate]),
        [24, 30, 30, 45],
        startY + 6
      );
    };

    let nextY = renderRateTable("Buffalo Milk", buffaloRows, 74);
    renderRateTable("Cow Milk", cowRows, nextY + 4);

    pdf.save("rate_sheet.pdf");
  };

  return (
    <div className="p-6 bg-[#fbfcfe] select-none">
      <h1 className="text-[18px] font-semibold text-slate-800 mb-4">
        Reports Download
      </h1>

      <section className="bg-white border border-[#e7ebf1] rounded-xl p-4 mb-6">
        <div className="grid grid-cols-12 gap-4 items-stretch">
          <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportCards.map((card) => (
              <div
                key={card.title}
                className="border border-[#e2e8f0] rounded-lg shadow-[0_2px_8px_rgba(15,23,42,0.08)] p-3"
              >
                <div className="flex items-start gap-2 mb-2">
                  <input
                    id={`report-${card.title.replace(/\s+/g, '-')}`}
                    name={`report-${card.title.replace(/\s+/g, '-')}`}
                    type="checkbox"
                    checked={reportSelections[card.title]}
                    onChange={() => toggleSelection(card.title)}
                    className="mt-[2px] h-4 w-4 accent-[#1E4B6B]"
                  />
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800">
                      {card.title}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-4 mt-1">
                      {card.description}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setOpenPeriod((prev) =>
                      prev === card.title ? "" : card.title
                    )
                  }
                  className="mt-2 inline-flex items-center gap-2 text-[12px] font-semibold text-[#1E4B6B] bg-[#e7eef6] px-3 py-1.5 rounded-md"
                >
                  {periods[card.title].from && periods[card.title].to
                    ? `${periods[card.title].from} - ${periods[card.title].to}`
                    : "Select Period"}
                  <ChevronDown size={14} />
                </button>

                {openPeriod === card.title && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <input
                      id={`period-from-${card.title.replace(/\s+/g, '-')}`}
                      name={`period-from-${card.title.replace(/\s+/g, '-')}`}
                      type="date"
                      value={periods[card.title].from}
                      onChange={(e) =>
                        onSelectPeriod(card.title, "from", e.target.value)
                      }
                      className="w-full border border-[#e2e8f0] rounded-md text-[12px] px-2 py-1"
                    />
                    <input
                      id={`period-to-${card.title.replace(/\s+/g, '-')}`}
                      name={`period-to-${card.title.replace(/\s+/g, '-')}`}
                      type="date"
                      value={periods[card.title].to}
                      onChange={(e) =>
                        onSelectPeriod(card.title, "to", e.target.value)
                      }
                      className="w-full border border-[#e2e8f0] rounded-md text-[12px] px-2 py-1"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="col-span-12 lg:col-span-3 flex items-center justify-center lg:justify-end">
            <button
              onClick={handleDownloadAll}
              disabled={
                !Object.values(reportSelections).some((selected) => selected) || downloadLoading
              }
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-[#1E4B6B] px-5 py-2.5 rounded-md shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              {downloadLoading ? "Preparing..." : "Download All"}
            </button>
          </div>
        </div>
      </section>

      <h2 className="text-[17px] font-semibold text-slate-800 mb-3">
        Milk Rates
      </h2>

      <section className="bg-[#f7fbff] border border-[#dbe7f3] rounded-xl p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-4 lg:col-span-3">
            <div className="bg-white border border-[#e1e7ef] rounded-xl p-4 shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
              <div className="text-[13px] font-semibold text-slate-700 mb-3">
                Calculate Rate
              </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[12px] font-semibold text-slate-600">
                    <span>Type</span>
                    <div className="relative">
                      <select
                        id="milk-type-selector"
                        name="milk-type"
                        value={calcType}
                        onChange={(e) => {
                          const next = e.target.value;
                          setCalcType(next);
                          updateRate(next, calcFat, calcSnf);
                        }}
                        className="appearance-none inline-flex items-center gap-2 text-[12px] font-semibold text-[#1E4B6B] bg-[#e7eef6] px-3 py-1.5 pr-7 rounded-md"
                      >
                        <option value="Buffalo">Buffalo Milk</option>
                        <option value="Cow">Cow Milk</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1E4B6B]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[12px] font-semibold text-slate-600">
                    <span>Fat %</span>
                    <input
                      id="fat-percentage"
                      name="fat-percentage"
                      type="number"
                      step="0.1"
                      value={calcFat}
                      onChange={(e) => {
                        const nextFat = e.target.value;
                        const nextFatValue = Number(nextFat);
                        if (
                          nextFat !== "" &&
                          Number.isFinite(nextFatValue) &&
                          (nextFatValue < 3 || nextFatValue > 6)
                        ) {
                          window.alert(
                            "Fat % must be between 3 and 6, and SNF % must be between 8 and 9."
                          );
                          setCalcFat("0");
                          setCalcRate("");
                          return;
                        }
                        setCalcFat(nextFat);
                        updateRate(calcType, nextFat, calcSnf, "fat");
                      }}
                      className="bg-[#dbe4ed] text-slate-700 px-3 py-1.5 rounded-md w-[110px] text-center"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[12px] font-semibold text-slate-600">
                    <span>SNF %</span>
                    <input
                      id="snf-percentage"
                      name="snf-percentage"
                      type="number"
                      step="0.1"
                      value={calcSnf}
                      onChange={(e) => {
                        const nextSnf = e.target.value;
                        const nextSnfValue = Number(nextSnf);
                        if (
                          nextSnf !== "" &&
                          Number.isFinite(nextSnfValue) &&
                          (nextSnfValue < 8 || nextSnfValue > 9)
                        ) {
                          window.alert(
                            "Fat % must be between 3 and 6, and SNF % must be between 8 and 9."
                          );
                          setCalcSnf("0");
                          setCalcRate("");
                          return;
                        }
                        setCalcSnf(nextSnf);
                        updateRate(calcType, calcFat, nextSnf, "snf");
                      }}
                      className="bg-[#dbe4ed] text-slate-700 px-3 py-1.5 rounded-md w-[110px] text-center"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[12px] font-semibold text-slate-600">
                    <span>Rate (Rs/L)</span>
                    <div className="bg-[#1E4B6B] text-white px-3 py-1.5 rounded-md w-[110px] text-center">
                      {calcLoading ? "..." : calcRate || "0.00"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          <div className="col-span-12 md:col-span-8 lg:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { title: "Buffalo Milk", rows: buffaloRows },
              { title: "Cow Milk", rows: cowRows },
            ].map((block) => (
              <div
                key={block.title}
                className="bg-white border border-[#e1e7ef] rounded-xl shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
              >
                <div className="px-4 pt-4 pb-2 text-[13px] font-semibold text-slate-700">
                  {block.title}
                </div>
                <div className="px-4 pb-4">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="text-left font-semibold py-2">No.</th>
                        <th className="text-left font-semibold py-2">Fat %</th>
                        <th className="text-left font-semibold py-2">SNF %</th>
                        <th className="text-right font-semibold py-2">
                          Rate (Rs/L)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, i) => (
                        <tr
                          key={`${block.title}-${i}`}
                          className="border-t border-[#eef2f7] text-slate-600"
                        >
                          <td className="py-3">{row.no}</td>
                          <td className="py-3">{row.fat}</td>
                          <td className="py-3">{row.snf}</td>
                          <td className="py-3 text-right font-semibold text-slate-800">
                            {row.rate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white text-slate-500"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[12px] text-slate-500">
            {clampedPage}/{totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-[#d7e0ea] bg-white text-slate-500"
          >
            <ChevronRight size={14} />
          </button>

          <button
            onClick={handleDownloadRateSheet}
            className="ml-6 inline-flex items-center gap-2 text-[12px] font-semibold text-white bg-[#1E4B6B] px-4 py-2 rounded-full shadow"
          >
            <Download size={14} />
            Download Rate Sheet
          </button>
        </div>
      </section>
    </div>
  );
}







