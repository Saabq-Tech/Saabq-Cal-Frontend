import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon";

export default function ConfirmationModal({ modalState, onClose }) {
  const isOpen = Boolean(modalState?.isOpen);
  const isLoading = Boolean(modalState?.loading);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDanger = modalState.isDanger !== false;

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
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
              color: isDanger ? "var(--error, #ef4444)" : "var(--heading)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: "1.05rem",
              fontWeight: 700,
            }}
          >
            {isDanger && <Icon name="alert-triangle" size={18} />}
            {modalState.title || "تأكيد الإجراء"}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="إغلاق / Close"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.92rem",
            lineHeight: 1.6,
            marginBottom: modalState.error ? 12 : 16,
          }}
        >
          {modalState.message}
        </p>

        {modalState.error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md, 8px)",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "var(--error, #ef4444)",
              fontSize: "0.85rem",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="alert-triangle" size={16} />
            <span>{modalState.error}</span>
          </div>
        )}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {modalState.cancelText || "إلغاء"}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${isDanger ? "btn-danger" : "btn-primary"}`}
            disabled={isLoading}
            onClick={async () => {
              if (modalState.onConfirm) {
                await modalState.onConfirm();
              }
              if (!modalState.keepOpenOnConfirm && !modalState.loading) {
                onClose();
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {isLoading && (
              <span
                className="animate-spin"
                style={{
                  display: "inline-block",
                  width: 13,
                  height: 13,
                  border: "2px solid #ffffff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                }}
              />
            )}
            <span>
              {modalState.confirmText || "تأكيد"}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
