import React, { useState, useEffect } from "react";
import {
  fetchSocieties,
  getSocietyDashboard,
  getBmcDashboard,
  getAdminDashboard,
  getDairyDashboard,
  listVerifications,
} from "../../utils/api";

const ADMIN_ENTITIES = [{ id: "system", label: "System Overview" }];

function round2(n) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? Number(v.toFixed(2)) : 0;
}

export default function AuditReports() {
  const [roleFilter, setRoleFilter] = useState("Society");
  const [societies, setSocieties] = useState([]);
  const [bmcs, setBmcs] = useState([]);
  const [dairyUnits, setDairyUnits] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [entityError, setEntityError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadEntities() {
      setLoadingEntities(true);
      setEntityError("");
      try {
        const response = await fetchSocieties();
        if (!active) return;
        const list = response?.data || [];

        const societyOptions = list.map((s) => ({
          id: s.societyId,
          label: `${s.societyId} - ${s.societyName}`,
          societyId: s.societyId,
        }));
        setSocieties(societyOptions);

        const bmcMap = new Map();
        list.forEach((s) => {
          if (s.bmcId && !bmcMap.has(s.bmcId)) {
            bmcMap.set(s.bmcId, { id: s.bmcId, label: s.bmcId, bmcId: s.bmcId });
          }
        });
        setBmcs(Array.from(bmcMap.values()));

        const routeMap = new Map();
        list.forEach((s) => {
          const route = String(s.route || "").trim();
          if (route && !routeMap.has(route)) {
            routeMap.set(route, { id: route, label: route, dairyUnit: route });
          }
        });
        setDairyUnits(Array.from(routeMap.values()));
      } catch (err) {
        if (!active) return;
        setEntityError(err.message || "Failed to load entities from database.");
      } finally {
        if (active) setLoadingEntities(false);
      }
    }

    loadEntities();
    return () => {
      active = false;
    };
  }, []);

  const getEntityList = () => {
    switch (roleFilter) {
      case "Society":
        return societies;
      case "BMC":
        return bmcs;
      case "Admin":
        return ADMIN_ENTITIES;
      case "Diary":
        return dairyUnits;
      default:
        return [];
    }
  };

  useEffect(() => {
    const entities = getEntityList();
    if (entities.length > 0) {
      setSelectedEntity(entities[0].id);
    } else {
      setSelectedEntity("");
    }
  }, [roleFilter, societies, bmcs, dairyUnits]);

  const handleSearch = async () => {
    setSearchTriggered(true);
    setSummary(null);
    setSummaryError("");
    setLoadingSummary(true);

    try {
      if (roleFilter === "Society") {
        const society = societies.find((s) => s.id === selectedEntity);
        if (!society) throw new Error("No society selected");

        const dash = await getSocietyDashboard({
          societyId: society.societyId,
          from: selectedDate,
          to: selectedDate,
        });
        const verifications = await listVerifications({
          societyId: society.societyId,
          date: selectedDate,
        });
        const verifiedSessions = verifications?.data?.length || 0;
        const mismatchCount =
          (verifications?.data || []).filter((v) =>
            String(v.comparisonStatus || "").toUpperCase().includes("MISMATCH")
          ).length;

        setSummary({
          role: "Society",
          label: society.label,
          date: selectedDate,
          data: {
            summary: {
              totalMilk: dash?.data?.summary?.totalMilk ?? 0,
              totalFarmers: dash?.data?.summary?.totalFarmers ?? 0,
              verified: verifiedSessions > 0 ? 100 : 0,
              type: dash?.data?.summary?.type ?? { cow: 0, buffalo: 0 },
              session: dash?.data?.summary?.session ?? { morning: 0, evening: 0 },
              points: verifiedSessions,
              rejected: mismatchCount,
            },
          },
        });
      } else if (roleFilter === "BMC") {
        const bmc = bmcs.find((b) => b.id === selectedEntity);
        if (!bmc) throw new Error("No BMC selected");

        const dash = await getBmcDashboard({ bmcId: bmc.bmcId, date: selectedDate });
        const s = dash?.data?.summary || {};
        const totalMilk = Number(s.totalMilk || 0);
        const totalVerified = Number(s.totalVerified || 0);

        setSummary({
          role: "BMC",
          label: bmc.label,
          date: selectedDate,
          data: {
            summary: {
              totalMilk,
              totalVerified,
              acceptanceRate: totalMilk > 0 ? round2((totalVerified / totalMilk) * 100) : 0,
              type: s.type ?? { cow: 0, buffalo: 0 },
            },
            dispatchStats: dash?.data?.dispatchStats ?? { totalDispatches: 0 },
          },
        });
      } else if (roleFilter === "Admin") {
        const dash = await getAdminDashboard();
        const topStats = dash?.data?.topStats || [];
        const findStat = (needle) =>
          topStats.find((row) => String(row.label || "").toLowerCase().includes(needle))?.value ?? 0;
        const milkProcured = dash?.data?.milkProcured || [];
        const finance = dash?.data?.finance || [];

        setSummary({
          role: "Admin",
          label: "System Overview",
          date: selectedDate,
          data: {
            dcsCount: findStat("dcs"),
            bmcCount: findStat("bmc"),
            dairyUnitsCount: findStat("dairy"),
            cowMilk: milkProcured.find((m) => /cow/i.test(m.name))?.value ?? 0,
            buffaloMilk: milkProcured.find((m) => /buffalo/i.test(m.name))?.value ?? 0,
            billedPercent: finance.find((f) => f.name === "Billed")?.value ?? 0,
            unbilledPercent: finance.find((f) => f.name === "Unbilled")?.value ?? 0,
          },
        });
      } else if (roleFilter === "Diary") {
        const diary = dairyUnits.find((d) => d.id === selectedEntity);
        if (!diary) throw new Error("No dairy unit selected");

        const dash = await getDairyDashboard({ date: selectedDate, dairyUnit: diary.dairyUnit });
        const cards = dash?.data?.cards || {};
        const tankers = Number(cards.tankerCount || 0);
        const pending = Number(cards.pendingVerification || 0);
        const completed = Math.max(tankers - pending, 0);

        setSummary({
          role: "Diary",
          label: diary.label,
          date: selectedDate,
          data: {
            totalEntries: tankers,
            completedRecords: completed,
            pendingRecords: pending,
            transactions: round2(cards.milkReceived || 0),
            completionRate: tankers > 0 ? round2((completed / tankers) * 100) : 0,
            lastUpdated: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            avgTime: 0,
            errorRecords: Number(cards.totalShortage || 0) > 0 ? 1 : 0,
            verifiedBy: "Dairy Operations",
          },
        });
      }
    } catch (err) {
      setSummaryError(err.message || String(err));
    } finally {
      setLoadingSummary(false);
    }
  };

  const entityList = getEntityList();

  return (
    <div className="p-6 bg-blue-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Audit Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Select entity and date to view audit data.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded border px-3 py-2 bg-white text-sm"
            aria-label="Filter by role"
          >
            <option value="Society">Society</option>
            <option value="BMC">BMC</option>
            <option value="Admin">Admin</option>
            <option value="Diary">Diary</option>
          </select>
        </div>
      </div>

      {entityError ? <div className="mb-4 text-sm text-red-600">{entityError}</div> : null}

      <div className="flex gap-4 mb-6">
        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="rounded border px-3 py-2 bg-white text-sm flex-1"
          aria-label="Select entity"
          disabled={loadingEntities || entityList.length === 0}
        >
          {loadingEntities ? <option value="">Loading entities...</option> : null}
          {!loadingEntities && entityList.length === 0 ? <option value="">No entities found</option> : null}
          {entityList.map((entity) => (
            <option key={entity.id} value={entity.id}>
              {entity.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded border px-3 py-2 bg-white text-sm flex-1"
          aria-label="Select date"
        />
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={handleSearch}
          disabled={loadingEntities || !selectedEntity}
          className="bg-[#1E4B6B] text-white px-6 py-2 rounded hover:bg-[#153a52] transition-colors text-sm font-medium disabled:opacity-50"
          aria-label="Search audit reports"
        >
          Search
        </button>
      </div>

      {/* Summary cards fetched from dashboard endpoints */}
      {searchTriggered && (
        <div className="mb-6">
          {loadingSummary ? (
            <div className="text-sm text-slate-500">Loading audit data for {selectedDate}...</div>
          ) : summaryError ? (
            <div className="text-sm text-red-600">{summaryError}</div>
          ) : summary ? (
            <>
              {/* SOCIETY AUDIT DATA */}
              {summary.role === "Society" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Society Audit Report - {summary.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">ENTITY</p>
                      <p className="font-semibold text-slate-800">{summary.label}</p>
                      <p className="text-xs text-slate-600 mt-2">Date: {summary.date}</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL MILK COLLECTED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.totalMilk ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Liters</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL FARMERS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.totalFarmers ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Active Farmers</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">VERIFICATION STATUS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.verified ?? "0"}%</p>
                      <p className="text-xs text-slate-600 mt-2">Verified</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">COW MILK</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.type?.cow ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">% of Total</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">BUFFALO MILK</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.type?.buffalo ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">% of Total</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">COLLECTION POINTS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.points ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Verified Sessions</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">REJECTED / MISMATCH</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.rejected ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Records</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">MORNING COLLECTION</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.session?.morning ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Session</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">EVENING COLLECTION</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.session?.evening ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Session</p>
                    </div>
                  </div>
                </div>
              )}

              {/* BMC AUDIT DATA */}
              {summary.role === "BMC" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">BMC Audit Report - {summary.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">ENTITY</p>
                      <p className="font-semibold text-slate-800">{summary.label}</p>
                      <p className="text-xs text-slate-600 mt-2">Date: {summary.date}</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL MILK RECEIVED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.totalMilk ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">From Societies</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL VERIFIED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.totalVerified ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Quality Approved</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">ACCEPTANCE RATE</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.acceptanceRate ?? "0"}%</p>
                      <p className="text-xs text-slate-600 mt-2">Passed QC</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">COW MILK RECEIVED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.type?.cow ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Type A</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">BUFFALO MILK RECEIVED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.summary?.type?.buffalo ?? "0"} L</p>
                      <p className="text-xs text-slate-600 mt-2">Type B</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL DISPATCHES</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.dispatchStats?.totalDispatches ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Batches</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN AUDIT DATA */}
              {summary.role === "Admin" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Audit Report - {summary.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">ENTITY</p>
                      <p className="font-semibold text-slate-800">{summary.label}</p>
                      <p className="text-xs text-slate-600 mt-2">Date: {summary.date}</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">NO. OF DCS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.dcsCount ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Societies</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">NO. OF BMC</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.bmcCount ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Operational</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">NO. OF DAIRY UNITS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.dairyUnitsCount ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Active</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">COW MILK PROCURED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.cowMilk ?? "0"}%</p>
                      <p className="text-xs text-slate-600 mt-2">% of Total</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">BUFFALO MILK PROCURED</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.buffaloMilk ?? "0"}%</p>
                      <p className="text-xs text-slate-600 mt-2">% of Total</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">BILLED AMOUNT</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.billedPercent ?? "0"}%</p>
                      <p className="text-xs text-slate-600 mt-2">Finance Status</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">UNBILLED AMOUNT</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.unbilledPercent ?? "0"}%</p>
                      <p className="text-xs text-slate-600 mt-2">Finance Status</p>
                    </div>
                  </div>
                </div>
              )}

              {/* DIARY AUDIT DATA */}
              {summary.role === "Diary" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Diary Audit Report - {summary.label}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">ENTITY</p>
                      <p className="font-semibold text-slate-800">{summary.label}</p>
                      <p className="text-xs text-slate-600 mt-2">Date: {summary.date}</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL ENTRIES</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.totalEntries ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Records</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">COMPLETED RECORDS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.completedRecords ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Status</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">PENDING RECORDS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.pendingRecords ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">In Process</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">TOTAL TRANSACTIONS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.transactions ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Milk Received (L)</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">COMPLETION RATE</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.completionRate ?? "0"}%</p>
                      <p className="text-xs text-slate-600 mt-2">Today</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">LAST UPDATED</p>
                      <p className="font-semibold text-sm text-slate-800">{summary.data?.lastUpdated ?? "—"}</p>
                      <p className="text-xs text-slate-600 mt-2">Time</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">AVERAGE TIME/ENTRY</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.avgTime ?? "0"} min</p>
                      <p className="text-xs text-slate-600 mt-2">Minutes</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">ERROR RECORDS</p>
                      <p className="font-semibold text-lg text-slate-800">{summary.data?.errorRecords ?? "0"}</p>
                      <p className="text-xs text-slate-600 mt-2">Needs Review</p>
                    </div>
                    <div className="bg-white rounded px-4 py-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs text-slate-500 font-medium mb-2">VERIFIED BY</p>
                      <p className="font-semibold text-sm text-slate-800">{summary.data?.verifiedBy ?? "—"}</p>
                      <p className="text-xs text-slate-600 mt-2">Authority</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
