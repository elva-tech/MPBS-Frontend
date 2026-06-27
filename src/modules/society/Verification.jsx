import { useState, useEffect } from "react";
import { getMilkEntries } from "../../utils/api";

export default function SocietyVerification() {
  const username = localStorage.getItem("society_name") || localStorage.getItem("society_id");
  const societyId = localStorage.getItem("society_id") || localStorage.getItem("society_name");
  const avatarLetter = username ? username.charAt(0).toUpperCase() : "";

  const [milkEntries, setMilkEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState("M");

  useEffect(() => {
    async function loadMilkData() {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];
        const response = await getMilkEntries({
          societyId,
          date: today,
        });
        setMilkEntries(response?.data?.milkEntries || []);
      } catch (err) {
        console.error("Error loading milk entries:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (societyId) {
      loadMilkData();
    }
  }, [societyId]);

  const sessionEntries = milkEntries.filter((e) => e.session === selectedSession);
  const totalQty = sessionEntries.reduce((sum, e) => sum + (Number(e.qty) || 0), 0);
  const totalAmount = sessionEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="min-h-screen bg-[#F6F8FC] p-6 text-[#23324A]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <svg width="28" height="22" viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 6c6 7 10 13 10 18a10 10 0 1 1-20 0c0-5 4-11 10-18Z" fill="#B6C2CB" />
            <path d="M16 44a10 10 0 0 1-10-10c0-5 4-11 10-18 6 7 10 13 10 18a10 10 0 0 1-10 10Z" fill="#1E4B6B" />
            <path d="M40 44a10 10 0 0 1-10-10c0-5 4-11 10-18 6 7 10 13 10 18a10 10 0 0 1-10 10Z" fill="#1E4B6B" />
          </svg>
          <h1 className="text-[18px] font-semibold">Verification</h1>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#1E4B6B]">
          {username && (
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
              />
            </svg>
          )}
          {username && <span>{username}</span>}
          {username && (
            <div className="h-7 w-7 rounded border border-[#CBD7E6] bg-white grid place-items-center text-[11px] font-semibold text-[#1E4B6B]">
              {avatarLetter}
            </div>
          )}
        </div>
      </div>

      {/* Society Selection and Session Toggle */}
      <div className="bg-white rounded-lg border border-[#E6EAF2] p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <label className="text-sm font-semibold text-[#5F6F85] block mb-2">Your Society</label>
            <div className="text-lg font-semibold text-[#1E4B6B]">{username || "N/A"}</div>
            <div className="text-xs text-[#6A7C92]">ID: {societyId || "N/A"}</div>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#5F6F85] block mb-2">Session</label>
            <div className="flex gap-2">
              {[
                { value: "M", label: "Morning" },
                { value: "E", label: "Evening" },
              ].map((session) => (
                <button
                  key={session.value}
                  onClick={() => setSelectedSession(session.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedSession === session.value
                      ? "bg-[#1E4B6B] text-white"
                      : "bg-[#EEF4FC] text-[#1E4B6B] border border-[#DEE7F4]"
                  }`}
                >
                  {session.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Milk Entries Summary */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E4B6B]"></div>
          <p className="mt-4 text-[#5B6B7F]">Loading milk entries...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error: {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E6EAF2] overflow-hidden">
          <div className="bg-[#F9FCFF] px-6 py-4 border-b border-[#E6EAF2]">
            <h2 className="text-lg font-semibold text-[#1E4B6B]">
              {selectedSession === "M" ? "Morning" : "Evening"} Session Entries
            </h2>
          </div>

          {sessionEntries.length === 0 ? (
            <div className="px-6 py-12 text-center text-[#6A7C92]">
              No entries for {selectedSession === "M" ? "morning" : "evening"} session today
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#EEF4FC] border-b border-[#E6EAF2]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6F85]">Milk Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6F85]">Fat %</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6F85]">SNF %</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6F85]">Quantity (L)</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6F85]">Rate (₹/L)</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6F85]">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionEntries.map((entry, idx) => (
                      <tr key={idx} className="border-b border-[#E6EAF2] hover:bg-[#F9FCFF]">
                        <td className="px-6 py-4 text-sm text-[#23324A] font-medium">{entry.milkType}</td>
                        <td className="px-6 py-4 text-sm text-[#5F6F85]">{Number(entry.fat).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-[#5F6F85]">{Number(entry.snf).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-[#5F6F85]">{Number(entry.qty).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-[#5F6F85]">{Number(entry.rate).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-[#1E4B6B]">{Number(entry.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-[#F9FCFF] border-t border-[#E6EAF2] px-6 py-4 flex justify-end gap-8">
                <div>
                  <div className="text-xs text-[#6A7C92] mb-1">Total Quantity</div>
                  <div className="text-xl font-bold text-[#1E4B6B]">{totalQty.toFixed(2)} L</div>
                </div>
                <div>
                  <div className="text-xs text-[#6A7C92] mb-1">Total Amount</div>
                  <div className="text-xl font-bold text-[#1E4B6B]">₹ {totalAmount.toFixed(2)}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-[#EAF1FF] border border-[#D0E0FF] rounded-lg p-4">
        <div className="flex gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E4B6B" strokeWidth="2" className="flex-shrink-0 mt-1">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <p className="text-sm text-[#1E4B6B]">
            These are your milk collection entries. BMC will verify and approve these entries.
          </p>
        </div>
      </div>
    </div>
  );
}

