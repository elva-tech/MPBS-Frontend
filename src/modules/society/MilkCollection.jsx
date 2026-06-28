import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import MilkCollectionTable from "./components/MilkCollectionTable";
import { getSession } from "../../utils/session";
import { createMilkEntries, createRequest, getMilkSessionStatus, listMyRequests } from "../../utils/api";
import { usePopup } from "../../shared/context/PopupContext";
import DemoUnlockToggle from "../../shared/components/DemoUnlockToggle";
import { isDemoUnlockEnabled } from "../../utils/demoMode";

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
  const { showPopup, showPrompt } = usePopup();
  const [session, setSession] = useState(null);
  const username = localStorage.getItem("society_name");
  const avatarLetter = username ? username.charAt(0).toUpperCase() : "";
  const [savedData, setSavedData] = useState(null);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [morningLocked, setMorningLocked] = useState(false);
  const [eveningLocked, setEveningLocked] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingUnlock, setPendingUnlock] = useState(false);
  const [unlockRequest, setUnlockRequest] = useState(null);
  const [bmcVerified, setBmcVerified] = useState(false);
  const [demoUnlock, setDemoUnlock] = useState(isDemoUnlockEnabled());
  const savingRef = useRef(false);
  const lastUnlockAtRef = useRef(0);

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
    const id = setInterval(() => {
      const next = getSession();
      if (next !== session) setSession(next);
    }, 30000);
    return () => clearInterval(id);
  }, [session]);

  const societyId = localStorage.getItem("society_id") || localStorage.getItem("society_name") || "";
  const today = new Date().toISOString().split("T")[0];

  const entriesToRows = (entries) => {
    if (!entries?.length) {
      return [createEmptyRow(), createEmptyRow()];
    }
    const rows = entries.map((entry) => ({
      milkType: entry.milkType || "",
      fat: entry.fat != null ? String(entry.fat) : "",
      snf: entry.snf != null ? String(entry.snf) : "",
      qty: entry.qty != null ? String(entry.qty) : "",
      rate: entry.rate != null ? Number(entry.rate).toFixed(2) : "",
      amount: entry.amount != null ? Number(entry.amount).toFixed(2) : "",
    }));
    while (rows.length < 2) rows.push(createEmptyRow());
    return rows;
  };

  const loadUnlockRequest = async () => {
    try {
      const res = await listMyRequests({ type: "milk_unlock" });
      const list = Array.isArray(res?.data) ? res.data : [];
      const match = list.find(
        (item) =>
          item.societyId === societyId &&
          item.sessionDate === today &&
          item.sessionCode === session
      );
      setUnlockRequest(match || null);
    } catch {
      // keep current unlock state
    }
  };

  const applySessionPayload = (sessionCode, payload) => {
    const entries = payload.entries || [];
    const locked = Boolean(payload.locked);
    const rows = entriesToRows(entries);

    if (sessionCode === "M") {
      setMorningRows(rows);
      setMorningLocked(locked);
    } else {
      setEveningRows(rows);
      setEveningLocked(locked);
    }

    if (locked && entries.length) {
      setSavedData((prev) => ({
        morningRows: sessionCode === "M" ? rows : prev?.morningRows || [createEmptyRow(), createEmptyRow()],
        eveningRows: sessionCode === "E" ? rows : prev?.eveningRows || [createEmptyRow(), createEmptyRow()],
        savedAt: new Date(),
      }));
    }

    return { locked, verifiedByBmc: Boolean(payload.bmcVerified) };
  };

  useEffect(() => {
    if (!session || !societyId) {
      setLoadingSession(false);
      return;
    }

    let active = true;
    const loadSession = async () => {
      setLoadingSession(true);
      try {
        const [mRes, eRes] = await Promise.all([
          getMilkSessionStatus({ societyId, date: today, session: "M" }),
          getMilkSessionStatus({ societyId, date: today, session: "E" }),
        ]);
        if (!active) return;

        const mPayload = mRes?.data || {};
        const ePayload = eRes?.data || {};
        const mState = applySessionPayload("M", mPayload);
        const eState = applySessionPayload("E", ePayload);

        const activeLocked = session === "M" ? mState.locked : eState.locked;
        const activeBmc = session === "M" ? mState.verifiedByBmc : eState.verifiedByBmc;
        setSessionLocked(activeLocked);
        setBmcVerified(activeBmc);

        await loadUnlockRequest();
      } catch (error) {
        if (active) {
          showPopup({ message: error.message || "Failed to load session data", type: "error" });
        }
      } finally {
        if (active) setLoadingSession(false);
      }
    };

    loadSession();
    window.addEventListener("focus", loadSession);
    return () => {
      active = false;
      window.removeEventListener("focus", loadSession);
    };
  }, [session, societyId, today, demoUnlock]);

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
  const effectiveSessionLocked = sessionLocked && !demoUnlock;
  const effectiveBmcVerified = bmcVerified && !demoUnlock;

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
    if (effectiveSessionLocked || savingRef.current) {
      showPopup({
        message: effectiveBmcVerified
          ? "BMC has verified this session. Changes are not allowed."
          : "This session is locked. Request admin unlock to edit.",
        type: "error",
      });
      return;
    }

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
      showPopup({ message: "Data entered is not sufficient.", type: "error" });
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
      showPopup({ message: "Please enter at least one complete milk entry.", type: "error" });
      return;
    }

    if (!societyId) {
      showPopup({ message: "Session expired. Please log in again.", type: "error" });
      window.location.href = "/login";
      return;
    }

    const date = today;
    const sessionLabel = isMorning ? "M" : "E";

    const payload = {
      societyId,
      date,
      session: sessionLabel,
      entries,
    };

    try {
      savingRef.current = true;
      setSaving(true);
      await createMilkEntries(payload);

      setSavedData({
        morningRows,
        eveningRows,
        savedAt: new Date(),
      });
      setSessionLocked(true);
      if (isMorning) setMorningLocked(true);
      else setEveningLocked(true);
      setUnlockRequest(null);
      showPopup({
        message: `Saved successfully. ${entries.length} entry(ies) saved. Session is now locked.`,
        type: "success",
      });
    } catch (error) {
      if (/locked|already saved|session is locked/i.test(error.message || "")) {
        setSessionLocked(true);
      }
      showPopup({ message: error.message || "Failed to save", type: "error" });
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleRequestUnlock = async () => {
    const now = Date.now()
    if (now - lastUnlockAtRef.current < 3000) {
      showPopup({
        message: "Please wait a few seconds before sending another unlock request.",
        type: "warning",
      });
      return;
    }

    if (unlockRequest?.status === "pending") {
      showPopup({
        message: "Unlock request is already pending with admin.",
        type: "warning",
      });
      return;
    }

    const reason = await showPrompt({
      title: "Request Admin Unlock",
      message: "Describe the mismatch or issue. Admin will review this unlock request:",
      placeholder: "Enter reason for unlock...",
      submitLabel: "Send Request",
    });
    if (!reason) return;

    try {
      setPendingUnlock(true);
      lastUnlockAtRef.current = Date.now();
      const unlockPayload = {
        type: "milk_unlock",
        username: localStorage.getItem("society_name") || "",
        role: "Society",
        societyName: localStorage.getItem("society_name") || "",
        societyId,
        sessionDate: today,
        sessionCode: isMorning ? "M" : "E",
        message: reason,
      };
      const societyUserId =
        localStorage.getItem("society_user_id") || localStorage.getItem("user_id");
      if (societyUserId) unlockPayload.userId = societyUserId;

      const res = await createRequest(unlockPayload);
      setUnlockRequest(res?.data || null);
      showPopup({
        message: res?.message || "Unlock request sent to admin.",
        type: "success",
      });
    } catch (error) {
      showPopup({ message: error.message || "Failed to send unlock request", type: "error" });
    } finally {
      setPendingUnlock(false);
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

  const handleGenerateDispatchSheet = async () => {
    if (!savedData) {
      await showPopup({
        message: "Please click Save before generating the dispatch sheet.",
        type: "warning",
      });
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
    <div className="module-page bg-[#F6F8FC] text-[#23324A] select-none">
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

      <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-3">
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

        <div className="flex flex-wrap items-center gap-3">
          <DemoUnlockToggle onChange={setDemoUnlock} />
          <button
            type="button"
            onClick={handleGenerateDispatchSheet}
            className="module-btn text-xs font-semibold text-white bg-[#1E4B6B] shadow-sm"
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

      {effectiveSessionLocked && (
        <div
          className={`mt-3 rounded border px-3 py-2 text-[11px] font-semibold shadow-sm ${
            effectiveBmcVerified
              ? "border-[#1E4B6B] bg-[#EEF4FF] text-[#1E4B6B]"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          {effectiveBmcVerified
            ? "BMC has verified this session. Editing is locked."
            : "Current session saved and locked. Request admin unlock if you need to edit."}
        </div>
      )}

      {unlockRequest && unlockRequest.status !== "approved" && (
        <div
          className={`mt-3 rounded border px-3 py-2 text-[11px] shadow-sm ${
            unlockRequest.status === "rejected"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-semibold">
            Unlock request: {(unlockRequest.status || "pending").toUpperCase()}
          </p>
          {unlockRequest.message ? (
            <p className="mt-1">Your note: {unlockRequest.message}</p>
          ) : null}
          {unlockRequest.adminActionReason ? (
            <p className="mt-1">Admin response: {unlockRequest.adminActionReason}</p>
          ) : null}
        </div>
      )}

      <div className="mt-4 space-y-5">
        {(isMorning
          ? [
              {
                label: "Morning Session",
                enabled: true,
                rows: morningRows,
                setRows: setMorningRows,
                locked: morningLocked,
              },
              {
                label: "Evening Session",
                enabled: false,
                rows: eveningRows,
                setRows: setEveningRows,
                locked: eveningLocked,
              },
            ]
          : [
              {
                label: "Evening Session",
                enabled: true,
                rows: eveningRows,
                setRows: setEveningRows,
                locked: eveningLocked,
              },
              {
                label: "Morning Session",
                enabled: false,
                rows: morningRows,
                setRows: setMorningRows,
                locked: morningLocked,
              },
            ]
        ).map((block) => (
          <div key={block.label}>
            <MilkCollectionTable
              sessionLabel={block.label}
              enabled={block.enabled && !effectiveSessionLocked && !loadingSession}
              locked={block.locked}
              rows={block.rows}
              onClearRow={(i) =>
                handleClearRow(i, block.rows, block.setRows)
              }
              onChange={(i, f, v) =>
                handleChange(i, f, v, block.rows, block.setRows)
              }
            />
            {block.enabled && (
              <div className="mt-3 flex flex-wrap justify-end gap-3">
                {effectiveSessionLocked ? (
                  <button
                    type="button"
                    onClick={handleRequestUnlock}
                    disabled={
                      pendingUnlock ||
                      loadingSession ||
                      unlockRequest?.status === "pending" ||
                      effectiveBmcVerified
                    }
                    className="module-btn border border-[#1E4B6B] bg-white text-xs font-semibold text-[#1E4B6B] shadow-sm disabled:opacity-60"
                  >
                    {pendingUnlock
                      ? "Sending..."
                      : unlockRequest?.status === "pending"
                        ? "Unlock Request Pending"
                        : "Request Admin Unlock"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || loadingSession || effectiveSessionLocked}
                    className="module-btn border border-[#1E4B6B] bg-[#1E4B6B] text-xs font-semibold text-white shadow-sm disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}







