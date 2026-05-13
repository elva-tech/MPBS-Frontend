import { useEffect, useMemo, useState } from "react";
import { Landmark, Search } from "lucide-react";
import { calculateSocietyBilling, hydrateAccountSocieties, loadAccountState, lockCycle, runBillingForCycle, setSelections } from "./engine";
import { getMilkEntries } from "../../utils/api";

export default function SocietyPayments() {
  const [state, setState] = useState(() => loadAccountState());
  const [message, setMessage] = useState("");
  const [societySearch, setSocietySearch] = useState("");
  const [milkLines, setMilkLines] = useState([
    { label: "Cow Milk", qty: 0, rate: 0, amount: 0 },
    { label: "Buffalo Milk", qty: 0, rate: 0, amount: 0 },
  ]);

  const selectedCycleId = state.selectedCycleId || state.cycles[0]?.id;
  const selectedSocietyId = state.selectedSocietyId || state.societies[0]?.id;

  const selectedCycle = state.cycles.find((item) => item.id === selectedCycleId) || state.cycles[0];
  const selectedSociety = state.societies.find((item) => item.id === selectedSocietyId) || state.societies[0];

  useEffect(() => {
    let active = true;
    hydrateAccountSocieties().then((next) => {
      if (active) setState(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const billing = useMemo(
    () => calculateSocietyBilling(state, selectedCycleId, selectedSocietyId),
    [state, selectedCycleId, selectedSocietyId]
  );

  const milkSummary = useMemo(() => {
    const rows = state.milkData.filter((item) => item.cycleId === selectedCycleId && item.societyId === selectedSocietyId);
    return rows.reduce(
      (summary, row) => {
        summary.cowQty += Number(row?.cowQty || 0);
        summary.buffaloQty += Number(row?.buffaloQty || 0);
        return summary;
      },
      { cowQty: 0, buffaloQty: 0 }
    );
  }, [state.milkData, selectedCycleId, selectedSocietyId]);

  const filteredSocieties = useMemo(() => {
    const query = societySearch.trim().toLowerCase();
    if (!query) return state.societies;
    return state.societies.filter((society) => {
      const label = `${society.id} ${society.name}`.toLowerCase();
      return label.includes(query);
    });
  }, [state.societies, societySearch]);

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
  const formatLitres = (value) => `${Number(value || 0).toLocaleString("en-IN")} L`;
  const formatRate = (value) => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatCycleLabel = (cycle = {}) => {
    const start = cycle.start || cycle.startDate;
    const end = cycle.end || cycle.endDate;
    if (!start || !end) return cycle.id || "-";
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return cycle.id || "-";
    const startText = startDate.toLocaleDateString("en-IN", { day: "numeric" });
    const endText = endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return `${startText}-${endText}`;
  };

  useEffect(() => {
    let active = true;

    async function loadMilkBreakdown() {
      const cycle = selectedCycle || state.cycles.find((item) => item.id === selectedCycleId);
      const societyId = selectedSocietyId;

      if (!cycle?.start && !cycle?.startDate) {
        setMilkLines([
          { label: "Cow Milk", qty: 0, rate: 0, amount: 0 },
          { label: "Buffalo Milk", qty: 0, rate: 0, amount: 0 },
        ]);
        return;
      }

      try {
        const response = await getMilkEntries({
          societyId,
          from: cycle.start || cycle.startDate,
          to: cycle.end || cycle.endDate,
        });
        if (!active) return;

        const entries = Array.isArray(response?.data?.milkEntries) ? response.data.milkEntries : [];
        const cowQty = entries.filter((entry) => entry.milkType === "Cow").reduce((sum, entry) => sum + Number(entry.qty || 0), 0);
        const buffaloQty = entries.filter((entry) => entry.milkType === "Buffalo").reduce((sum, entry) => sum + Number(entry.qty || 0), 0);
        const cowAmount = entries.filter((entry) => entry.milkType === "Cow").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
        const buffaloAmount = entries.filter((entry) => entry.milkType === "Buffalo").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

        const milkDataRows = entries.map((entry) => {
          const qty = Number(entry.qty || 0);
          const amount = Number(entry.amount || 0);
          const fat = Number(entry.fat || entry.avgFat || 0);
          const milkType = String(entry.milkType || "").toLowerCase();

          return {
            cycleId: selectedCycleId,
            societyId,
            qty,
            milkAmount: amount,
            avgFat: fat,
            cowQty: milkType === "cow" ? qty : 0,
            buffaloQty: milkType === "buffalo" ? qty : 0,
          };
        });

        setState((current) => ({
          ...current,
          milkData: [
            ...(current.milkData || []).filter(
              (row) => row.cycleId !== selectedCycleId || row.societyId !== societyId
            ),
            ...milkDataRows,
          ],
        }));

        setMilkLines([
          { label: "Cow Milk", qty: cowQty, rate: cowQty ? cowAmount / cowQty : 0, amount: cowAmount },
          { label: "Buffalo Milk", qty: buffaloQty, rate: buffaloQty ? buffaloAmount / buffaloQty : 0, amount: buffaloAmount },
        ]);
      } catch {
        if (!active) return;
        setMilkLines([
          { label: "Cow Milk", qty: 0, rate: 0, amount: 0 },
          { label: "Buffalo Milk", qty: 0, rate: 0, amount: 0 },
        ]);
      }
    }

    loadMilkBreakdown();
    return () => {
      active = false;
    };
  }, [selectedCycleId, selectedSocietyId, selectedCycle, state.cycles]);

  const handleCycleChange = (e) => {
    const cycleId = e.target.value;
    const next = setSelections({ cycleId });
    setState(next);
  };

  const handleSocietyChange = (e) => {
    const societyId = e.target.value;
    const next = setSelections({ societyId });
    setState(next);
  };

  const handleRecalculate = () => {
    const res = runBillingForCycle(selectedCycleId);
    setState(res.state || loadAccountState());
    setMessage(res.message);
  };

  const handleLockProceed = () => {
    const res = lockCycle(selectedCycleId);
    setState(res.state || loadAccountState());
    setMessage(res.message);
  };

  const isLocked = selectedCycle?.status === "LOCKED" || selectedCycle?.status === "PAID";

  return (
    <div className="p-6 text-[#1F2A44]">
      <section className="max-w-[980px] overflow-hidden rounded-lg border border-[#DCE4F2] bg-white shadow-[0_8px_24px_rgba(31,42,68,0.08)]">
        <header className="flex flex-col gap-3 border-b border-[#E3E9F4] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Landmark className="h-7 w-7 text-[#1F2A44]" aria-hidden="true" />
            <h1 className="text-xl font-bold text-[#1F2A44]">Society Payment Calculation</h1>
          </div>

          <label className="flex h-11 w-full items-center gap-2 rounded-md border border-[#DDE5F0] bg-white px-3 text-[#718096] shadow-[0_1px_4px_rgba(31,42,68,0.08)] sm:max-w-[300px]">
            <Search className="h-5 w-5" aria-hidden="true" />
            <input
              type="search"
              value={societySearch}
              onChange={(e) => setSocietySearch(e.target.value)}
              placeholder="Search Society..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#1F2A44] placeholder:text-[#718096]"
            />
          </label>
        </header>

        {message ? <p className="mx-5 mt-4 rounded-md bg-[#EEF4FF] px-3 py-2 text-sm font-semibold text-[#1E4B6B]">{message}</p> : null}

        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%]">
          <aside className="border-b border-[#E3E9F4] bg-[#F8FAFD] p-5 lg:border-b-0 lg:border-r">
            <label className="text-sm font-bold text-[#39465F]">Society</label>
            <select
              value={selectedSocietyId}
              onChange={handleSocietyChange}
              className="mt-2 h-12 w-full rounded-md border border-[#D5DEEB] bg-white px-3 text-sm font-semibold text-[#1F2A44] shadow-[0_1px_3px_rgba(31,42,68,0.06)]"
            >
              {(filteredSocieties.length ? filteredSocieties : state.societies).map((society) => (
                <option key={society.id} value={society.id}>
                  {society.id} - {society.name}
                </option>
              ))}
            </select>

            <label className="mt-5 block text-sm font-bold text-[#39465F]">Cycle</label>
            <select
              value={selectedCycleId}
              onChange={handleCycleChange}
              className="mt-2 h-12 w-full rounded-md border border-[#D5DEEB] bg-white px-3 text-sm font-semibold text-[#1F2A44] shadow-[0_1px_3px_rgba(31,42,68,0.06)]"
            >
              {state.cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {formatCycleLabel(cycle)}
                </option>
              ))}
            </select>

            <p className="mt-5 text-xs font-semibold text-[#6B778C]">
              Status: {selectedCycle?.status || "OPEN"} | Society: {selectedSociety?.name || "-"}
            </p>
          </aside>

          <div className="bg-white p-4">
            <div className="overflow-hidden rounded-md border border-[#D5DEEB] text-sm">
              {milkLines.map((line) => (
                <div key={line.label} className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1fr] items-center border-b border-[#E3E9F4] bg-[#FAFCFF]">
                  <div className="px-3 py-3 font-bold text-[#1F2A44]">{line.label}</div>
                  <div className="px-3 py-3 text-right font-bold text-[#36435A]">{formatLitres(line.qty)}</div>
                  <div className="px-3 py-3 text-right font-bold text-[#36435A]">{formatRate(line.rate)}</div>
                  <div className="px-3 py-3 text-right font-bold text-[#1F2A44]">{formatCurrency(line.amount)}</div>
                </div>
              ))}

              <div className="flex items-center justify-between border-b border-[#E3E9F4] bg-[#F0F5FC] px-3 py-3 text-base font-extrabold">
                <span>Milk Amount</span>
                <span>{formatCurrency(billing.milkAmount)}</span>
              </div>

              <div className="flex items-center justify-between border-b border-[#E3E9F4] px-3 py-2.5 font-semibold">
                <span>+ Claims</span>
                <span>{formatCurrency(billing.totalClaims)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#E3E9F4] px-3 py-2.5 font-semibold">
                <span>- Recoverables</span>
                <span>{formatCurrency(billing.totalRecoverables)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#E3E9F4] px-3 py-2.5 font-semibold">
                <span>- Scheme Deductions</span>
                <span>{formatCurrency(billing.totalSchemeDeductions)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#E3E9F4] px-3 py-2.5 font-semibold">
                <span>+ Scheme Benefits</span>
                <span>{formatCurrency(billing.totalSchemeBenefits)}</span>
              </div>

              <div className="flex items-center justify-between bg-[#E8F0FA] px-3 py-3 text-lg font-extrabold text-[#1F2A44]">
                <span>Net Payable</span>
                <span>{formatCurrency(billing.netPayable)}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={handleRecalculate}
                className="h-12 rounded-md bg-[#2078D4] px-4 text-sm font-bold text-white shadow-[0_2px_6px_rgba(32,120,212,0.22)] transition hover:bg-[#1A67B8]"
              >
                Recalculate
              </button>
              <button
                onClick={handleLockProceed}
                disabled={isLocked}
                className="h-12 rounded-md bg-[#25A772] px-4 text-sm font-bold text-white shadow-[0_2px_6px_rgba(37,167,114,0.22)] transition hover:bg-[#1E9162] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLocked ? "Locked" : "Lock & Proceed"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
