import jsPDF from "jspdf";

export function downloadDispatchPdf(dispatchData) {
  if (!dispatchData) return;

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
    pdf.text(String(v1 ?? ""), 55, y);

    pdf.setFont("helvetica", "bold");
    pdf.text(l2, 150, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(v2 ?? ""), 195, y);
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
  headers.forEach((h) => {
    pdf.setDrawColor(160);
    pdf.rect(x, y, colWidth, 7);
    pdf.text(h, x + 1, y + 5);
    x += colWidth;
  });

  y += 7;
  pdf.setFont("helvetica", "normal");

  dispatchData.products.forEach((p) => {
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
    ].forEach((cell) => {
      pdf.rect(x, y, colWidth, 7);
      pdf.text(String(cell ?? ""), x + 1, y + 5);
      x += colWidth;
    });
    y += 7;
  });

  pdf.save(`dispatch_${dispatchData.identificationNumber}.pdf`);
}
