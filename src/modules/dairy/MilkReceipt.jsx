import { useEffect, useMemo, useState } from "react";
import { calculateTotals, getLatestDiscrepancyShipment, getShipmentStatusLabel, setActiveShipmentId, updateShipment } from "./state";

const discrepancyTypes = ["Quantity Loss", "Low Fat / SNF", "Spillage", "Adulteration"];

export default function DairyMilkReceipt() {
  const [shipment, setShipment] = useState(() => getLatestDiscrepancyShipment());
  const [discrepancyType, setDiscrepancyType] = useState(discrepancyTypes[0]);
  const [remarks, setRemarks] = useState("Milk shortage detected during unloading.");
  const [photoName, setPhotoName] = useState("");
  const [remarksError, setRemarksError] = useState("");

  useEffect(() => {
    if (!shipment?.discrepancy) return;
    setDiscrepancyType(shipment.discrepancy.type || discrepancyTypes[0]);
    setRemarks(shipment.discrepancy.remarks || "");
    setPhotoName(shipment.discrepancy.photoName || "");
  }, [shipment]);

  const receiptRows = useMemo(
    () =>
      (shipment?.stops || []).map((row) => ({
        ...row,
        shortage: Math.max(Number(row.expected) - Number(row.received), 0),
      })),
    [shipment]
  );

  const totals = useMemo(() => {
    const calculated = calculateTotals(receiptRows);
    const quantityLoss = calculated.shortage;
    const penaltyRate = 35;
    const deduction = quantityLoss * penaltyRate;
    return { quantityLoss, penaltyRate, deduction };
  }, [receiptRows]);

  const saveDecision = (status) => {
    if (!remarks.trim()) {
      setRemarksError("Remarks are mandatory for approve with penalty or rejection.");
      return;
    }
    const actionText = status === "rejected" ? "reject this tanker batch" : "approve with penalty and send to Accounts";
    const confirmed = window.confirm(`Please confirm: ${actionText}?`);
    if (!confirmed) return;

    if (!shipment?.id) return;
    const updated = updateShipment(shipment.id, (current) => ({
      ...current,
      status,
      discrepancy: {
        type: discrepancyType,
        remarks,
        photoName,
        penaltyRate: totals.penaltyRate,
        deduction: totals.deduction,
      },
    }));
    setRemarksError("");
    setShipment(updated);
    setActiveShipmentId(updated?.id || shipment.id);
    window.alert("Submission completed successfully.");
  };

  if (!shipment) {
    return (
      <div className="p-6 text-[#1F2A44]">
        <h1 className="text-2xl font-semibold text-[#1E4B6B]">Milk Receipt & Discrepancy</h1>
        <p className="mt-1 text-sm text-[#5B6B7F]">No tanker discrepancy data available.</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-[#1F2A44]">
      <h1 className="text-2xl font-semibold text-[#1E4B6B]">Milk Receipt & Discrepancy</h1>
      <p className="mt-1 text-sm text-[#5B6B7F]">Log quantity/quality differences and apply penalty decisions.</p>
      <div className="mt-3 rounded-lg border border-[#D7E4FF] bg-white px-4 py-3 text-sm text-[#334155]">
        <span className="font-semibold">Tanker:</span> {shipment.tankerId} ({shipment.route}){" "}
        <span className="ml-3 rounded-full bg-[#EEF4FF] px-2 py-1 text-xs font-semibold text-[#1E4B6B]">
          {getShipmentStatusLabel(shipment.status)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">Discrepancy Details</h2>

          <label className="mt-4 block text-sm font-medium text-[#334155]">Discrepancy Type</label>
          <select
            value={discrepancyType}
            onChange={(e) => setDiscrepancyType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2 text-sm"
          >
            {discrepancyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-medium text-[#334155]">Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              if (remarksError) setRemarksError("");
            }}
            rows={4}
            className="mt-1 w-full rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2 text-sm"
          />
          {remarksError ? <p className="mt-1 text-xs font-semibold text-[#B42318]">{remarksError}</p> : null}

          <label className="mt-4 block text-sm font-medium text-[#334155]">Upload Evidence</label>
          <label className="mt-1 flex cursor-pointer items-center justify-between rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2 text-sm">
            <span className="truncate">{photoName || "Upload Photo"}</span>
            <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-[#1E4B6B]">Choose File</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => setPhotoName(e.target.files?.[0]?.name || "")}
            />
          </label>
        </section>

        <section className="rounded-xl border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">Penalty Calculation</h2>
          <div className="mt-4 space-y-2 rounded-lg bg-[#F7FAFF] p-4 text-sm">
            <p><span className="font-semibold">Quantity Loss:</span> {totals.quantityLoss} L</p>
            <p><span className="font-semibold">Penalty Rate:</span> Rs. {totals.penaltyRate}/L</p>
            <p className="text-base font-semibold text-[#D84343]">Deduction: Rs. {totals.deduction}</p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-[#EEF4FF] text-[#1E4B6B]">
                <tr>
                  <th className="px-3 py-2">BMC</th>
                  <th className="px-3 py-2">Expected</th>
                  <th className="px-3 py-2">Received</th>
                  <th className="px-3 py-2">Shortage</th>
                </tr>
              </thead>
              <tbody>
                {receiptRows.map((row) => (
                  <tr key={row.bmc} className="border-t border-[#E6EDF7]">
                    <td className="px-3 py-2">{row.bmc}</td>
                    <td className="px-3 py-2">{row.expected} L</td>
                    <td className="px-3 py-2">{row.received} L</td>
                    <td className={`px-3 py-2 ${row.shortage > 0 ? "font-semibold text-[#D84343]" : ""}`}>
                      {row.shortage} L
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => saveDecision("penalty")}
          className="rounded bg-[#1E4B6B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#173A55]"
        >
          Approve with Penalty
        </button>
        <button
          type="button"
          onClick={() => saveDecision("rejected")}
          className="rounded border border-[#D84343] bg-white px-5 py-2 text-sm font-semibold text-[#D84343] hover:bg-[#FFF4F4]"
        >
          Reject Tanker
        </button>
      </div>
    </div>
  );
}
