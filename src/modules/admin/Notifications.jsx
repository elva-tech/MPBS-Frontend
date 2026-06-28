import { useEffect, useRef, useState } from "react";
import {
  archiveNotification,
  createNotification,
  listNotifications,
  listUsers,
  uploadNotificationFile,
} from "../../utils/api";
import { usePopup } from "../../shared/context/PopupContext";

const RECIPIENT_OPTIONS = ["All", "Society", "BMC", "EO", "Dairy"];
const COLOR_PAGE_GRADIENT = "linear-gradient(180deg,#F7FAFF 0%,#EEF4FF 100%)";
const COLOR_CARD_BG = "#F7FAFF";
const COLOR_CARD_BORDER = "#D7E4FF";
const COLOR_TEXT = "#1E4B6B";
const COLOR_MUTED = "#5B6B7F";

export default function Notifications() {
  const { showPopup, showConfirm } = usePopup();
  const [sentTo, setSentTo] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [targetUserId, setTargetUserId] = useState("__all_role__");
  const [archivingId, setArchivingId] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryError("");
      setHistoryLoading(true);
      const response = await listNotifications();
      setHistory(response?.data || []);
    } catch (error) {
      setHistoryError(error.message || "Failed to load notifications");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await listUsers();
        setUserOptions(res?.data || []);
      } catch {
        setUserOptions([]);
      }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    setTargetUserId("__all_role__");
  }, [sentTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sentTo || !message) {
      await showPopup({ message: "Please select recipient and enter message", type: "warning" });
      return;
    }

    setLoading(true);
    try {
      let fileUrl;
      if (file) {
        const upload = await uploadNotificationFile(file);
        fileUrl = upload.url;
      }
      const selectedUser = userOptions.find((u) => u._id === targetUserId);
      const payload = {
        sentToRole: sentTo,
        sentToScope: sentTo === "All" || targetUserId === "__all_role__" ? "all" : "specific",
        sentToUserId: sentTo === "All" || targetUserId === "__all_role__" ? undefined : targetUserId,
        sentToName: sentTo === "All" || targetUserId === "__all_role__" ? undefined : selectedUser?.username,
        message,
        fileUrl,
      };
      await createNotification({
        ...payload,
      });
      await showPopup({ message: "Notification sent successfully", type: "success" });
      setSentTo("");
      setTargetUserId("__all_role__");
      setMessage("");
      setFile(null);
      await loadHistory();
    } finally {
      setLoading(false);
    }
  };

  const scopedUsers = userOptions.filter(
    (user) => user.role === sentTo && user.authStatus === "Approved"
  );

  const handleArchive = async (notificationId) => {
    if (!notificationId) return;
    const confirmed = await showConfirm({ message: "Archive this notification?" });
    if (!confirmed) return;
    setArchivingId(notificationId);
    try {
      await archiveNotification(notificationId);
      await loadHistory();
    } catch (error) {
      await showPopup({ message: error.message || "Failed to archive notification", type: "error" });
    } finally {
      setArchivingId("");
    }
  };

  return (
    <div className="module-page" style={{ backgroundImage: COLOR_PAGE_GRADIENT }}>
      <div className="w-full space-y-4">
      <h1 className="text-xl font-semibold mb-1" style={{ color: COLOR_TEXT }}>Send Notification</h1>
      <p className="text-sm mb-4" style={{ color: COLOR_MUTED }}>Create and track system notifications.</p>

      <div
        className="rounded-xl border p-6 shadow-[0_8px_18px_rgba(15,41,74,0.08)]"
        style={{ background: COLOR_CARD_BG, borderColor: COLOR_CARD_BORDER }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLOR_TEXT }}>Send To *</label>
            <select
              value={sentTo}
              onChange={(e) => setSentTo(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ border: "1px solid #c6d3df", background: "#f1f6ff", color: COLOR_TEXT }}
              required
            >
              <option value="">Select Recipient</option>
              {RECIPIENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {sentTo && sentTo !== "All" && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLOR_TEXT }}>
                Choose {sentTo}
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm"
                style={{ border: "1px solid #c6d3df", background: "#f1f6ff", color: COLOR_TEXT }}
              >
                <option value="__all_role__">All {sentTo}</option>
                {scopedUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLOR_TEXT }}>Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md px-3 py-2 h-32 text-sm"
              style={{ border: "1px solid #c6d3df", background: "#f1f6ff", color: COLOR_TEXT }}
              placeholder="Enter notification message"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLOR_TEXT }}>Attachment (Optional)</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="*/*"
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{ border: "1px solid #c6d3df", background: "#f1f6ff", color: COLOR_TEXT }}
            />
            {file && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-md px-2 py-1" style={{ background: "#EEF4FF", border: "1px solid #c6d3df" }}>
                <p className="text-sm" style={{ color: COLOR_MUTED }}>Selected: {file.name}</p>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="h-5 w-5 rounded-full text-sm leading-none"
                  style={{ color: "#DC2626", border: "1px solid #FCA5A5", background: "#FEF2F2" }}
                  aria-label="Remove selected attachment"
                  title="Remove file"
                >
                  x
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md text-sm font-semibold disabled:opacity-50"
            style={{ background: "#1E4B6B", color: "#ffffff" }}
          >
            {loading ? "Sending..." : "Send Notification"}
          </button>
        </form>
      </div>

      <div
        className="rounded-xl border p-6 shadow-[0_8px_18px_rgba(15,41,74,0.08)]"
        style={{ background: COLOR_CARD_BG, borderColor: COLOR_CARD_BORDER }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: COLOR_TEXT }}>Notification History</h2>
          <button
            type="button"
            onClick={loadHistory}
            className="text-sm px-3 py-1.5 rounded-md"
            style={{ border: "1px solid #c6d3df", background: "#f1f6ff", color: COLOR_TEXT }}
          >
            Refresh
          </button>
        </div>

        {historyLoading ? (
          <div className="text-sm" style={{ color: COLOR_MUTED }}>Loading notifications...</div>
        ) : historyError ? (
          <div className="text-red-600 text-sm">{historyError}</div>
        ) : history.length === 0 ? (
          <div className="text-sm" style={{ color: COLOR_MUTED }}>No notifications sent yet.</div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item._id}
                className="border rounded-lg p-3"
                style={{ borderColor: COLOR_CARD_BORDER, background: "#EEF4FF" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold" style={{ color: COLOR_TEXT }}>
                    To: {item.sentToScope === "specific" && item.sentToName ? `${item.sentToRole} - ${item.sentToName}` : item.sentToRole === "All" ? "All Users" : `All ${item.sentToRole}`}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs" style={{ color: COLOR_MUTED }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "-"}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleArchive(item._id)}
                      disabled={archivingId === item._id}
                      className="rounded-md px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ border: "1px solid #FCA5A5", color: "#B91C1C", background: "#FEF2F2" }}
                    >
                      {archivingId === item._id ? "Archiving..." : "Archive"}
                    </button>
                  </div>
                </div>
                <div className="text-sm mt-1 whitespace-pre-wrap" style={{ color: COLOR_TEXT }}>{item.message}</div>
                {item.fileUrl && (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm hover:underline mt-2 inline-block"
                    style={{ color: "#1E4B6B" }}
                  >
                    View Attachment
                  </a>
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

