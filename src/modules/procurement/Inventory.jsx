import { useState } from "react";

const summaryCards = [
  { label: "Total Products", value: "28" },
  { label: "Total Stock Value", value: "Rs 48,75,000" },
  { label: "Low Stock Items", value: "6" },
  { label: "Out of Stock Items", value: "0" },
];

const stockRows = [
  { product: "Cattle Feed", opening: 1000, inward: 500, outward: 300, balance: 1200, unit: "Bag", status: "Good" },
  { product: "Mineral Mixture", opening: 4000, inward: 1500, outward: 2500, balance: 3000, unit: "Packet", status: "Good" },
  { product: "Calf Starter", opening: 1200, inward: 800, outward: 200, balance: 1800, unit: "Packet", status: "Good" },
  { product: "Bypass Fat", opening: 500, inward: 300, outward: 150, balance: 650, unit: "Packet", status: "Low Stock" },
  { product: "Veterinary Tonic", opening: 400, inward: 250, outward: 100, balance: 550, unit: "Bottle", status: "Good" },
];

const inwardRows = [
  { date: "12/05/2025", product: "Cattle Feed", qty: 500, unit: "Bag", source: "Central Store" },
  { date: "12/05/2025", product: "Mineral Mixture", qty: 1500, unit: "Packet", source: "Vendor Supply" },
  { date: "11/05/2025", product: "Calf Starter", qty: 800, unit: "Packet", source: "Central Store" },
  { date: "10/05/2025", product: "Veterinary Tonic", qty: 250, unit: "Bottle", source: "Vendor Supply" },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

export default function ProcurementInventory() {
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <div className="space-y-4 p-6 text-[#1F2A44]">
      <div className="grid grid-cols-1 overflow-hidden rounded-lg border border-[#D7E4FF] bg-white shadow-[0_4px_12px_rgba(15,41,74,0.08)] md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => (
          <div
            key={card.label}
            className={`p-5 ${index < summaryCards.length - 1 ? "border-b border-[#D7E4FF] md:border-r xl:border-b-0" : ""}`}
          >
            <p className="text-sm font-semibold text-[#1E4B6B]">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#1E4B6B]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`rounded-t-lg px-5 py-2.5 text-sm font-semibold ${
            activeTab === "summary"
              ? "bg-[#1E4B6B] text-white shadow-[0_4px_10px_rgba(30,75,107,0.22)]"
              : "border border-[#D7E4FF] bg-white text-[#1E4B6B] hover:bg-[#F7FAFF]"
          }`}
        >
          Stock Summary
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`rounded-t-lg px-5 py-2.5 text-sm font-semibold ${
            activeTab === "history"
              ? "bg-[#1E4B6B] text-white shadow-[0_4px_10px_rgba(30,75,107,0.22)]"
              : "border border-[#D7E4FF] bg-white text-[#1E4B6B] hover:bg-[#F7FAFF]"
          }`}
        >
          Stock Inward History
        </button>
      </div>

      <section className="overflow-hidden rounded-lg border border-[#D7E4FF] bg-white shadow-[0_4px_12px_rgba(15,41,74,0.08)]">
        <div className="overflow-x-auto">
          {activeTab === "summary" ? (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#D7E4FF] bg-[#F7FAFF] text-[#1E4B6B]">
              <tr>
                <th className="px-5 py-3 font-semibold">Product Name</th>
                <th className="px-5 py-3 font-semibold">Opening Stock</th>
                <th className="px-5 py-3 font-semibold">Inward</th>
                <th className="px-5 py-3 font-semibold">Outward</th>
                <th className="px-5 py-3 font-semibold">Balance</th>
                <th className="px-5 py-3 font-semibold">Unit</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {stockRows.map((row) => (
                <tr key={row.product} className="border-b border-[#EEF3FB] last:border-b-0">
                  <td className="px-5 py-3 font-semibold text-[#1E4B6B]">{row.product}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatNumber(row.opening)}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatNumber(row.inward)}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatNumber(row.outward)}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatNumber(row.balance)}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{row.unit}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                        row.status === "Good"
                          ? "bg-[#E5F7F3] text-[#087F72]"
                          : "bg-[#FFF3DC] text-[#F08A00]"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#D7E4FF] bg-[#F7FAFF] text-[#1E4B6B]">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Product Name</th>
                <th className="px-5 py-3 font-semibold">Quantity</th>
                <th className="px-5 py-3 font-semibold">Unit</th>
                <th className="px-5 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {inwardRows.map((row) => (
                <tr key={`${row.date}-${row.product}`} className="border-b border-[#EEF3FB] last:border-b-0">
                  <td className="px-5 py-3 text-[#1F2A44]">{row.date}</td>
                  <td className="px-5 py-3 font-semibold text-[#1E4B6B]">{row.product}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{formatNumber(row.qty)}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{row.unit}</td>
                  <td className="px-5 py-3 text-[#1F2A44]">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </section>
    </div>
  );
}
