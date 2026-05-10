import { useMemo, useState } from "react";
import { calculateSocietyBilling, loadAccountState, markInvoiceSent } from "./engine";

export default function Invoices() {
  const [state, setState] = useState(() => loadAccountState());
  const [message, setMessage] = useState("");

  const selectedCycleId = state.selectedCycleId || state.cycles[0]?.id;
  const selectedSocietyId = state.selectedSocietyId || state.societies[0]?.id;
  const society = state.societies.find((item) => item.id === selectedSocietyId) || state.societies[0];

  const invoice = useMemo(
    () => calculateSocietyBilling(state, selectedCycleId, selectedSocietyId),
    [state, selectedCycleId, selectedSocietyId]
  );

  const sent = state.invoiceDispatch.some(
    (item) => item.cycleId === selectedCycleId && item.societyId === selectedSocietyId
  );

  const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString("en-IN")}`;

  const handleDownload = () => {
    const lines = [
      "Invoice",
      `Society: ${selectedSocietyId} - ${society?.name || ""}`,
      `Cycle: ${selectedCycleId}`,
      `Date: ${new Date().toLocaleDateString("en-IN")}`,
      `Milk Amount: ${formatCurrency(invoice.milkAmount)}`,
      `Claims: +${formatCurrency(invoice.totalClaims)}`,
      `Scheme Benefits: +${formatCurrency(invoice.totalSchemeBenefits)}`,
      `Recoverables: -${formatCurrency(invoice.totalRecoverables)}`,
      `Scheme Deductions: -${formatCurrency(invoice.totalSchemeDeductions)}`,
      `Transport Penalty: -${formatCurrency(invoice.transportPenalty)}`,
      `Final Payable: ${formatCurrency(invoice.netPayable)}`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${selectedSocietyId}-${selectedCycleId}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Invoice downloaded.");
  };

  const handleSend = () => {
    const res = markInvoiceSent(selectedCycleId, selectedSocietyId);
    setState(res.state || loadAccountState());
    setMessage(res.message);
  };

  return (
    <div className="p-6 text-[#1F2A44]">
      <div className="rounded-xl border border-[#D7E4FF] bg-white p-4 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <h1 className="text-2xl font-semibold text-[#1E4B6B]">Invoices</h1>
        {message ? <p className="mt-3 rounded-lg bg-[#EEF4FF] px-3 py-2 text-sm text-[#1E4B6B]">{message}</p> : null}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] p-4">
            <p className="text-sm text-[#5B6B7F]">Society</p>
            <p className="font-semibold">{selectedSocietyId} - {society?.name || "-"}</p>
            <p className="mt-3 text-sm text-[#5B6B7F]">Cycle</p>
            <p className="font-semibold">{selectedCycleId}</p>
            <p className="mt-3 text-sm text-[#5B6B7F]">Date</p>
            <p className="font-semibold">{new Date().toLocaleDateString("en-IN")}</p>
          </div>

          <div className="rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] p-4 text-sm">
            <div className="flex justify-between py-1"><span>Milk Amount</span><span className="font-semibold">{formatCurrency(invoice.milkAmount)}</span></div>
            <div className="flex justify-between py-1"><span>Claims</span><span>+{formatCurrency(invoice.totalClaims)}</span></div>
            <div className="flex justify-between py-1"><span>Scheme Benefits</span><span>+{formatCurrency(invoice.totalSchemeBenefits)}</span></div>
            <div className="flex justify-between py-1"><span>Recoverables</span><span>-{formatCurrency(invoice.totalRecoverables)}</span></div>
            <div className="flex justify-between py-1"><span>Scheme Deductions</span><span>-{formatCurrency(invoice.totalSchemeDeductions)}</span></div>
            <div className="flex justify-between py-1"><span>Transport Penalty</span><span>-{formatCurrency(invoice.transportPenalty)}</span></div>
            <div className="mt-2 border-t border-[#D7E4FF] pt-2 text-3xl font-semibold text-[#1E4B6B]">
              <div className="flex justify-between"><span>Final Payable</span><span>{formatCurrency(invoice.netPayable)}</span></div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={handleDownload} className="rounded-lg border border-[#1E4B6B] px-4 py-2 text-sm font-semibold text-[#1E4B6B]">Download PDF</button>
          <button onClick={handleSend} disabled={sent} className="rounded-lg bg-[#1E73BE] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">{sent ? "Sent" : "Send to Society"}</button>
        </div>
      </div>
    </div>
  );
}
