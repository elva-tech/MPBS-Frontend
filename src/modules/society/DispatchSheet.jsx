import { useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

export default function DispatchSheet() {
  const navigate = useNavigate();
  const [dispatchData, setDispatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    // For now, show a message that dispatch generation needs to be implemented
    setTimeout(() => {
      alert("Dispatch generation is not implemented yet");
      setLoading(false);
    }, 300);
  };

  const handleDownload = () => {
    const pdf = new jsPDF("landscape", "mm", "a4");

    let y = 14;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("DISPATCH MONITORING FORM", 148, y, { align: "center" });

    y += 10;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    const row = (l1, v1, l2, v2) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(l1, 10, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(v1, 55, y);

      pdf.setFont("helvetica", "bold");
      pdf.text(l2, 150, y);
      pdf.setFont("helvetica", "normal");
      pdf.text(v2, 195, y);
      y += 6;
    };

    row("Identification No", dispatchData.identificationNumber, "Effective Date", dispatchData.effectiveDate);
    row("Revision No", dispatchData.revisionNumber, "Date of Dispatch", dispatchData.dateOfDispatch);
    row("Customer Name", dispatchData.customerName, "Truck Number", dispatchData.truckNumber);
    row("Driver Number", dispatchData.driverNumber, "Time of Dispatch", dispatchData.timeOfDispatch);
    row("Pre-cool Temp", dispatchData.preCoolTemperature, "Cooling Dock Temp", dispatchData.coolingDockTemperature);
    row("Pest Infestation", dispatchData.pestInfestation, "Vehicle Cleaned", dispatchData.vehicleCleaned);

    y += 4;

    const headers = [
      "Product", "MFG Date", "EXP Date", "Batch",
      "Qty", "Disp Temp", "Truck Temp", "Comment", "Sign"
    ];

    const colWidth = 30;
    let x = 10;

    pdf.setFont("helvetica", "bold");
    headers.forEach(h => {
      pdf.setDrawColor(160);
      pdf.rect(x, y, colWidth, 7);
      pdf.text(h, x + 1, y + 5);
      x += colWidth;
    });

    y += 7;
    pdf.setFont("helvetica", "normal");

    dispatchData.products.forEach(p => {
      x = 10;
      [
        p.product,
        p.manufactureDate,
        p.expiryDate,
        p.batchNo,
        p.quantity,
        p.dispatchTemperature,
        p.truckTemperature,
        p.comment,
        ""
      ].forEach(cell => {
        pdf.rect(x, y, colWidth, 7);
        pdf.text(String(cell), x + 1, y + 5);
        x += colWidth;
      });
      y += 7;
    });

    pdf.save(`dispatch_${dispatchData.identificationNumber}.pdf`);
  };

  return (
    <div className="p-6">
      <div className="bg-cyan-700 text-white rounded-md px-4 py-3 flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 rounded text-sm font-semibold"
        >
          Back
        </button>
        <h1 className="text-base font-semibold">Dispatch Sheet</h1>
        <div className="w-14" />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-cyan-700 text-white px-6 py-2 rounded hover:bg-cyan-800 disabled:bg-gray-400"
      >
        {loading ? "Generating..." : "Generate Dispatch Sheet"}
      </button>

     {dispatchData && (
  <div className="mt-6 border rounded bg-white p-6 overflow-auto">
    <h2 className="text-center font-semibold mb-4">
      DISPATCH MONITORING FORM
    </h2>

    {/* BASIC INFO */}
    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
      <div><b>Identification No:</b> {dispatchData.identificationNumber}</div>
      <div><b>Effective Date:</b> {dispatchData.effectiveDate}</div>

      <div><b>Revision No:</b> {dispatchData.revisionNumber}</div>
      <div><b>Date of Dispatch:</b> {dispatchData.dateOfDispatch}</div>

      <div><b>Customer Name:</b> {dispatchData.customerName}</div>
      <div><b>Truck Number:</b> {dispatchData.truckNumber}</div>

      <div><b>Driver Number:</b> {dispatchData.driverNumber}</div>
      <div><b>Time of Dispatch:</b> {dispatchData.timeOfDispatch}</div>

      <div><b>Pre-cool Temp:</b> {dispatchData.preCoolTemperature}</div>
      <div><b>Cooling Dock Temp:</b> {dispatchData.coolingDockTemperature}</div>

      <div><b>Pest Infestation:</b> {dispatchData.pestInfestation}</div>
      <div><b>Vehicle Cleaned:</b> {dispatchData.vehicleCleaned}</div>
    </div>

    {/* PRODUCTS TABLE */}
    <table className="w-full border border-gray-400 text-sm">
      <thead className="bg-gray-200">
        <tr>
          {[
            "Product",
            "MFG Date",
            "EXP Date",
            "Batch No",
            "Qty",
            "Dispatch Temp",
            "Truck Temp",
            "Comment",
            "Sign",
          ].map((h) => (
            <th key={h} className="border px-2 py-1">
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {dispatchData.products.map((p, i) => (
          <tr key={i}>
            <td className="border px-2 py-1">{p.product}</td>
            <td className="border px-2 py-1">{p.manufactureDate}</td>
            <td className="border px-2 py-1">{p.expiryDate}</td>
            <td className="border px-2 py-1">{p.batchNo}</td>
            <td className="border px-2 py-1">{p.quantity}</td>
            <td className="border px-2 py-1">{p.dispatchTemperature}</td>
            <td className="border px-2 py-1">{p.truckTemperature}</td>
            <td className="border px-2 py-1">{p.comment}</td>
            <td className="border px-2 py-1"></td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* DOWNLOAD */}
    <div className="mt-4 flex justify-end">
      <button
        onClick={handleDownload}
        className="bg-cyan-700 text-white px-6 py-2 rounded hover:bg-cyan-800"
      >
        Download
      </button>
    </div>
  </div>
)}
    </div>
  );
}






