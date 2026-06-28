import { useCallback, useEffect, useState } from "react";
import { fetchSocieties, getMilkSessionStatus, createVerification, listNotificationsForRole, listVerifications } from "../../utils/api";
import "./SocietyMilkVerification.css";
import EntryTable from "./components/EntryTable";
import NotificationBell from "./components/NotificationBell";
import BMCPanel from "./components/BMCPanel";
import SaveModal from "./components/SaveModal";
import DemoUnlockToggle from "../../shared/components/DemoUnlockToggle";
import { isDemoUnlockEnabled } from "../../utils/demoMode";
import {
  BMC_USER,
  calcSession,
  genReport,
  isRowValid,
  emptyRow,
} from "./utils/engine";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function currentSessionCode() {
  return new Date().getHours() < 12 ? "M" : "E";
}

function currentSessionLabel() {
  return currentSessionCode() === "M" ? "Morning" : "Evening";
}

function dedupeMilkEntriesByType(entries = []) {
  const map = new Map();
  for (const entry of entries) {
    const key = String(entry.milkType || entry.type || "").trim().toLowerCase();
    if (!key) continue;
    const createdAt = entry.createdAt ? new Date(entry.createdAt).getTime() : 0;
    const prev = map.get(key);
    const prevAt = prev?.createdAt ? new Date(prev.createdAt).getTime() : 0;
    if (!prev || createdAt >= prevAt) {
      map.set(key, entry);
    }
  }
  return Array.from(map.values());
}

function dedupeRowsByType(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const type = String(row.type || row.milkType || "").trim();
    if (!type) continue;
    map.set(type.toLowerCase(), row);
  }
  return Array.from(map.values());
}

function bmcEntriesToRows(entries = []) {
  const rows = dedupeRowsByType(
    entries.map((e) => ({
      type: e.type || e.milkType,
      fat: e.fat,
      snf: e.snf,
      qty: e.qty,
    }))
  );
  while (rows.length < 2) rows.push(emptyRow());
  return rows;
}

function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      let h = n.getHours();
      const m = n.getMinutes();
      const s = n.getSeconds();
      const ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      const p = (v) => String(v).padStart(2, "0");
      setTime(`${p(h)}:${p(m)}:${p(s)} ${ap}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}`;
}

function toTimeAgo(isoDate) {
  if (!isoDate) return "Just now";
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function inferNotifType(message = "") {
  const msg = message.toLowerCase();
  if (msg.includes("fail") || msg.includes("error") || msg.includes("mismatch")) return "error";
  if (msg.includes("pending") || msg.includes("delay") || msg.includes("warning")) return "warning";
  if (msg.includes("verified") || msg.includes("success")) return "success";
  return "info";
}

export default function MilkVerification() {
  const clock = useClock();
  const dateStr = todayStr();
  const bmcUserName = localStorage.getItem("bmc_name") || BMC_USER.name;

  const [societies, setSocieties] = useState([]);
  const [selectedSoc, setSelectedSoc] = useState(null);
  const [loadingSocieties, setLoadingSocieties] = useState(true);
  const [societyError, setSocietyError] = useState(null);

  const [rows, setRows] = useState([emptyRow(), emptyRow()]);
  const [bmcRows, setBmcRows] = useState([emptyRow(), emptyRow()]);

  const [verifyChoice, setVerifyChoice] = useState(null);

  const [saveModal, setSaveModal] = useState(null);
  const [verificationLocked, setVerificationLocked] = useState(false);
  const [societySessionSaved, setSocietySessionSaved] = useState(false);
  const [societySessionEditing, setSocietySessionEditing] = useState(false);
  const [demoUnlock, setDemoUnlock] = useState(isDemoUnlockEnabled());
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [notifs, setNotifs] = useState([]);

  const readKey = "bmc_notif_read_ids";
  const dismissedKey = "bmc_notif_dismissed_ids";

  useEffect(() => {
    async function loadSocieties() {
      try {
        setLoadingSocieties(true);
        const response = await fetchSocieties();
        const societyList = response?.data || [];
        setSocieties(
          societyList.map((s) => ({
            id: s._id,
            societyId: s.societyId,
            name: s.societyName,
            district: s.district,
            taluk: s.taluk,
            contactNumber: s.contactNumber,
            qty: s.qty || 0,
          }))
        );
      } catch (error) {
        console.error("Error loading societies:", error);
        setSocietyError(error.message);
      } finally {
        setLoadingSocieties(false);
      }
    }

    loadSocieties();
  }, []);

  useEffect(() => {
    let active = true;

    const parseSet = (key) => {
      try {
        return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
      } catch {
        return new Set();
      }
    };

    const loadNotifications = async () => {
      try {
        const response = await listNotificationsForRole("BMC");
        if (!active) return;

        const readSet = parseSet(readKey);
        const dismissedSet = parseSet(dismissedKey);
        const mapped = (response?.data || [])
          .filter((n) => !dismissedSet.has(n._id))
          .map((n) => ({
            id: n._id,
            type: inferNotifType(n.message),
            title: `For ${n.sentToRole}`,
            desc: n.message,
            time: toTimeAgo(n.createdAt),
            read: readSet.has(n._id),
          }));

        setNotifs(mapped);
      } catch {
        if (!active) return;
      }
    };

    loadNotifications();
    const id = setInterval(loadNotifications, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const effectiveVerificationLocked = verificationLocked && !demoUnlock;

  const loadSocietySession = async (soc) => {
    if (!soc) return;

    const today = todayISO();
    const sessionCode = currentSessionCode();
    let existingVerification = null;

    setVerifyChoice(null);
    setSaveError("");
    setSaveSuccess("");
    setVerificationLocked(false);
    setSocietySessionSaved(false);
    setSocietySessionEditing(false);

    try {
      const verificationRes = await listVerifications({
        societyId: soc.societyId,
        date: today,
        session: sessionCode,
      });
      existingVerification = verificationRes?.data?.[0];
      if (existingVerification) {
        setVerificationLocked(true);
        setVerifyChoice(existingVerification.verifyChoice === "YES" ? "yes" : "no");
        if (existingVerification.bmcEntries?.length) {
          setBmcRows(bmcEntriesToRows(existingVerification.bmcEntries));
        }
        setSelectedSoc((prev) => (prev ? { ...prev, status: "verified" } : prev));
      }
    } catch (error) {
      console.error("Error loading verification:", error);
    }

    try {
      const statusRes = await getMilkSessionStatus({
        societyId: soc.societyId,
        date: today,
        session: sessionCode,
      });
      const payload = statusRes?.data || {};
      const milkData = dedupeMilkEntriesByType(payload.entries || []);
      const hasEntries = milkData.length > 0;
      const locked = Boolean(payload.locked);
      setSocietySessionSaved(hasEntries && locked);
      setSocietySessionEditing(hasEntries && !locked);

      const newRows = milkData.map((entry) => ({
        type: entry.milkType,
        milkType: entry.milkType,
        fat: entry.fat,
        snf: entry.snf,
        qty: entry.qty,
        rate: entry.rate,
        amount: entry.amount,
        createdAt: entry.createdAt,
      }));
      setRows(newRows.length > 0 ? newRows : [emptyRow(), emptyRow()]);
      if (!existingVerification) {
        setBmcRows([emptyRow(), emptyRow()]);
      }
    } catch (error) {
      console.error("Error loading milk session:", error);
      setSaveError("Failed to load milk entries: " + error.message);
      setRows([emptyRow(), emptyRow()]);
      setBmcRows([emptyRow(), emptyRow()]);
    }
  };

  const handleSocietyChange = async (e) => {
    const name = e.target.value;
    if (!name) {
      setSelectedSoc(null);
      setVerificationLocked(false);
      setSocietySessionSaved(false);
      setSocietySessionEditing(false);
      return;
    }
    const soc = societies.find((s) => s.name === name);
    setSelectedSoc({ ...soc });
    await loadSocietySession(soc);
  };

  useEffect(() => {
    if (!selectedSoc?.societyId) return;

    const refresh = () => loadSocietySession(selectedSoc);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [selectedSoc, demoUnlock]);

  const handleRowChange = useCallback((idx, field, val) => {
    setRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }, []);

  const handleRowDelete = useCallback((idx) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleAddRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow()]);
  }, []);

  const handleBmcChange = useCallback((idx, field, val) => {
    setBmcRows((prev) => {
      const next = [...prev];

      if (field === "type" && val) {
        const duplicateIndex = next.findIndex((row, rowIndex) => rowIndex !== idx && row.type === val);
        if (duplicateIndex !== -1) {
          next[duplicateIndex] = emptyRow();
        }
      }

      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }, []);

  const handleVerify = (choice) => {
    if (effectiveVerificationLocked) return;
    setVerifyChoice(choice);
    setSaveSuccess("");
    if (choice === "yes") setBmcRows([emptyRow(), emptyRow()]);
  };

  const handleSave = async () => {
    if (effectiveVerificationLocked) {
      setSaveError("Verification already saved for this session.");
      setSaveSuccess("");
      setTimeout(() => setSaveError(""), 4000);
      return;
    }

    const validRows = dedupeRowsByType(
      rows.filter(isRowValid).map((r) => ({
        type: r.type,
        fat: parseFloat(r.fat),
        snf: parseFloat(r.snf),
        qty: parseFloat(r.qty),
      }))
    );

    if (!validRows.length) {
      setSaveError("Please fill in at least one complete row before saving.");
      setSaveSuccess("");
      setTimeout(() => setSaveError(""), 4000);
      return;
    }
    if (!verifyChoice) {
      setSaveError("Please select YES or NO for verification before saving.");
      setSaveSuccess("");
      setTimeout(() => setSaveError(""), 4000);
      return;
    }

    setSaveError("");
    setSaveSuccess("");

    const session = calcSession(validRows);

    let bmcEntries = null;
    if (verifyChoice === "no") {
      const validBmc = bmcRows.filter(isRowValid).map((r) => ({
        type: r.type,
        fat: parseFloat(r.fat),
        snf: parseFloat(r.snf),
        qty: parseFloat(r.qty),
      }));
      const hasDuplicateTypes = new Set(validBmc.map((entry) => entry.type)).size !== validBmc.length;
      if (hasDuplicateTypes) {
        setSaveError("Each BMC row must use a different milk type.");
        setSaveSuccess("");
        setTimeout(() => setSaveError(""), 4000);
        return;
      }
      if (validBmc.length) bmcEntries = validBmc;
    }

    let comparisonStatus = verifyChoice === "yes" ? "? VERIFIED" : "?";
    if (verifyChoice === "no" && bmcEntries) {
      const rep = genReport(selectedSoc.name, validRows, bmcEntries);
      comparisonStatus = rep.status;
    }

    const record = {
      society: selectedSoc.name,
      savedAt: new Date().toLocaleString("en-IN"),
      savedBy: bmcUserName,
      verifyChoice: verifyChoice === "yes" ? "YES ? Values Match" : "NO ? BMC Values Entered",
      entries: session.entries,
      totalQty: session.totalQty,
      totalAmt: session.totalAmtFmt,
      bmcEntries,
      comparisonStatus,
    };

    try {
      const today = todayISO();
      const sessionLabel = currentSessionCode();
      await createVerification({
        societyId: selectedSoc.societyId,
        bmcId: localStorage.getItem("bmc_id") || bmcUserName,
        date: today,
        session: sessionLabel,
        verifyChoice: verifyChoice === "yes" ? "YES" : "NO",
        entries: session.entries.map((e) => ({
          type: e.type,
          fat: e.fat,
          snf: e.snf,
          qty: e.qty,
        })),
        bmcEntries,
        comparisonStatus,
        savedBy: bmcUserName,
      });
    } catch (err) {
      if (/already saved/i.test(err.message || "")) {
        setVerificationLocked(true);
      }
      setSaveError("Failed to save verification: " + err.message);
      setSaveSuccess("");
      setTimeout(() => setSaveError(""), 4000);
      return;
    }

    setVerificationLocked(true);
    if (bmcEntries?.length) {
      setBmcRows(bmcEntriesToRows(bmcEntries));
    }

    setSocieties((prev) =>
      prev.map((s) => (s.name === selectedSoc.name ? { ...s, status: "verified" } : s)),
    );
    setSelectedSoc((prev) => ({ ...prev, status: "verified" }));
    setSaveSuccess(
      verifyChoice === "yes"
        ? `Verification saved for ${selectedSoc.name}. Values match.`
        : `Verification saved for ${selectedSoc.name}. BMC values recorded.`
    );
    setTimeout(() => setSaveSuccess(""), 4000);
    setSaveModal(record);
  };

  const markRead = (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      const existing = new Set(JSON.parse(localStorage.getItem(readKey) || "[]"));
      existing.add(id);
      localStorage.setItem(readKey, JSON.stringify(Array.from(existing)));
    } catch {
      // ignore local storage errors
    }
  };

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const allIds = notifs.map((n) => n.id);
      const existing = new Set(JSON.parse(localStorage.getItem(readKey) || "[]"));
      allIds.forEach((id) => existing.add(id));
      localStorage.setItem(readKey, JSON.stringify(Array.from(existing)));
    } catch {
      // ignore local storage errors
    }
  };

  const dismissNotif = (id) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    try {
      const existing = new Set(JSON.parse(localStorage.getItem(dismissedKey) || "[]"));
      existing.add(id);
      localStorage.setItem(dismissedKey, JSON.stringify(Array.from(existing)));
    } catch {
      // ignore local storage errors
    }
  };

  const clearAll = () => {
    const ids = notifs.map((n) => n.id);
    setNotifs([]);
    try {
      const existing = new Set(JSON.parse(localStorage.getItem(dismissedKey) || "[]"));
      ids.forEach((id) => existing.add(id));
      localStorage.setItem(dismissedKey, JSON.stringify(Array.from(existing)));
    } catch {
      // ignore local storage errors
    }
  };

  const statusClass = selectedSoc?.status === "verified" ? "verified" : "not-verified";
  const statusText = selectedSoc?.status === "verified" ? "Verified" : "Not Verified";

  return (
    <div className="bmc-verify">
      <header className="topbar">
        <div className="topbar-left">
          <span className="page-title">Society Milk Verification</span>
          <span className="date-badge">{dateStr}</span>
        </div>
        <div className="topbar-right">
          <DemoUnlockToggle onChange={setDemoUnlock} />
          <div className="live-time">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {clock}
          </div>
        </div>
      </header>

      <div className="content">
        <div className="controls-bar">
          <label htmlFor="society-select">Society</label>
          <div className="society-dropdown-wrap">
            <select
              id="society-select"
              className="society-dropdown"
              value={selectedSoc?.name || ""}
              onChange={handleSocietyChange}
              disabled={loadingSocieties}
            >
              <option value="">
                {loadingSocieties ? "Loading societies..." : societyError ? `Error: ${societyError}` : societies.length === 0 ? "No societies found" : "- Select Society -"}
              </option>
              {societies.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.societyId} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {selectedSoc && (
            <div className="society-meta">
              <div className="society-qty-badge">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {selectedSoc.qty} L
              </div>
              <span className={`status-pill ${statusClass}`}>
                <span className="status-dot" />
                {statusText}
              </span>
            </div>
          )}
        </div>

        {selectedSoc ? (
          <div className="section-card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-dot" />
                Society Entry - {selectedSoc.name}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1E4B6B]">
                <span className="rounded-full border border-[#CFE0FF] bg-[#EEF4FF] px-3 py-1">
                  Active Session: {currentSessionLabel()}
                </span>
                {societySessionSaved ? (
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-green-800">
                    Society saved current session
                  </span>
                ) : societySessionEditing ? (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
                    Society editing after unlock
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
                    Society has not saved this session yet
                  </span>
                )}
                {effectiveVerificationLocked && (
                  <span className="rounded-full border border-[#1E4B6B] bg-[#1E4B6B] px-3 py-1 text-white">
                    Verification locked
                  </span>
                )}
              </div>
            </div>

              <EntryTable
                rows={rows}
                onChange={handleRowChange}
                onDelete={handleRowDelete}
                onAddRow={handleAddRow}
                readOnly
              />

            <div className="verify-section">
              <div className="verify-label">Do physical values match society entry?</div>
              <div className="verify-options">
                <div
                  className={`verify-option${verifyChoice === "yes" ? " sel-yes" : ""}${effectiveVerificationLocked ? " opacity-60 pointer-events-none" : ""}`}
                  onClick={() => handleVerify("yes")}
                >
                  <div className="radio-circle">{verifyChoice === "yes" && <div className="radio-filled" />}</div>
                  YES - Values Match
                </div>
                <div
                  className={`verify-option${verifyChoice === "no" ? " sel-no" : ""}${effectiveVerificationLocked ? " opacity-60 pointer-events-none" : ""}`}
                  onClick={() => handleVerify("no")}
                >
                  <div className="radio-circle">{verifyChoice === "no" && <div className="radio-filled" />}</div>
                  NO - Enter BMC Values
                </div>
              </div>
            </div>

            {verifyChoice === "no" && (
              <BMCPanel
                bmcRows={bmcRows}
                onChange={handleBmcChange}
                societyRows={rows}
                societyName={selectedSoc.name}
                readOnly={effectiveVerificationLocked}
              />
            )}

            <div className="save-row">
              {saveError && <span className="save-error">{saveError}</span>}
              {saveSuccess && <span className="save-success">{saveSuccess}</span>}
              {!effectiveVerificationLocked && (
                <button className="save-btn" onClick={handleSave}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  Save Verification
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <svg
              width="48"
              height="48"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.2"
              style={{ opacity: 0.35 }}
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Select a society to begin</div>
            <div style={{ fontSize: 13 }}>Choose a society from the dropdown above</div>
          </div>
        )}
      </div>

      {saveModal && <SaveModal record={saveModal} onClose={() => setSaveModal(null)} />}
    </div>
  );
}











