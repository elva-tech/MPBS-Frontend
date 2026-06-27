import { useMemo } from "react";
import { calculateTotals, getShipments } from "./state";

export default function DairyReports() {
  const shipments = useMemo(() => getShipments(), []);

  const summary = useMemo(() => {
    return shipments.reduce(
      (acc, item) => {
        const totals = calculateTotals(item.stops || []);
        const deduction = Number(item.discrepancy?.deduction) || 0;
        return {
          received: acc.received + totals.received,
          shortage: acc.shortage + totals.shortage,
          deduction: acc.deduction + deduction,
        };
      },
      { received: 0, shortage: 0, deduction: 0 }
    );
  }, [shipments]);

  return (
    <div className="p-6 text-[#1F2A44]">
      <h1 className="text-2xl font-semibold text-[#1E4B6B]">Reports</h1>
      <p className="mt-1 text-sm text-[#5B6B7F]">
        Shift summary generated from dairy verification and discrepancy decisions.
      </p>

      <div className="mt-5 rounded-xl border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <p><span className="font-semibold">Milk Received:</span> {summary.received.toLocaleString()} L</p>
          <p><span className="font-semibold">Total Shortage:</span> {summary.shortage.toLocaleString()} L</p>
          <p><span className="font-semibold">Total Deduction:</span> Rs. {summary.deduction.toLocaleString()}</p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[#EEF4FF] text-[#1E4B6B]">
              <tr>
                <th className="px-3 py-2">Tanker ID</th>
                <th className="px-3 py-2">Route</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Received</th>
                <th className="px-3 py-2">Shortage</th>
                <th className="px-3 py-2">Deduction</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((item) => {
                const totals = calculateTotals(item.stops || []);
                return (
                  <tr key={item.id} className="border-t border-[#E6EDF7]">
                    <td className="px-3 py-2">{item.tankerId}</td>
                    <td className="px-3 py-2">{item.route}</td>
                    <td className="px-3 py-2">{item.status}</td>
                    <td className="px-3 py-2">{totals.received} L</td>
                    <td className="px-3 py-2">{totals.shortage} L</td>
                    <td className="px-3 py-2">Rs. {Number(item.discrepancy?.deduction || 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
