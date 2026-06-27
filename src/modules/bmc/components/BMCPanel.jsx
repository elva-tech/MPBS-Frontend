import { calcEntry, calcSession, genReport, isRowValid } from "../utils/engine";

const MILK_TYPES = ["Cow", "Buffalo"];

function BmcRow({ row, idx, onChange, selectedTypes }) {
  const f = parseFloat(row.fat);
  const s = parseFloat(row.snf);
  const q = parseFloat(row.qty);
  const hasAll =
    row.type && !Number.isNaN(f) && f > 0 && !Number.isNaN(s) && s > 0 && !Number.isNaN(q) && q > 0;
  const result = hasAll ? calcEntry(row.type, f, s, q) : null;
  const availableTypes = MILK_TYPES.filter((type) => type === row.type || !selectedTypes.includes(type));

  return (
    <tr>
      <td>
        <select className="bmc-type-select" value={row.type} onChange={(e) => onChange(idx, "type", e.target.value)}>
          <option value="">Select Type</option>
          {availableTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          className="bmc-box"
          type="number"
          step="0.1"
          min="0"
          placeholder="0.0"
          value={row.fat}
          onChange={(e) => onChange(idx, "fat", e.target.value)}
        />
      </td>
      <td>
        <input
          className="bmc-box"
          type="number"
          step="0.1"
          min="0"
          placeholder="0.0"
          value={row.snf}
          onChange={(e) => onChange(idx, "snf", e.target.value)}
        />
      </td>
      <td>
        <input
          className="bmc-qty-box"
          type="number"
          step="0.01"
          min="0"
          placeholder="000.00"
          value={row.qty}
          onChange={(e) => onChange(idx, "qty", e.target.value)}
        />
      </td>
      <td>
        <span className="bmc-rate">{result ? result.rateFmt : "-"}</span>
      </td>
      <td>
        <span className="bmc-amount">{result ? result.amtFmt : "-"}</span>
      </td>
    </tr>
  );
}

export default function BMCPanel({ bmcRows, onChange, societyRows, societyName }) {
  const selectedTypes = bmcRows.map((row) => row.type).filter(Boolean);
  const validBmc = bmcRows
    .filter(isRowValid)
    .map((r) => ({
      type: r.type,
      fat: parseFloat(r.fat),
      snf: parseFloat(r.snf),
      qty: parseFloat(r.qty),
    }));
  const bmcSession = validBmc.length > 0 ? calcSession(validBmc) : null;

  const validSoc = societyRows
    .filter(isRowValid)
    .map((r) => ({
      type: r.type,
      fat: parseFloat(r.fat),
      snf: parseFloat(r.snf),
      qty: parseFloat(r.qty),
    }));
  const report = validSoc.length > 0 && validBmc.length > 0 ? genReport(societyName, validSoc, validBmc) : null;

  return (
    <>
      <div className="bmc-entry-panel">
        <div className="bmc-entry-header">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          BMC - Actual Measured Values
        </div>
        <table className="bmc-entry-table">
          <thead>
            <tr>
              <th>Milk Type</th>
              <th>Fat %</th>
              <th>SNF %</th>
              <th>Quantity (L)</th>
              <th>Rate (Rs/L)</th>
              <th>Amount (Rs)</th>
            </tr>
          </thead>
          <tbody>
            {bmcRows.map((row, idx) => (
              <BmcRow key={idx} row={row} idx={idx} onChange={onChange} selectedTypes={selectedTypes} />
            ))}
          </tbody>
        </table>

        {bmcSession && (
          <div className="bmc-totals-strip">
            <div className="total-cell label" style={{ color: "#4a5568" }}>
              BMC Total
            </div>
            <div className="total-cell" style={{ flex: 1 }} />
            <div className="total-cell label" style={{ color: "#4a5568" }}>
              Qty:
            </div>
            <div className="total-cell val">{bmcSession.totalQty} L</div>
            <div className="total-cell label" style={{ color: "#4a5568" }}>
              Amount:
            </div>
            <div className="total-cell val">{bmcSession.totalAmtFmt}</div>
          </div>
        )}
      </div>

      {report && (
        <div className={`compare-banner ${report.allOk ? "match" : "mismatch"}`}>
          <strong>{report.status}</strong>
          <div className="compare-detail">
            {report.comps.map((c, i) => {
              const f = c.cmp.fields;
              return (
                <div key={i}>
                  <strong>{c.type}</strong> - FAT: {f.fat.status} ({f.fat.pct}%) | SNF: {f.snf.status} (
                  {f.snf.pct}%) | Qty: {f.qty.status} ({f.qty.pct}%)
                </div>
              );
            })}
            <div style={{ marginTop: 6, fontWeight: 600 }}>
              Society: {report.sTotals.amt} | BMC: {report.bTotals.amt}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
