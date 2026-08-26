import { useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "../../../../components/common/Icon";

export default function ConfirmationModal({ modalState, onClose }) {
  useEffect(() => {
    if (!modalState.isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState.isOpen, onClose]);

  if (!modalState.isOpen) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card modal-sm animate-fade-in-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3
            id="confirm-modal-title"
            className="modal-title"
            style={{
              color: modalState.isDanger
                ? "var(--error, #ef4444)"
                : "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {modalState.isDanger && <Icon name="alert-triangle" size={18} />}
            {modalState.title || "تأكيد الإجراء"}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="إغلاق / Close"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          {modalState.message}
        </p>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            {modalState.cancelText || "إلغاء"}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${modalState.isDanger ? "btn-danger" : "btn-primary"}`}
            onClick={() => {
              if (modalState.onConfirm) modalState.onConfirm();
              onClose();
            }}
          >
            {modalState.confirmText || "تأكيد"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
