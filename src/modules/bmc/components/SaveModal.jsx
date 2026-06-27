import { Fragment } from "react";
import { calcEntry, compareVals } from "../utils/engine";

export default function SaveModal({ record, onClose }) {
  if (!record) return null;

  const isVerified = record.comparisonStatus.includes("VERIFIED");
  const statusColor = isVerified ? "#166534" : "#92400e";
  const statusBg = isVerified ? "#dcfce7" : "#fef9c3";
  const statusBorder = isVerified ? "#86efac" : "#fde68a";

  const thStyle = {
    padding: "9px 12px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    color: "#6b7280",
    borderBottom: "1px solid #e4e9f0",
  };
  const tdStyle = {
    padding: "8px 12px",
    borderBottom: "1px solid #f0f4f8",
    fontSize: 13,
    fontFamily: "monospace",
  };
  const mismatchStyle = {
    color: "#b91c1c",
    fontWeight: 700,
  };
  const deltaStyle = {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: 800,
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div
          style={{
            padding: "20px 24px 18px",
            borderBottom: "1px solid #e4e9f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: "#dcfce7",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1e2d45" }}>Verification Saved</div>
              <div style={{ fontSize: 12, color: "#9aaabf", marginTop: 1 }}>
                {record.savedAt} - {record.savedBy}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f0f4f8",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 16,
              color: "#5a6a85",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            x
          </button>
        </div>

        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#9aaabf",
                }}
              >
                Society
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#1e2d45", marginTop: 2 }}>
                {record.society}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#9aaabf",
                }}
              >
                Verification
              </div>
              <div
                style={{
                  marginTop: 4,
                  display: "inline-block",
                  padding: "5px 14px",
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 700,
                  background: statusBg,
                  color: statusColor,
                  border: `1px solid ${statusBorder}`,
                }}
              >
                {record.comparisonStatus}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                flex: 1,
                background: "#f0f6ff",
                border: "1px solid #c7d9f8",
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#2b4c8c",
                  marginBottom: 4,
                }}
              >
                Total Quantity
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1e2d45", fontFamily: "monospace" }}>
                {record.totalQty} L
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: 10,
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#16a34a",
                  marginBottom: 4,
                }}
              >
                Total Amount
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#1e2d45", fontFamily: "monospace" }}>
                {record.totalAmt}
              </div>
            </div>
          </div>

          <div
            style={{
              marginBottom: 14,
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid #e4e9f0",
              borderRadius: 8,
              fontSize: 12.5,
              color: "#5a6a85",
            }}
          >
            <strong style={{ color: "#1e2d45" }}>Physical Check:</strong> {record.verifyChoice}
          </div>

          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#6b7280",
              marginBottom: 8,
            }}
          >
            Society Entry Details
          </div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e4e9f0",
              borderRadius: 8,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <thead>
              <tr style={{ background: "#fafbfd" }}>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Fat%</th>
                <th style={thStyle}>SNF%</th>
                <th style={thStyle}>Qty (L)</th>
                <th style={thStyle}>Rate</th>
                <th style={thStyle}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {record.entries.map((e, i) => (
                <tr key={i}>
                  <td style={tdStyle}>{e.type}</td>
                  <td style={tdStyle}>{e.fat}</td>
                  <td style={tdStyle}>{e.snf}</td>
                  <td style={tdStyle}>{e.qty}</td>
                  <td style={tdStyle}>{e.rateFmt}</td>
                  <td style={{ ...tdStyle, fontWeight: 700, color: "#1e2d45" }}>{e.amtFmt}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {record.bmcEntries && record.bmcEntries.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#6b7280",
                  marginBottom: 8,
                }}
              >
                BMC Actual Values
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "#f7f9fc",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid #e4e9f0",
                }}
              >
                <thead>
                  <tr style={{ background: "#edf0f7" }}>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Fat%</th>
                    <th style={thStyle}>SNF%</th>
                    <th style={thStyle}>Qty</th>
                    <th style={thStyle}>Rate</th>
                    <th style={thStyle}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {record.bmcEntries.map((e, i) => {
                    const res = calcEntry(e.type, e.fat, e.snf, e.qty);
                    return (
                      <tr key={i}>
                        <td style={tdStyle}>{e.type}</td>
                        <td style={tdStyle}>{e.fat}</td>
                        <td style={tdStyle}>{e.snf}</td>
                        <td style={tdStyle}>{e.qty}</td>
                        <td style={tdStyle}>{res.rateFmt}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#1e2d45" }}>{res.amtFmt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#6b7280",
                  marginTop: 16,
                  marginBottom: 8,
                }}
              >
                Data Comparison (Society vs BMC)
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid #e4e9f0",
                  borderRadius: 8,
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                <thead>
                  <tr style={{ background: "#fafbfd" }}>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Source</th>
                    <th style={thStyle}>Fat%</th>
                    <th style={thStyle}>SNF%</th>
                    <th style={thStyle}>Qty (L)</th>
                    <th style={thStyle}>Rate</th>
                    <th style={thStyle}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {record.entries.map((socEntry, i) => {
                    const bmcEntry =
                      record.bmcEntries.find((b) => b.type === socEntry.type) || record.bmcEntries[i];
                    if (!bmcEntry) return null;
                    const bmcCalc = calcEntry(bmcEntry.type, bmcEntry.fat, bmcEntry.snf, bmcEntry.qty);
                    const cmp = compareVals(socEntry, bmcEntry);
                    const arrow = (field) => {
                      if (field.bv > field.sv) return <span style={{ ...deltaStyle, color: "#15803d" }}>▲</span>;
                      if (field.bv < field.sv) return <span style={{ ...deltaStyle, color: "#b91c1c" }}>▼</span>;
                      return null;
                    };
                    return (
                      <Fragment key={`${socEntry.type}-${i}`}>
                        <tr>
                        <td style={tdStyle}>{socEntry.type}</td>
                        <td style={tdStyle}>Society</td>
                        <td style={tdStyle}>{socEntry.fat}</td>
                        <td style={tdStyle}>{socEntry.snf}</td>
                        <td style={tdStyle}>{socEntry.qty}</td>
                        <td style={tdStyle}>{socEntry.rateFmt}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#1e2d45" }}>{socEntry.amtFmt}</td>
                      </tr>
                      <tr>
                        <td style={tdStyle} />
                        <td style={{ ...tdStyle, color: "#b91c1c", fontWeight: 700 }}>BMC</td>
                        <td style={{ ...tdStyle, ...(cmp.fields.fat.ok ? null : mismatchStyle) }}>
                          {bmcEntry.fat}
                          {arrow(cmp.fields.fat)}
                        </td>
                        <td style={{ ...tdStyle, ...(cmp.fields.snf.ok ? null : mismatchStyle) }}>
                          {bmcEntry.snf}
                          {arrow(cmp.fields.snf)}
                        </td>
                        <td style={{ ...tdStyle, ...(cmp.fields.qty.ok ? null : mismatchStyle) }}>
                          {bmcEntry.qty}
                          {arrow(cmp.fields.qty)}
                        </td>
                        <td style={tdStyle}>{bmcCalc.rateFmt}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: "#1e2d45" }}>{bmcCalc.amtFmt}</td>
                      </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid #e4e9f0", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 22px",
              background: "#2b4c8c",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
