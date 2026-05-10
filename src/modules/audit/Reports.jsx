import React, { useState, useEffect } from "react";
import { fetchSocieties, getSocietyDashboard, getBmcDashboard, listUsers } from "../../utils/api";

// Entity lists for each role
const SOCIETIES = [
  { id: "s1", name: "SOCIETY_001", label: "SOCIETY_001" },
  { id: "s2", name: "SOCIETY_002", label: "SOCIETY_002" },
  { id: "s3", name: "SOCIETY_003", label: "SOCIETY_003" },
];

const BMCS = [
  { id: "b1", name: "BMC_001", label: "BMC_001" },
  { id: "b2", name: "BMC_002", label: "BMC_002" },
  { id: "b3", name: "BMC_003", label: "BMC_003" },
];

const ADMINS = [
  { id: "a1", name: "admin001", label: "Admin - Super Admin" },
  { id: "a2", name: "admin002", label: "Admin - Regional" },
];

const DIARIES = [
  { id: "d1", name: "Dairy Main", label: "Main Dairy" },
  { id: "d2", name: "Dairy Branch", label: "Branch Dairy" },
];

const MOCK_DATA = [
  { id: "SOCIETY_001", role: "Society", name: "SOCIETY_001", contact: "9876543210", extra: "District: Raichur" },
  { id: "SOCIETY_002", role: "Society", name: "SOCIETY_002", contact: "9876543209", extra: "District: Hubli" },
  { id: "BMC_001", role: "BMC", name: "BMC_001", contact: "9123456780", extra: "Location: Depot A" },
  { id: "BMC_002", role: "BMC", name: "BMC_002", contact: "9123456781", extra: "Location: Depot B" },
  { id: "admin001", role: "Admin", name: "admin001", contact: "9000000000", extra: "Super admin" },
  { id: "DIARY_001", role: "Diary", name: "Daily Entry 1", contact: "2024-01-15", extra: "Morning collection report" },
  { id: "DIARY_002", role: "Diary", name: "Daily Entry 2", contact: "2024-01-16", extra: "Evening dispatch summary" },
];

// SOCIETY Mock Data - for each society
const SOCIETY_MOCK_DATA = {
  "SOCIETY_001": {
    summary: {
      totalMilk: 2450,
      totalFarmers: 145,
      verified: 92,
      type: { cow: 1200, buffalo: 1250 },
      session: { morning: 1100, evening: 1350 },
      points: 8,
      rejected: 3,
    },
  },
  "SOCIETY_002": {
    summary: {
      totalMilk: 3120,
      totalFarmers: 178,
      verified: 95,
      type: { cow: 1650, buffalo: 1470 },
      session: { morning: 1450, evening: 1670 },
      points: 12,
      rejected: 2,
    },
  },
  "SOCIETY_003": {
    summary: {
      totalMilk: 1880,
      totalFarmers: 112,
      verified: 88,
      type: { cow: 920, buffalo: 960 },
      session: { morning: 850, evening: 1030 },
      points: 6,
      rejected: 5,
    },
  },
};

// BMC Mock Data - for each BMC
const BMC_MOCK_DATA = {
  "BMC_001": {
    summary: {
      totalMilk: 5400,
      totalVerified: 5200,
      acceptanceRate: 96.3,
      type: { cow: 2700, buffalo: 2700 },
      storageUsed: 78,
      rejected: 200,
      societiesCount: 5,
    },
    dispatchStats: { totalDispatches: 18 },
  },
  "BMC_002": {
    summary: {
      totalMilk: 6200,
      totalVerified: 5950,
      acceptanceRate: 95.97,
      type: { cow: 3100, buffalo: 3100 },
      storageUsed: 82,
      rejected: 250,
      societiesCount: 7,
    },
    dispatchStats: { totalDispatches: 22 },
  },
  "BMC_003": {
    summary: {
      totalMilk: 4100,
      totalVerified: 3980,
      acceptanceRate: 97.07,
      type: { cow: 2050, buffalo: 2050 },
      storageUsed: 65,
      rejected: 120,
      societiesCount: 4,
    },
    dispatchStats: { totalDispatches: 14 },
  },
};

// ADMIN Mock Data
const ADMIN_MOCK_DATA = {
  "Admin - Super Admin": {
    dcsCount: 884,
    bmcCount: 70,
    dairyUnitsCount: 3,
    cowMilk: 81.48,
    buffaloMilk: 18.51,
    billedPercent: 92,
    unbilledPercent: 8,
  },
  "Admin - Regional": {
    dcsCount: 412,
    bmcCount: 35,
    dairyUnitsCount: 1,
    cowMilk: 80.5,
    buffaloMilk: 19.5,
    billedPercent: 89,
    unbilledPercent: 11,
  },
};

// DIARY Mock Data - for each dairy
const DIARY_MOCK_DATA = {
  "Main Dairy": {
    totalEntries: 156,
    completedRecords: 148,
    pendingRecords: 8,
    transactions: 312,
    completionRate: 94.87,
    lastUpdated: "14:32:00",
    avgTime: 5.2,
    errorRecords: 3,
    verifiedBy: "Admin - Super Admin",
  },
  "Branch Dairy": {
    totalEntries: 98,
    completedRecords: 92,
    pendingRecords: 6,
    transactions: 184,
    completionRate: 93.87,
    lastUpdated: "13:15:00",
    avgTime: 4.8,
    errorRecords: 2,
    verifiedBy: "Admin - Regional",
  },
};

export default function AuditReports() {
  const [roleFilter, setRoleFilter] = useState("Society");
  const [selectedEntity, setSelectedEntity] = useState("s1"); // Default to first society
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]); // Today's date
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);

  const handleSearch = async () => {
    setSearchTriggered(true);
    setSummary(null);
    setSummaryError("");
    setLoadingSummary(true);

    try {
      if (roleFilter === "Society") {
        const society = SOCIETIES.find(s => s.id === selectedEntity);
        if (!society) throw new Error("No society selected");
        const mockData = SOCIETY_MOCK_DATA[society.label];
        setSummary({ role: "Society", label: society.label, date: selectedDate, data: mockData });
      } else if (roleFilter === "BMC") {
        const bmc = BMCS.find(b => b.id === selectedEntity);
        if (!bmc) throw new Error("No BMC selected");
        const mockData = BMC_MOCK_DATA[bmc.label];
        setSummary({ role: "BMC", label: bmc.label, date: selectedDate, data: mockData });
      } else if (roleFilter === "Admin") {
        const admin = ADMINS.find(a => a.id === selectedEntity);
        if (!admin) throw new Error("No admin selected");
        const mockData = ADMIN_MOCK_DATA[admin.label];
        setSummary({ role: "Admin", label: admin.label, date: selectedDate, data: mockData });
      } else if (roleFilter === "Diary") {
        const diary = DIARIES.find(d => d.id === selectedEntity);
        if (!diary) throw new Error("No diary selected");
        const mockData = DIARY_MOCK_DATA[diary.label];
        setSummary({ role: "Diary", label: diary.label, date: selectedDate, data: mockData });
      }
    } catch (err) {
      setSummaryError(err.message || String(err));
    } finally {
      setLoadingSummary(false);
    }
  };

  // Get the list of entities based on role
  const getEntityList = () => {
    switch (roleFilter) {
      case "Society":
        return SOCIETIES;
      case "BMC":
        return BMCS;
      case "Admin":
        return ADMINS;
      case "Diary":
        return DIARIES;
      default:
        return [];
    }
  };

  // Update selected entity when role changes
  useEffect(() => {
    const entities = getEntityList();
    if (entities.length > 0) {
      setSelectedEntity(entities[0].id);
    }
  }, [roleFilter]);

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

      <div className="flex gap-4 mb-6">
        <select
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
          className="rounded border px-3 py-2 bg-white text-sm flex-1"
          aria-label="Select entity"
        >
          {getEntityList().map((entity) => (
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
          className="bg-[#1E4B6B] text-white px-6 py-2 rounded hover:bg-[#153a52] transition-colors text-sm font-medium"
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
                      <p className="text-xs text-slate-600 mt-2">Processed</p>
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
