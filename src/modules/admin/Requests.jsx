import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listRequests, updateRequest } from "../../utils/api";

function isImageAttachment(url, name) {
  const target = `${name || ""} ${url || ""}`.toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$|\s)/i.test(target);
}

function isPdfAttachment(url, name) {
  const target = `${name || ""} ${url || ""}`.toLowerCase();
  return /\.pdf(\?|$|\s)/i.test(target);
}

export default function Requests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeAction, setActiveAction] = useState({});
  const [actionReason, setActionReason] = useState({});
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    loadRequests();

    const intervalId = setInterval(() => {
      loadRequests({ silent: true });
    }, 8000);

    const onFocus = () => loadRequests({ silent: true });
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const loadRequests = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await listRequests({ type: "complaint" });
      setRequests(res?.data || []);
      setError("");
    } catch (err) {
      const message = err?.message || "Failed to load requests";
      const unauthorized =
        /forbidden|missing token|invalid token|unauthorized/i.test(message);

      if (unauthorized) {
        localStorage.removeItem("admin_auth");
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("user_id");
        navigate("/admin/login", { replace: true });
        return;
      }

      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleApprove = async (reqId) => {
    const reason = (actionReason[reqId] || "").trim();
    if (!reason) {
      alert("Please enter reason for approval");
      return;
    }
    try {
        console.log("[Admin] Approving request:", reqId, "with reason:", reason);
      await updateRequest(reqId, { status: "approved", adminActionReason: reason });
        console.log("[Admin] Request approved successfully");
      alert("Request approved");
      setActiveAction((prev) => ({ ...prev, [reqId]: null }));
      setActionReason((prev) => ({ ...prev, [reqId]: "" }));
      await loadRequests();
    } catch (err) {
        console.error("[Admin] Approval error:", err);
      setError(err.message || "Failed to update request");
    }
  };

  const handleReject = async (reqId) => {
    const reason = (actionReason[reqId] || "").trim();
    if (!reason) {
      alert("Please enter reason for rejection");
      return;
    }
    try {
        console.log("[Admin] Rejecting request:", reqId, "with reason:", reason);
      await updateRequest(reqId, { status: "rejected", adminActionReason: reason });
        console.log("[Admin] Request rejected successfully");
      alert("Request rejected");
      setActiveAction((prev) => ({ ...prev, [reqId]: null }));
      setActionReason((prev) => ({ ...prev, [reqId]: "" }));
      await loadRequests();
    } catch (err) {
        console.error("[Admin] Rejection error:", err);
      setError(err.message || "Failed to update request");
    }
  };

  const handlePreviewAttachment = (attachmentUrl, attachmentName) => {
    if (!attachmentUrl) return;
    setPreviewFile({
      url: attachmentUrl,
      name: attachmentName || "Attachment",
      isImage: isImageAttachment(attachmentUrl, attachmentName),
      isPdf: isPdfAttachment(attachmentUrl, attachmentName),
    });
  };

  return (
    <div className="min-h-full bg-[#F8F6F2] p-6 text-[#1F2A44]">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1F2A44]">Admin Requests</h1>
        <button
          onClick={loadRequests}
          className="rounded-md border border-[#D6DCE5] bg-white px-3 py-1.5 text-sm font-semibold text-[#1E4B6B] hover:bg-[#F1F5F9]"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-sm text-[#5B6B7F]">
          Loading requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-sm text-[#5B6B7F]">
          No requests found
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id || req.id}
              className="rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[#1F2A44]">
                    {req.username || req.userId || "User"}
                  </p>
                  <p className="text-sm text-[#5B6B7F]">
                    Source: {req.role || "N/A"} • Type: {req.type}
                  </p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {new Date(req.createdAt || req.requestedAt || Date.now()).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    (req.status || "pending") === "approved"
                      ? "bg-green-100 text-green-700"
                      : (req.status || "pending") === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {req.status || "pending"}
                </span>
              </div>

              {req.type === "complaint" ? (
                <div className="mb-4 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm text-[#1F2A44]">
                  <p className="mb-1">
                    <span className="font-semibold">Society Name:</span> {req.societyName || "N/A"}
                  </p>
                  <p className="mb-1 break-words">
                    <span className="font-semibold">Complaint:</span> {req.message || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Attachment:</span>{" "}
                    <span className="inline-flex items-center gap-2">
                      <button
                        onClick={() =>
                          req.attachmentUrl
                            ? handlePreviewAttachment(req.attachmentUrl, req.attachmentName)
                            : null
                        }
                        disabled={!req.attachmentUrl}
                        className="rounded-md border border-[#D6DCE5] bg-white px-2.5 py-1 text-xs font-semibold text-[#1E4B6B] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        View
                      </button>
                      {!req.attachmentUrl && (
                        <span className="text-xs text-[#6B7280]">
                          {req.attachmentName ? `${req.attachmentName} (file unavailable)` : "N/A"}
                        </span>
                      )}
                    </span>
                  </p>
                </div>
              ) : (
                req.message && (
                  <p className="mb-4 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm text-[#1F2A44]">
                    {req.message}
                  </p>
                )
              )}

              {(req.status || "pending") === "pending" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setActiveAction((prev) => ({
                          ...prev,
                          [req._id || req.id]: "approve",
                        }))
                      }
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        setActiveAction((prev) => ({
                          ...prev,
                          [req._id || req.id]: "reject",
                        }))
                      }
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>

                  {(activeAction[req._id || req.id] === "approve" ||
                    activeAction[req._id || req.id] === "reject") && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={actionReason[req._id || req.id] || ""}
                        onChange={(e) =>
                          setActionReason((prev) => ({
                            ...prev,
                            [req._id || req.id]: e.target.value,
                          }))
                        }
                        placeholder={
                          activeAction[req._id || req.id] === "approve"
                            ? "Reason for approval"
                            : "Reason for rejection"
                        }
                        className="w-64 rounded-md border border-[#D6DCE5] px-3 py-1.5 text-sm outline-none focus:border-[#1E4B6B]"
                      />
                      <button
                        onClick={() =>
                          activeAction[req._id || req.id] === "approve"
                            ? handleApprove(req._id || req.id)
                            : handleReject(req._id || req.id)
                        }
                        className={`rounded-md px-3 py-1.5 text-sm font-semibold text-white ${
                          activeAction[req._id || req.id] === "approve"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        Submit
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(req.status || "pending") !== "pending" && (
                <div
                  className={`mt-3 rounded-md border px-3 py-2 text-sm ${
                    (req.status || "pending") === "approved"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {(req.status || "pending") === "approved" ? (
                    <div>
                      <p>Complaint approved successfully.</p>
                      {req.adminActionReason && <p className="mt-1 text-[#1F2A44]">Reason: {req.adminActionReason}</p>}
                    </div>
                  ) : (
                    <div>
                      <p>Complaint rejected.</p>
                      {req.adminActionReason && <p className="mt-1 text-[#1F2A44]">Reason: {req.adminActionReason}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
              <h2 className="truncate text-base font-semibold text-[#1F2A44]">
                {previewFile.name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewFile(null)}
                  className="rounded-md bg-[#1E4B6B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#163A53]"
                >
                  Close
                </button>
              </div>
            </div>
            {previewFile.isImage ? (
              <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC] p-4">
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : previewFile.isPdf ? (
              <iframe
                title="Complaint Attachment Preview"
                src={previewFile.url}
                className="h-full w-full bg-white"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC] p-4 text-sm text-[#5B6B7F]">
                Preview not available for this file type.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
