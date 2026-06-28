import { createContext, useCallback, useContext, useMemo, useState } from "react";

const PopupContext = createContext(null);

function Overlay({ children, onBackdropClick }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
      onClick={onBackdropClick}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#D6DCE5] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

function typeStyles(type) {
  if (type === "error") {
    return {
      badge: "bg-red-100 text-red-700",
      button: "bg-red-600 hover:bg-red-700",
      title: "Error",
    };
  }
  if (type === "warning") {
    return {
      badge: "bg-amber-100 text-amber-800",
      button: "bg-amber-600 hover:bg-amber-700",
      title: "Warning",
    };
  }
  return {
    badge: "bg-green-100 text-green-700",
    button: "bg-[#1E4B6B] hover:bg-[#163A53]",
    title: "Success",
  };
}

function AlertModal({ title, message, type = "success", confirmLabel = "OK", onClose }) {
  const styles = typeStyles(type);

  return (
    <Overlay onBackdropClick={onClose}>
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}`}>
            {title || styles.title}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1F2A44]">{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${styles.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function ConfirmModal({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel }) {
  return (
    <Overlay onBackdropClick={onCancel}>
      <div className="p-5">
        <h3 className="text-base font-semibold text-[#1F2A44]">{title || "Confirm"}</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#5B6B7F]">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#D6DCE5] bg-white px-4 py-2 text-sm font-semibold text-[#1E4B6B] hover:bg-[#F1F5F9]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A53]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function PromptModal({
  title,
  message,
  placeholder = "",
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
}) {
  const [value, setValue] = useState("");

  return (
    <Overlay onBackdropClick={onCancel}>
      <div className="p-5">
        <h3 className="text-base font-semibold text-[#1F2A44]">{title || "Enter details"}</h3>
        {message ? (
          <p className="mt-2 text-sm leading-relaxed text-[#5B6B7F]">{message}</p>
        ) : null}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="mt-3 w-full rounded-lg border border-[#D6DCE5] px-3 py-2 text-sm text-[#1F2A44] outline-none focus:border-[#1E4B6B]"
          autoFocus
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[#D6DCE5] bg-white px-4 py-2 text-sm font-semibold text-[#1E4B6B] hover:bg-[#F1F5F9]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onSubmit(value.trim())}
            disabled={!value.trim()}
            className="rounded-md bg-[#1E4B6B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A53] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function PopupProvider({ children }) {
  const [alertState, setAlertState] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [promptState, setPromptState] = useState(null);

  const showPopup = useCallback(
    ({ message, type = "success", title, confirmLabel = "OK" } = {}) =>
      new Promise((resolve) => {
        if (!message) {
          resolve();
          return;
        }
        setAlertState({
          message,
          type,
          title,
          confirmLabel,
          onClose: () => {
            setAlertState(null);
            resolve();
          },
        });
      }),
    []
  );

  const showConfirm = useCallback(
    ({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel" } = {}) =>
      new Promise((resolve) => {
        setConfirmState({
          title,
          message,
          confirmLabel,
          cancelLabel,
          onConfirm: () => {
            setConfirmState(null);
            resolve(true);
          },
          onCancel: () => {
            setConfirmState(null);
            resolve(false);
          },
        });
      }),
    []
  );

  const showPrompt = useCallback(
    ({ title, message, placeholder = "", submitLabel = "Submit", cancelLabel = "Cancel" } = {}) =>
      new Promise((resolve) => {
        setPromptState({
          title,
          message,
          placeholder,
          submitLabel,
          cancelLabel,
          onSubmit: (value) => {
            setPromptState(null);
            resolve(value || null);
          },
          onCancel: () => {
            setPromptState(null);
            resolve(null);
          },
        });
      }),
    []
  );

  const value = useMemo(
    () => ({ showPopup, showConfirm, showPrompt }),
    [showPopup, showConfirm, showPrompt]
  );

  return (
    <PopupContext.Provider value={value}>
      {children}
      {alertState ? <AlertModal {...alertState} /> : null}
      {confirmState ? <ConfirmModal {...confirmState} /> : null}
      {promptState ? <PromptModal {...promptState} /> : null}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within PopupProvider");
  }
  return context;
}
