import { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmVariant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === "danger";

  return (
    <div
      className="modal-backdrop"
      onClick={() => !loading && onCancel()}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(16, 27, 51, 0.65)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: 16,
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface, #ffffff)",
          border: "1px solid var(--border, #e5e1d6)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 12px 36px rgba(0,0,0,0.2)",
          textAlign: "left",
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>
          {title}
        </h3>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--ink-soft, #5b6478)",
            marginBottom: 20,
          }}
        >
          {message}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={onCancel}
            disabled={loading}
            style={{
              background: "transparent",
              border: "1px solid var(--border, #e5e1d6)",
              padding: "8px 16px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: isDanger ? "#c1493d" : "var(--ink, #16233f)",
              color: "#ffffff",
              border: "none",
              padding: "8px 18px",
              borderRadius: 6,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Processing…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
