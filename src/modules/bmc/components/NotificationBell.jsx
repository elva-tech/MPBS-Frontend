import { useEffect, useRef, useState } from "react";
import { NOTIF_STYLES } from "../utils/engine";

export default function NotificationBell({ notifs, onMarkRead, onMarkAll, onDismiss, onClearAll }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button className="bell-btn" onClick={() => setOpen((o) => !o)}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && <span className="bell-badge">{unread}</span>}
      </button>

      <div className={`notif-panel${open ? " open" : ""}`}>
        <div className="notif-head">
          <div className="notif-head-title">
            Notifications
            {unread > 0 && <span className="notif-new-badge">{unread} new</span>}
          </div>
          {unread > 0 && (
            <button className="notif-mark-all" onClick={onMarkAll}>
              Mark all read
            </button>
          )}
        </div>

        <div className="notif-list">
          {notifs.length === 0 ? (
            <div className="notif-empty">No notifications</div>
          ) : (
            notifs.map((n) => {
              const st = NOTIF_STYLES[n.type] || NOTIF_STYLES.info;
              return (
                <div key={n.id} className={`notif-item${n.read ? "" : " unread"}`} onClick={() => onMarkRead(n.id)}>
                  <div className="notif-icon-wrap" style={{ background: st.bg }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={st.color} strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d={st.path} />
                    </svg>
                  </div>
                  <div className="notif-body">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-desc">{n.desc}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                  {!n.read && <div className="notif-unread-dot" />}
                  <button
                    className="notif-dismiss"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismiss(n.id);
                    }}
                  >
                    x
                  </button>
                </div>
              );
            })
          )}
        </div>

        {notifs.length > 0 && (
          <div className="notif-footer">
            <button
              className="notif-clear"
              onClick={() => {
                onClearAll();
                setOpen(false);
              }}
            >
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
