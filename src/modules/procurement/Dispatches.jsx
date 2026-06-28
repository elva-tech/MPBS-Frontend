import { useMemo, useState, useEffect } from "react";
import { CalendarDays, Trash2 } from "lucide-react";
import { fetchSocieties, createDispatch } from "../../utils/api";

const products = [
  { product: "Cattle Feed", unit: "Bag", rate: 1200 },
  { product: "Mineral Mixture", unit: "Packet", rate: 150 },
  { product: "Calf Starter", unit: "Packet", rate: 220 },
  { product: "Bypass Fat", unit: "Packet", rate: 300 },
];

const initialForm = {
  society: "ALL",
  date: "2025-05-12",
  remarks: "",
  product: "Cattle Feed",
  unit: "Bag",
  rate: 1200,
  quantity: 20,
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProcurementDispatches() {
  const [form, setForm] = useState(initialForm);
  const [societies, setSocieties] = useState([]);
  const [items, setItems] = useState([{ product: "Cattle Feed", unit: "Bag", rate: 1200, quantity: 20 }]);
  const [message, setMessage] = useState("");
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.rate || 0) * Number(item.quantity || 0), 0),
    [items]
  );
  const formAmount = Number(form.rate || 0) * Number(form.quantity || 0);

  const updateForm = (field, value) => {
    if (field === "product") {
      const selected = products.find((item) => item.product === value) || products[0];
      setForm((prev) => ({ ...prev, product: selected.product, unit: selected.unit, rate: selected.rate }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let mounted = true;
    fetchSocieties()
      .then((res) => {
        const list = (res && res.data) || [];
        if (!mounted) return;
        setSocieties(list);
        // keep default as ALL unless user picks a specific society
      })
      .catch(() => {
        // keep existing hardcoded fallback if request fails
      });

    return () => {
      mounted = false;
    };
  }, []);

  const addItem = () => {
    const quantity = Number(form.quantity || 0);
    if (!form.product || quantity <= 0) return;
    setItems((prev) => [
      ...prev,
      { product: form.product, unit: form.unit, rate: Number(form.rate || 0), quantity },
    ]);
    setMessage(`${form.product} added to dispatch items.`);
  };

  const deleteItem = (indexToDelete) => {
    setItems((prev) => prev.filter((_, index) => index !== indexToDelete));
    setMessage("Dispatch item deleted.");
  };

  const saveDispatch = () => {
    if (!items.length) {
      setMessage("Add at least one dispatch item before saving.");
      return;
    }
    // Prepare payload
    const payload = {
      society: form.society || "ALL",
      date: form.date,
      remarks: form.remarks,
      items,
    };

    createDispatch(payload)
      .then((res) => {
        if (form.society === "ALL") setMessage("Dispatch saved for All Societies.");
        else setMessage(`Dispatch saved for ${form.society}.`);
      })
      .catch((err) => setMessage(err?.message || "Failed to save dispatch"));
  };

  return (
    <div className="module-page text-[#1F2A44]">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={saveDispatch}
          className="rounded-lg bg-[#1E4B6B] px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_18px_rgba(30,75,107,0.22)] hover:bg-[#163A54]"
        >
          Save Dispatch
        </button>
      </div>
      {message && (
        <div className="rounded-lg border border-[#D7E4FF] bg-white px-4 py-3 text-sm font-semibold text-[#1E4B6B] shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <section className="rounded-lg border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">Dispatch Details</h2>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-[#1E4B6B]">
                Society <span className="text-red-500">*</span>
              </span>
              <select value={form.society} onChange={(event) => updateForm("society", event.target.value)} className="mt-2 w-full rounded-lg border border-[#D7E4FF] bg-white px-3 py-2.5 text-sm font-medium text-[#1F2A44] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]">
                <option value="ALL">All Societies</option>
                {societies.length ? (
                  societies.map((s) => (
                    <option key={s.societyId} value={`${s.societyId} - ${s.societyName}`}>
                      {`${s.societyId} - ${s.societyName}`}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="S001 - Ballari Dairy">S001 - Ballari Dairy</option>
                    <option value="S014 - Siruguppa">S014 - Siruguppa</option>
                    <option value="S032 - Hospet">S032 - Hospet</option>
                    <option value="S005 - Koppal">S005 - Koppal</option>
                  </>
                )}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#1E4B6B]">
                Dispatch Date <span className="text-red-500">*</span>
              </span>
              <div className="relative mt-2">
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => updateForm("date", event.target.value)}
                  className="w-full rounded-lg border border-[#D7E4FF] bg-white px-3 py-2.5 pr-11 text-sm font-medium text-[#1F2A44] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]"
                />
                <CalendarDays className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1E4B6B]" />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#1E4B6B]">Remarks</span>
              <textarea
                placeholder="Optional"
                value={form.remarks}
                onChange={(event) => updateForm("remarks", event.target.value)}
                rows={2}
                className="mt-2 w-full resize-none rounded-lg border border-[#D7E4FF] bg-white px-3 py-2.5 text-sm font-medium text-[#1F2A44] placeholder:text-[#8A96A8] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]"
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-[#D7E4FF] bg-white p-5 shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
          <h2 className="text-lg font-semibold text-[#1E4B6B]">Product Details</h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-[#1E4B6B]">
                Product <span className="text-red-500">*</span>
              </span>
              <select value={form.product} onChange={(event) => updateForm("product", event.target.value)} className="mt-2 w-full rounded-lg border border-[#D7E4FF] bg-white px-3 py-2.5 text-sm font-medium text-[#1F2A44] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]">
                {products.map((item) => (
                  <option key={item.product}>{item.product}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#1E4B6B]">Unit</span>
              <input value={form.unit} readOnly className="mt-2 w-full rounded-lg border border-[#D7E4FF] bg-[#F7FAFF] px-3 py-2.5 text-sm font-medium text-[#1F2A44] shadow-sm" />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#1E4B6B]">
                Rate (Rs) <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={formatCurrency(form.rate)}
                readOnly
                className="mt-2 w-full rounded-lg border border-[#D7E4FF] bg-white px-3 py-2.5 text-sm font-medium text-[#1F2A44] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#1E4B6B]">
                Quantity <span className="text-red-500">*</span>
              </span>
              <input
                type="number"
                value={form.quantity}
                onChange={(event) => updateForm("quantity", event.target.value)}
                className="mt-2 w-full rounded-lg border border-[#D7E4FF] bg-white px-3 py-2.5 text-sm font-medium text-[#1F2A44] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E4B6B]"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-[#1E4B6B]">Total Amount (Rs)</span>
            <input
              type="text"
              value={formatCurrency(formAmount)}
              readOnly
              className="mt-2 w-full rounded-lg border border-[#D7E4FF] bg-[#F2F7FF] px-4 py-3 text-2xl font-semibold text-[#1E4B6B] shadow-inner"
            />
          </label>
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={addItem} className="rounded-lg border border-[#1E4B6B] bg-white px-4 py-2 text-sm font-semibold text-[#1E4B6B] hover:bg-[#F7FAFF]">
              Add Item
            </button>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-[#D7E4FF] bg-white shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <h2 className="px-5 py-4 text-lg font-semibold text-[#1E4B6B]">Dispatch Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-y border-[#D7E4FF] bg-[#F7FAFF] text-[#1E4B6B]">
              <tr>
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Unit</th>
                <th className="px-5 py-3 font-semibold">Rate (Rs)</th>
                <th className="px-5 py-3 font-semibold">Quantity</th>
                <th className="px-5 py-3 font-semibold">Amount (Rs)</th>
                <th className="px-5 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? (
                items.map((item, index) => (
                  <tr key={`${item.product}-${index}`} className="border-b border-[#EEF3FB]">
                    <td className="px-5 py-3 font-semibold text-[#1E4B6B]">{item.product}</td>
                    <td className="px-5 py-3 text-[#1F2A44]">{item.unit}</td>
                    <td className="px-5 py-3 text-[#1F2A44]">{formatCurrency(item.rate)}</td>
                    <td className="px-5 py-3 text-[#1F2A44]">{item.quantity}</td>
                    <td className="px-5 py-3 text-[#1F2A44]">{formatCurrency(Number(item.rate || 0) * Number(item.quantity || 0))}</td>
                    <td className="px-5 py-3 text-center">
                      <button type="button" onClick={() => deleteItem(index)} className="rounded p-1 text-[#1E4B6B] hover:bg-red-50 hover:text-red-600" aria-label="Delete dispatch item">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-4 text-[#5B6B7F]" colSpan={6}>No dispatch items added.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end px-5 py-5">
          <div className="flex min-w-[320px] items-center justify-between rounded-lg border border-[#D7E4FF] bg-[#F2F7FF] px-5 py-3 text-[#1E4B6B] shadow-inner">
            <span className="text-base font-semibold">Total Amount</span>
            <span className="text-xl font-semibold">Rs {formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
