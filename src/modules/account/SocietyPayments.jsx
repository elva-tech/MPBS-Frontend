import { useMemo, useState } from "react";
import { calculateSocietyBilling, loadAccountState, lockCycle, runBillingForCycle, setSelections } from "./engine";

export default function SocietyPayments() {
  const [state, setState] = useState(() => loadAccountState());
  const [message, setMessage] = useState("");

  const selectedCycleId = state.selectedCycleId || state.cycles[0]?.id;
  const selectedSocietyId = state.selectedSocietyId || state.societies[0]?.id;

  const selectedCycle = state.cycles.find((item) => item.id === selectedCycleId) || state.cycles[0];
  const selectedSociety = state.societies.find((item) => item.id === selectedSocietyId) || state.societies[0];

  const billing = useMemo(
    () => calculateSocietyBilling(state, selectedCycleId, selectedSocietyId),
    [state, selectedCycleId, selectedSocietyId]
  );

  const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

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
      <div className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <h1 className="text-2xl font-semibold text-[#1E4B6B]">Society Payments</h1>
        {message ? <p className="mt-3 rounded-lg bg-[#EEF4FF] px-3 py-2 text-sm text-[#1E4B6B]">{message}</p> : null}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] p-4">
            <label className="text-sm font-semibold text-[#5B6B7F]">Society</label>
            <select
              value={selectedSocietyId}
              onChange={handleSocietyChange}
              className="mt-1 w-full rounded-lg border border-[#D7E4FF] bg-white px-3 py-2 text-sm"
            >
              {state.societies.map((society) => (
                <option key={society.id} value={society.id}>
                  {society.id} - {society.name}
                </option>
              ))}
            </select>

            <label className="mt-3 block text-sm font-semibold text-[#5B6B7F]">Cycle</label>
            <select
              value={selectedCycleId}
              onChange={handleCycleChange}
              className="mt-1 w-full rounded-lg border border-[#D7E4FF] bg-white px-3 py-2 text-sm"
            >
              {state.cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.id}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] p-4 text-sm">
            <div className="flex justify-between py-1"><span>Milk Amount</span><span className="font-semibold">{formatCurrency(billing.milkAmount)}</span></div>
            <div className="flex justify-between py-1"><span>+ Claims</span><span>{formatCurrency(billing.totalClaims)}</span></div>
            <div className="flex justify-between py-1"><span>+ Scheme Benefits</span><span>{formatCurrency(billing.totalSchemeBenefits)}</span></div>
            <div className="flex justify-between py-1"><span>- Recoverables</span><span>{formatCurrency(billing.totalRecoverables)}</span></div>
            <div className="flex justify-between py-1"><span>- Scheme Deductions</span><span>{formatCurrency(billing.totalSchemeDeductions)}</span></div>
            <div className="flex justify-between py-1"><span>- Transport Penalty</span><span>{formatCurrency(billing.transportPenalty)}</span></div>
            <div className="mt-2 border-t border-[#D7E4FF] pt-2 text-base font-semibold text-[#1E4B6B]">
              <div className="flex justify-between"><span>Net Payable</span><span>{formatCurrency(billing.netPayable)}</span></div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={handleRecalculate} className="rounded-lg bg-[#1E73BE] px-4 py-2 text-sm font-semibold text-white">Recalculate</button>
          <button
            onClick={handleLockProceed}
            disabled={isLocked}
            className="rounded-lg bg-[#25A772] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLocked ? "Locked" : "Lock & Proceed"}
          </button>
        </div>

        <p className="mt-2 text-sm text-[#5B6B7F]">
          Status: {selectedCycle?.status || "OPEN"} | Society: {selectedSociety?.name || "-"}
        </p>
      </div>
    </div>
  );
}
