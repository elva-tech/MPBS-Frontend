import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  calculateTotals,
  getActiveShipment,
  getShipmentStatusLabel,
  isShipmentGoodQuality,
  QUANTITY_TOLERANCE_PERCENT,
  setActiveShipmentId,
  updateShipment,
} from "./state";

export default function DairyTankerVerification() {
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(() => getActiveShipment());
  const [rows, setRows] = useState(() => shipment?.stops || []);
  const [qualityRows, setQualityRows] = useState(() => shipment?.quality || []);

  useEffect(() => {
    setRows(shipment?.stops || []);
    setQualityRows(shipment?.quality || []);
  }, [shipment]);

  useEffect(() => {
    if (!shipment?.id || shipment.status !== "pending") return;
    const updated = updateShipment(shipment.id, (current) => ({ ...current, status: "in_verification" }));
    setShipment(updated);
  }, [shipment?.id, shipment?.status]);

  const totals = useMemo(() => calculateTotals(rows), [rows]);
  const toleranceLimit = useMemo(
    () => Math.round(((totals.expected || 0) * QUANTITY_TOLERANCE_PERCENT) / 100),
    [totals.expected]
  );

  const handleReceivedChange = (index, value) => {
    const nextValue = Number(value);
    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              received: Number.isFinite(nextValue) ? nextValue : 0,
            }
          : row
      )
    );
  };

  const handleQualityChange = (index, value) => {
    setQualityRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              dairyTest: value,
            }
          : row
      )
    );
  };

  const qualityIssues = useMemo(() => {
    const fatRow = qualityRows.find((item) => String(item.parameter || "").toLowerCase() === "fat");
    const snfRow = qualityRows.find((item) => String(item.parameter || "").toLowerCase() === "snf");
    const fat = Number(fatRow?.dairyTest);
    const snf = Number(snfRow?.dairyTest);
    const issues = [];
    if (Number.isFinite(fat) && fat < 3.5) issues.push("Low Fat");
    if (Number.isFinite(snf) && snf < 8.5) issues.push("Low SNF");
    return issues;
  }, [qualityRows]);

  const shortageBeyondTolerance = totals.shortage > toleranceLimit;

  const saveStatus = (status) => {
    if (!shipment?.id) return;
    const updated = updateShipment(shipment.id, (current) => ({
      ...current,
      stops: rows,
      quality: qualityRows,
      status,
      discrepancy:
        status === "approved"
          ? null
          : {
              type: shortageBeyondTolerance ? "Quantity Loss" : qualityIssues[0] ? "Low Fat / SNF" : "Spillage",
              remarks:
                shortageBeyondTolerance || qualityIssues.length
                  ? "Difference detected during dairy verification."
                  : (current.discrepancy?.remarks || ""),
              photoName: current.discrepancy?.photoName || "",
              penaltyRate: current.discrepancy?.penaltyRate || 35,
              deduction: current.discrepancy?.deduction || 0,
            },
    }));
    setShipment(updated);
    setActiveShipmentId(updated?.id || shipment.id);
  };

  const handleApprove = () => {
    const isGood = isShipmentGoodQuality({ ...shipment, quality: qualityRows });
    if (isGood && !shortageBeyondTolerance) {
      const confirmed = window.confirm("Confirm tanker approval and send this batch to Accounts?");
      if (!confirmed) return;
      saveStatus("approved");
      return;
    }
    const confirmed = window.confirm(
      "Quantity or quality difference detected. Continue to discrepancy screen for penalty/reject decision?"
    );
    if (!confirmed) return;
    saveStatus("penalty");
    navigate("/dairy/milk-receipt");
  };

  const handleReject = () => {
    const confirmed = window.confirm("Confirm tanker batch rejection?");
    if (!confirmed) return;
    saveStatus("rejected");
    navigate("/dairy/milk-receipt");
  };

  if (!shipment) {
    return (
      <div className="p-6 text-[#1F2A44]">
        <h1 className="text-2xl font-semibold text-[#1E4B6B]">Tanker Verification</h1>
        <p className="mt-1 text-sm text-[#5B6B7F]">No tanker route data found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 text-[#1F2A44]">
      <h1 className="text-2xl font-semibold text-[#1E4B6B]">Tanker Verification</h1>
      <p className="mt-1 text-sm text-[#5B6B7F]">Measure quantity and quality before approval.</p>

      <section className="mt-5 rounded-xl border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <h2 className="text-lg font-semibold text-[#1E4B6B]">Tanker Details</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><span className="font-semibold">Tanker ID:</span> {shipment.tankerId}</div>
          <div><span className="font-semibold">Route:</span> {shipment.route}</div>
          <div><span className="font-semibold">Arrival Time:</span> {shipment.arrivalTime}</div>
          <div><span className="font-semibold">Transporter:</span> {shipment.transporter}</div>
          <div>
            <span className="font-semibold">Status:</span>{" "}
            <span className="rounded-full bg-[#EEF4FF] px-2 py-1 text-xs font-semibold text-[#1E4B6B]">
              {getShipmentStatusLabel(shipment.status)}
            </span>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <h2 className="text-lg font-semibold text-[#1E4B6B]">Milk Receipt Table</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[#EEF4FF] text-[#1E4B6B]">
              <tr>
                <th className="px-4 py-3">BMC</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Shortage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const shortage = Math.max(Number(row.expected) - Number(row.received), 0);
                return (
                <tr key={row.bmc} className="border-t border-[#E6EDF7]">
                  <td className="px-4 py-3">{row.bmc}</td>
                  <td className="px-4 py-3">{row.expected} L</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={row.received}
                      onChange={(event) => handleReceivedChange(index, event.target.value)}
                      className="w-24 rounded border border-[#D7E4FF] bg-[#F7FAFF] px-2 py-1 text-sm"
                    />
                    <span className="ml-1">L</span>
                  </td>
                  <td className={`px-4 py-3 ${shortage > 0 ? "text-[#D84343] font-semibold" : ""}`}>
                    {shortage} L
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 rounded-lg bg-[#F7FAFF] p-4 text-sm sm:grid-cols-3">
          <p><span className="font-semibold">Expected:</span> {totals.expected} L</p>
          <p><span className="font-semibold">Received:</span> {totals.received} L</p>
          <p className="font-semibold text-[#D84343]">Shortage: {totals.shortage} L</p>
        </div>
        <p className={`mt-3 text-sm ${shortageBeyondTolerance ? "font-semibold text-[#B42318]" : "text-[#475467]"}`}>
          Quantity tolerance ({QUANTITY_TOLERANCE_PERCENT}%): {toleranceLimit} L
          {shortageBeyondTolerance ? " - Exceeded" : " - Within limit"}
        </p>
      </section>

      <section className="mt-4 rounded-xl border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <h2 className="text-lg font-semibold text-[#1E4B6B]">Quality Test</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-[#EEF4FF] text-[#1E4B6B]">
              <tr>
                <th className="px-4 py-3">Parameter</th>
                <th className="px-4 py-3">Route Sheet</th>
                <th className="px-4 py-3">Dairy Test</th>
              </tr>
            </thead>
            <tbody>
              {qualityRows.map((item, index) => (
                <tr key={item.parameter} className="border-t border-[#E6EDF7]">
                  <td className="px-4 py-3">{item.parameter}</td>
                  <td className="px-4 py-3">{item.routeSheet}</td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.dairyTest}
                      onChange={(event) => handleQualityChange(index, event.target.value)}
                      className="w-24 rounded border border-[#D7E4FF] bg-[#F7FAFF] px-2 py-1 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleApprove}
          className="rounded bg-[#1E4B6B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#173A55]"
        >
          Approve Tanker
        </button>
        <button
          type="button"
          onClick={handleReject}
          className="rounded border border-[#D84343] bg-white px-5 py-2 text-sm font-semibold text-[#D84343] hover:bg-[#FFF4F4]"
        >
          Reject Batch
        </button>
      </div>
    </div>
  );
}
