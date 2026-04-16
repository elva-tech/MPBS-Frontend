import { useEffect, useState } from "react";
import { createRequest, listMyRequests, uploadComplaintFile } from "../../utils/api";
import {
  filterComplaintsForPortal,
  getComplaintSubmitterName,
} from "../../utils/complaints";

export default function Complaints() {
  const accountUsername = localStorage.getItem("society_name") || "Society User";
  const [societyName, setSocietyName] = useState(accountUsername);
  const userId = localStorage.getItem("society_user_id") || "";
  const [complaintText, setComplaintText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    loadMyComplaints();

    const intervalId = setInterval(() => {
      loadMyComplaints();
    }, 8000);

    const onFocus = () => loadMyComplaints();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const loadMyComplaints = async () => {
    setHistoryLoading(true);
    setFetchError("");

    try {
      const res = await listMyRequests({ type: "complaint" });
      const ownComplaints = filterComplaintsForPortal(res?.data, {
        role: "Society",
        userId,
        username: accountUsername,
      });

      setComplaints(ownComplaints);
    } catch (error) {
      setFetchError(error.message || "Failed to load complaints");
      setComplaints([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let uploaded = null;
      if (attachment) {
        try {
          uploaded = await uploadComplaintFile(attachment);
        } catch (uploadError) {
          throw new Error(uploadError?.message || "Failed to upload attachment");
        }
      }

      await createRequest({
        type: "complaint",
        userId,
        username: accountUsername,
        role: "Society",
        societyName,
        message: complaintText,
        attachmentName: uploaded?.name || attachment?.name || "",
        attachmentUrl: uploaded?.url || "",
      });

      alert("Complaint submitted successfully");
      setComplaintText("");
      setAttachment(null);
      loadMyComplaints();
    } catch (error) {
      alert(error.message || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8F6F2] p-6 text-[#1F2A44]">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#1F2A44]">Complaints</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="societyName"
                className="mb-2 block text-sm font-semibold text-[#1F2A44]"
              >
                Society Name
              </label>
              <input
                id="societyName"
                type="text"
                value={societyName}
                onChange={(e) => setSocietyName(e.target.value)}
                className="w-full rounded-lg border border-[#D6DCE5] bg-white px-3 py-2.5 text-sm text-[#1F2A44] outline-none focus:border-[#1E4B6B]"
                required
              />
            </div>

            <div>
              <label
                htmlFor="complaintText"
                className="mb-2 block text-sm font-semibold text-[#1F2A44]"
              >
                Complaint
              </label>
              <textarea
                id="complaintText"
                rows={5}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                className="w-full rounded-lg border border-[#D6DCE5] bg-white px-3 py-2.5 text-sm text-[#1F2A44] outline-none focus:border-[#1E4B6B]"
                placeholder="Write your complaint here"
                required
              />
            </div>

            <div>
              <label
                htmlFor="attachment"
                className="mb-2 block text-sm font-semibold text-[#1F2A44]"
              >
                Attach File (PDF, JPG, JPEG, PNG)
              </label>
              <div className="flex w-full items-center justify-between rounded-lg border border-[#D6DCE5] bg-white px-3 py-2.5 text-sm">
                <span className="truncate text-[#6B7280]">
                  {attachment ? attachment.name : "No file chosen"}
                </span>
                <label
                  htmlFor="attachment"
                  className="ml-3 cursor-pointer rounded-md bg-[#EAF1FF] px-3 py-1.5 text-xs font-semibold text-[#1E4B6B] hover:bg-[#dbe8ff]"
                >
                  Choose File
                </label>
              </div>
              <input
                id="attachment"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="hidden"
              />
              {attachment && (
                <p className="mt-2 text-xs text-[#6B7280]">Selected: {attachment.name}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#1E4B6B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#163A53] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1F2A44]">Submitted Complaints</h2>
            <button
              onClick={loadMyComplaints}
              className="rounded-md border border-[#D6DCE5] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E4B6B] hover:bg-[#F1F5F9]"
            >
              Refresh
            </button>
          </div>

          {fetchError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {fetchError}
            </div>
          )}

          {historyLoading ? (
            <p className="text-sm text-[#5B6B7F]">Loading complaints...</p>
          ) : complaints.length === 0 ? (
            <p className="text-sm text-[#5B6B7F]">No complaints submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {complaints.map((item) => (
                <div
                  key={item._id || item.id}
                  className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1F2A44]">
                      {getComplaintSubmitterName(item)}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        (item.status || "pending") === "approved"
                          ? "bg-green-100 text-green-700"
                          : (item.status || "pending") === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status || "pending"}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-[#1F2A44]">{item.message || "-"}</p>
                  <p className="text-xs text-[#6B7280]">
                    {new Date(item.createdAt || Date.now()).toLocaleString()}
                  </p>

                  {(item.status || "pending") !== "pending" && (
                    <div
                      className={`mt-2 rounded-md border px-3 py-2 text-sm ${
                        (item.status || "pending") === "approved"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-red-200 bg-red-50 text-red-700"
                      }`}
                    >
                      <p className="font-semibold">
                        Status: {(item.status || "pending") === "approved" ? "Approved" : "Rejected"}
                      </p>
                      <p className="mt-1 text-[#1F2A44]">Reason: {item.adminActionReason || "N/A"}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
