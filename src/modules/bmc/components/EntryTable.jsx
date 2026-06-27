import {
  calcEntry,
  validateEntry,
  isRowValid,
  calcSession,
  fmtINR,
} from "../utils/engine";

function EntryRow({ row, idx, onChange, onDelete, readOnly = false }) {
  const milkType = row.type || row.milkType || "";
  const f = parseFloat(row.fat);
  const s = parseFloat(row.snf);
  const q = parseFloat(row.qty);
  const hasAll =
    milkType && !Number.isNaN(f) && f > 0 && !Number.isNaN(s) && s > 0 && !Number.isNaN(q) && q > 0;
  const result = hasAll ? calcEntry(milkType, f, s, q) : null;
  const valid = result ? validateEntry(milkType, f, s, q) : null;

  const rowRate = Number(row.rate);
  const rowAmount = Number(row.amount);
  const rateText = Number.isFinite(rowRate) && rowRate > 0 ? fmtINR(rowRate) : result ? result.rateFmt : "-";
  const amountText = Number.isFinite(rowAmount) && rowAmount > 0 ? fmtINR(rowAmount) : result ? result.amtFmt : "-";

  return (
    <tr>
      <td>
        <select
          className="img-select"
          value={milkType}
          onChange={(e) => onChange(idx, "type", e.target.value)}
          disabled={readOnly}
        >
          <option value="">Select Type</option>
          <option value="Cow">Cow</option>
          <option value="Buffalo">Buffalo</option>
        </select>
      </td>
      <td>
        <input
          className="img-num"
          type="number"
          step="0.1"
          min="0"
          placeholder="0.0"
          value={row.fat}
          onChange={(e) => onChange(idx, "fat", e.target.value)}
          disabled={readOnly}
        />
      </td>
      <td>
        <input
          className="img-num"
          type="number"
          step="0.1"
          min="0"
          placeholder="0.0"
          value={row.snf}
          onChange={(e) => onChange(idx, "snf", e.target.value)}
          disabled={readOnly}
        />
      </td>
      <td>
        <input
          className="img-qty"
          type="number"
          step="0.01"
          min="0"
          placeholder="000.00"
          value={row.qty}
          onChange={(e) => onChange(idx, "qty", e.target.value)}
          disabled={readOnly}
        />
      </td>
      <td>
        <span className="img-rate">{rateText}</span>
      </td>
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span className="img-amount">{amountText}</span>
          {!readOnly && valid && (
            <span className={`calc-badge ${valid.valid ? "ok" : "err"}`}>
              {valid.valid ? "Valid" : valid.errs[0]}
            </span>
          )}
        </div>
      </td>
      <td>
        {!readOnly && (
          <button className="img-btn" onClick={() => onDelete(idx)} title="Delete row">
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </button>
        )}
      </td>
    </tr>
  );
}

export default function EntryTable({ rows, onChange, onDelete, onAddRow, readOnly = false }) {
  const validRows = rows
    .filter(isRowValid)
    .map((r) => ({
      type: r.type || r.milkType,
      fat: parseFloat(r.fat),
      snf: parseFloat(r.snf),
      qty: parseFloat(r.qty),
    }));
  const session = validRows.length > 0 ? calcSession(validRows) : null;

  return (
    <>
      <table className="society-main-table">
        <thead>
          <tr>
            <th>Milk Type</th>
            <th>Fat %</th>
            <th>SNF %</th>
            <th>Quantity (L)</th>
            <th>Rate (Rs/L)</th>
            <th>Amount (Rs)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <EntryRow key={idx} row={row} idx={idx} onChange={onChange} onDelete={onDelete} readOnly={readOnly} />
          ))}
        </tbody>
      </table>

      {!readOnly && (
        <div style={{ padding: "10px 18px", borderTop: "1px solid #f2f5f9" }}>
          <button className="add-row-btn" onClick={onAddRow}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Row
          </button>
        </div>
      )}

      {session && (
        <div className="totals-strip">
          <div className="total-cell label">Total</div>
          <div className="total-cell" style={{ flex: 1 }} />
          <div className="total-cell label">Qty:</div>
          <div className="total-cell val">{session.totalQty} L</div>
          <div className="total-cell label">Amount:</div>
          <div className="total-cell val">{session.totalAmtFmt}</div>
          <div className="total-cell" style={{ width: 60 }} />
        </div>
      )}
    </>
  );
}
