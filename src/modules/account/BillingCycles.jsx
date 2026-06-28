import { useEffect, useMemo, useState } from "react";
import { getBillingCycleDateStatus } from "./engine";
import { createCycle, fetchAccountState, lockCycleBilling, runCycleBilling, setAccountSelections } from "./accountService";

function statusBadge(status) {
  if (status === "PAID") return "bg-[#E6F5EE] text-[#1D7F50]";
  if (status === "LOCKED") return "bg-[#EAF1FF] text-[#1E4B6B]";
  if (status === "CALCULATED") return "bg-[#E8F1FF] text-[#1E4B6B]";
  return "bg-[#FFF5DD] text-[#8A6A1F]";
}

function actionLabel(status) {
  if (status === "OPEN") return "Run";
  if (status === "CALCULATED") return "Lock";
  if (status === "LOCKED" || status === "PAID") return "View";
  return "View";
}

function formatDateLabel(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BillingCycles() {
  const [state, setState] = useState({ cycles: [], societies: [] });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAccountState()
      .then((next) => {
        if (active) setState(next);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(
    () =>
      state.cycles.map((cycle) => ({
        cycle: cycle.id,
        start: formatDateLabel(cycle.start || cycle.startDate),
        end: formatDateLabel(cycle.end || cycle.endDate),
        status: getBillingCycleDateStatus(cycle),
        societies: state.societies.length,
        action: actionLabel(cycle.status),
      })),
    [state]
  );

  const handleCreateCycle = async () => {
    try {
      const res = await createCycle();
      setState(res.state);
      setMessage(res.message);
    } catch (error) {
      setMessage(error.message || "Unable to create billing cycle.");
    }
  };

  const handleAction = async (row) => {
    if (row.action === "View") {
      setAccountSelections({ cycleId: row.cycle });
      setMessage(`Viewing cycle ${row.cycle}.`);
      return;
    }

    try {
      const res =
        row.action === "Run"
          ? await runCycleBilling(row.cycle)
          : await lockCycleBilling(row.cycle);
      setState(res.state);
      setMessage(res.message);
    } catch (error) {
      setMessage(error.message || "Action failed.");
    }
  };

  return (
    <div className="module-page module-page-body text-[#1F2A44]">
      <div className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1E4B6B]">Billing Cycles</h1>
          <button onClick={handleCreateCycle} className="rounded-lg bg-[#1E73BE] px-3 py-2 text-sm font-semibold text-white">+ Create Cycle</button>
        </div>
        {message ? <p className="mb-3 rounded-lg bg-[#EEF4FF] px-3 py-2 text-sm text-[#1E4B6B]">{message}</p> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#E6EDF7] text-left text-[#5B6B7F]">
                <th className="py-2">Cycle</th>
                <th className="py-2">Start</th>
                <th className="py-2">End</th>
                <th className="py-2">Status</th>
                <th className="py-2">Societies</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[#5B6B7F]">Loading billing cycles...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[#5B6B7F]">No billing cycles yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.cycle} className="border-b border-[#F2F6FC]">
                    <td className="py-2 font-semibold">{row.cycle}</td>
                    <td className="py-2">{row.start}</td>
                    <td className="py-2">{row.end}</td>
                    <td className="py-2"><span className={`rounded px-2 py-1 text-xs ${statusBadge(row.status)}`}>{row.status}</span></td>
                    <td className="py-2">{row.societies}</td>
                    <td className="py-2"><button onClick={() => handleAction(row)} className="rounded bg-[#1E73BE] px-2.5 py-1 text-xs font-semibold text-white">{row.action}</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
