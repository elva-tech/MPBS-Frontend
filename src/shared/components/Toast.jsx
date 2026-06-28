import { usePopup } from "../context/PopupContext";
import { useEffect, useRef } from "react";

export default function Toast({ message, type = "success", onClose, duration = 4000 }) {
  const { showPopup } = usePopup();
  const lastMessage = useRef("");

  useEffect(() => {
    if (!message || message === lastMessage.current) return undefined;
    lastMessage.current = message;

    showPopup({ message, type }).then(() => {
      lastMessage.current = "";
      onClose?.();
    });

    const timer = setTimeout(() => {
      lastMessage.current = "";
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, type, duration, onClose, showPopup]);

  return null;
}
