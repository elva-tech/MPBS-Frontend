import { useState } from "react";

const MILK_TYPES = ["Cow", "Buffalo"];

export default function RateFilter() {
  const [milkType, setMilkType] = useState("");
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState("");
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchRate = async (m, f, s) => {
    if (!m || !f || !s) return;

    setLoading(true);
    setTimeout(() => {
      setRate("45.50");
      setLoading(false);
    }, 300);
  };

  return (
    <div className="bg-gray-100 p-4 rounded mb-6">
      <h2 className="font-semibold mb-4">Rate Filter</h2>

      <div className="grid grid-cols-4 gap-4">
        {/* Milk Type */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Milk Type
          </label>
          <select
            value={milkType}
            onChange={(e) => {
              setMilkType(e.target.value);
              fetchRate(e.target.value, fat, snf);
            }}
            className="w-full border p-2 rounded"
          >
            <option value="">Select</option>
            {MILK_TYPES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* FAT */}
        <div>
          <label className="block text-sm font-medium mb-1">
            FAT %
          </label>
          <input
            type="number"
            value={fat}
            onChange={(e) => {
              setFat(e.target.value);
              fetchRate(milkType, e.target.value, snf);
            }}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* SNF */}
        <div>
          <label className="block text-sm font-medium mb-1">
            SNF %
          </label>
          <input
            type="number"
            value={snf}
            onChange={(e) => {
              setSnf(e.target.value);
              fetchRate(milkType, fat, e.target.value);
            }}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Rate */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Rate
          </label>
          <input
            type="text"
            value={loading ? "Fetching..." : rate}
            disabled
            className="w-full border p-2 rounded bg-gray-200"
          />
        </div>
      </div>
    </div>
  );
}





