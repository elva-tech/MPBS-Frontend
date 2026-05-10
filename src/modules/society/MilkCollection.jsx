import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import MilkCollectionTable from "./components/MilkCollectionTable";
import { getSession } from "../../utils/session";
import { createMilkEntries } from "../../utils/api";

const FIXED_RATE = 45;

const createEmptyRow = () => ({
  milkType: "",
  fat: "",
  snf: "",
  qty: "",
  rate: "",
  amount: "",
});

export default function MilkCollection() {
  const [session, setSession] = useState(null);
  const username = localStorage.getItem("society_name");
  const avatarLetter = username ? username.charAt(0).toUpperCase() : "";
  const [savedData, setSavedData] = useState(null);

  const [morningRows, setMorningRows] = useState([
    createEmptyRow(),
    createEmptyRow(),
  ]);
  const [eveningRows, setEveningRows] = useState([
    createEmptyRow(),
    createEmptyRow(),
  ]);

  useEffect(() => {
    setSession(getSession()); // "M" or "E"
  }, []);

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

  if (!session) return null;

  const isMorning = session === "M";

  const handleClearRow = (index, rows, setRows) =>
    setRows(rows.map((r, i) => (i === index ? createEmptyRow() : r)));

  const handleChange = (index, field, value, rows, setRows) => {
    const updated = rows.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    );
    if (!["milkType", "fat", "snf", "qty"].includes(field)) {
      setRows(updated);
      return;
    }

    const row = updated[index];
    const qty = Number(row.qty);
    const hasValidQty = Number.isFinite(qty) && qty > 0;
    const hasMilkType = Boolean(row.milkType);

    setRows(
      updated.map((r, i) => {
        if (i !== index) return r;
        if (!hasMilkType || !hasValidQty) {
          return { ...r, rate: "", amount: "" };
        }

        return {
          ...r,
          rate: FIXED_RATE.toFixed(2),
          amount: (qty * FIXED_RATE).toFixed(2),
        };
      })
    );
  };

  const handleSave = async () => {
    const rowsToValidate = isMorning ? morningRows : eveningRows;
    
    const hasInvalidRow = rowsToValidate.some((row) => {
      const hasAny =
        row.milkType !== "" ||
        row.fat !== "" ||
        row.snf !== "" ||
        row.qty !== "";
      if (!hasAny) return false;

      const fat = Number(row.fat);
      const snf = Number(row.snf);
      const qty = Number(row.qty);

      const missingRequired =
        !row.milkType ||
        row.fat === "" ||
        row.snf === "" ||
        row.qty === "";

      const invalidNumbers =
        !Number.isFinite(fat) ||
        !Number.isFinite(snf) ||
        !Number.isFinite(qty) ||
        fat <= 0 ||
        snf <= 0 ||
        qty <= 0;

      return missingRequired || invalidNumbers;
    });
    if (hasInvalidRow) {
      alert("Data entered is not sufficient.");
      return;
    }

    const entries = rowsToValidate
      .filter((row) => row.milkType && row.fat && row.snf && row.qty)
      .map((row) => ({
        milkType: row.milkType,
        fat: Number(row.fat),
        snf: Number(row.snf),
        qty: Number(row.qty),
        rate: FIXED_RATE,
        amount: Number(row.qty) * FIXED_RATE,
      }));

    if (entries.length === 0) {
      alert("Please enter at least one complete milk entry.");
      return;
    }

    const societyId = localStorage.getItem("society_id") || localStorage.getItem("society_name") || "";
    
    if (!societyId) {
      alert("Session expired. Please log in again.");
      window.location.href = "/society/login";
      return;
    }
    
    const date = new Date().toISOString().split("T")[0];
    const sessionLabel = isMorning ? "M" : "E";

    const payload = {
      societyId,
      date,
      session: sessionLabel,
      entries,
    };

    try {
      const response = await createMilkEntries(payload);

      setSavedData({
        morningRows,
        eveningRows,
        savedAt: new Date(),
      });
      alert("Saved successfully. " + entries.length + " entry(ies) saved.");
    } catch (error) {
      alert("Failed to save: " + (error.message || "Unknown error"));
    }
  };

  const normalizeRows = (label, rows) =>
    rows
      .filter(
        (r) =>
          r.milkType ||
          r.fat ||
          r.snf ||
          r.qty ||
          r.rate ||
          r.amount
      )
      .map((r) => ({
        session: label,
        milkType: r.milkType || "",
        fat: r.fat || "",
        snf: r.snf || "",
        qty: r.qty || "",
        rate: r.rate || "",
        amount: r.amount || "",
      }));

  const drawTable = (doc, rows, startY) => {
    const headers = [
      "Session",
      "Type",
      "Fat %",
      "SNF %",
      "Qty (L)",
      "Rate",
      "Amount",
    ];
    const colWidths = [22, 52, 16, 16, 20, 20, 24];
    const rowHeight = 7;
    const marginX = 10;
    let y = startY;

    const drawRow = (cells, isHeader = false) => {
      let x = marginX;
      doc.setFont("helvetica", isHeader ? "bold" : "normal");
      doc.setFontSize(9);
      cells.forEach((cell, idx) => {
        doc.rect(x, y, colWidths[idx], rowHeight);
        doc.text(String(cell), x + 1.5, y + 4.8);
        x += colWidths[idx];
      });
      y += rowHeight;
    };

    const ensureSpace = () => {
      if (y + rowHeight > 287) {
        doc.addPage();
        y = 12;
        drawRow(headers, true);
      }
    };

    drawRow(headers, true);
    rows.forEach((row) => {
      ensureSpace();
      drawRow(
        [
          row.session,
          row.milkType,
          row.fat,
          row.snf,
          row.qty,
          row.rate,
          row.amount,
        ],
        false
      );
    });

    return y;
  };

  const handleGenerateDispatchSheet = () => {
    if (!savedData) {
      alert("Please click Save before generating the dispatch sheet.");
      return;
    }

    const doc = new jsPDF("portrait", "mm", "a4");
    let y = 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("DISPATCH SHEET", 105, y, { align: "center" });

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Date: ${dateLabel}`, 10, y);
    if (username) doc.text(`Society: ${username}`, 75, y);
    y += 6;

    const rows = [
      ...normalizeRows("Morning", savedData.morningRows),
      ...normalizeRows("Evening", savedData.eveningRows),
    ];

    if (rows.length === 0) {
      doc.text("No saved entries to display.", 10, y + 6);
      doc.save("dispatch_sheet.pdf");
      return;
    }

    drawTable(doc, rows, y + 2);
    doc.save("dispatch_sheet.pdf");
  };

  const now = new Date();
  const formatted = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const [day, mon, year] = formatted.split(" ");
  const dateLabel = `${day} ${mon.toUpperCase()} ${year}`;
  const dayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
  });

  return (
    <div className="min-h-full bg-[#F6F8FC] p-6 text-[#23324A] select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#1E4B6B]">
          <svg
            width="28"
            height="22"
            viewBox="0 0 64 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M22 6c6 7 10 13 10 18a10 10 0 1 1-20 0c0-5 4-11 10-18Z"
              fill="#B6C2CB"
            />
            <path
              d="M16 44a10 10 0 0 1-10-10c0-5 4-11 10-18 6 7 10 13 10 18a10 10 0 0 1-10 10Z"
              fill="#1E4B6B"
            />
            <path
              d="M40 44a10 10 0 0 1-10-10c0-5 4-11 10-18 6 7 10 13 10 18a10 10 0 0 1-10 10Z"
              fill="#1E4B6B"
            />
          </svg>
          <h1 className="text-[18px] font-semibold">Milk Collection</h1>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#1E4B6B]">
          {username ? (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
                />
              </svg>
              <span>{username}</span>
              <div className="h-7 w-7 rounded border border-[#CBD7E6] bg-white grid place-items-center text-[11px] font-semibold text-[#1E4B6B]">
                {avatarLetter}
              </div>
            </>
          ) : (
            <>
              <span>Username</span>
              <div className="h-7 w-7 rounded border border-[#CBD7E6] bg-white grid place-items-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                    fill="#1E4B6B"
                  />
                  <path
                    d="M5 20a7 7 0 0 1 14 0"
                    stroke="#1E4B6B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded border border-[#D9DFF0] bg-white px-4 py-2 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded bg-[#EFEAFB] text-[#6B4EBC]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="16"
                  rx="2"
                  stroke="#6B4EBC"
                  strokeWidth="2"
                />
                <path
                  d="M8 3v4M16 3v4M3 10h18"
                  stroke="#6B4EBC"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{dateLabel}</div>
              <div className="text-xs text-[#6A7C92]">{dayLabel}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded border border-[#D9DFF0] bg-white px-4 py-2 shadow-sm">
            <div className="grid h-10 w-10 place-items-center rounded bg-[#EAF2FF] text-[#1E4B6B]">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 2h12M6 22h12"
                  stroke="#1E4B6B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 2v6l4 4 4-4V2"
                  stroke="#1E4B6B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M8 22v-6l4-4 4 4v6"
                  stroke="#1E4B6B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="text-[11px] text-[#6A7C92]">
                Current Session
              </div>
              <div className="text-sm font-semibold">
                {isMorning ? "Morning" : "Evening"}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateDispatchSheet}
          className="ml-auto flex items-center gap-2 rounded bg-[#1E4B6B] px-4 py-2 text-xs font-semibold text-white shadow-sm"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 3v10"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="m8 10 4 4 4-4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="4"
              y="17"
              width="16"
              height="4"
              rx="1.5"
              fill="white"
            />
          </svg>
          Generate Dispatch Sheet
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded border border-[#E2E6F0] bg-white px-3 py-2 text-[11px] text-[#5F6F85] shadow-sm">
        <div className="mt-0.5 grid h-4 w-4 place-items-center rounded bg-[#1E4B6B] text-white">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 7v6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="17" r="1.5" fill="white" />
          </svg>
        </div>
        <p>
          Session Is Auto-Selected Based On System Time. Morning Session
          Is Active From 12:00 AM To 12:00 PM, And Evening Session From
          12:00 PM To 12:00 AM.
        </p>
      </div>

      <div className="mt-4 space-y-5">
        {(isMorning
          ? [
              {
                label: "Morning Session",
                enabled: true,
                rows: morningRows,
                setRows: setMorningRows,
              },
              {
                label: "Evening Session",
                enabled: false,
                rows: eveningRows,
                setRows: setEveningRows,
              },
            ]
          : [
              {
                label: "Evening Session",
                enabled: true,
                rows: eveningRows,
                setRows: setEveningRows,
              },
              {
                label: "Morning Session",
                enabled: false,
                rows: morningRows,
                setRows: setMorningRows,
              },
            ]
        ).map((block) => (
          <div key={block.label}>
            <MilkCollectionTable
              sessionLabel={block.label}
              enabled={block.enabled}
              rows={block.rows}
              onClearRow={(i) =>
                handleClearRow(i, block.rows, block.setRows)
              }
              onChange={(i, f, v) =>
                handleChange(i, f, v, block.rows, block.setRows)
              }
            />
            {block.enabled && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 rounded border border-[#1E4B6B] bg-[#1E4B6B] px-4 py-2 text-xs font-semibold text-white shadow-sm"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 4h11l3 3v13H5V4Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 4v6h6V4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Save
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}







