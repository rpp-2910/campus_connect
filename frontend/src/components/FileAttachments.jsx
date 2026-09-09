import { useState, useEffect } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "./ConfirmModal";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
];

function formatSize(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType) {
  if (mimeType?.includes("pdf")) return "📄 PDF";
  if (mimeType?.includes("word") || mimeType?.includes("document")) return "📝 DOCX";
  if (mimeType?.includes("presentation")) return "📊 PPTX";
  if (mimeType?.includes("image")) return "🖼️ IMG";
  return "📎 FILE";
}

export default function FileAttachments({ postId, postAuthorId }) {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const toast = useToast();

  const isOwner = Boolean(
    user && postAuthorId && (Number(user.id) === Number(postAuthorId) || user.role === 'moderator' || user.role === 'admin')
  );

  const fetchAttachments = async () => {
    try {
      const res = await client.get(`/posts/${postId}/attachments`);
      setAttachments(res.data);
    } catch {
      console.error("Failed to load attachments");
    }
  };

  useEffect(() => {
    fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");

    if (!isOwner) {
      setError("Only the post author can attach files.");
      toast.error("Only the post author can attach files.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      const msg = "Only PDF, DOCX, PPTX, PNG, or JPG files are allowed.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      const msg = "File must be under 15MB.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setUploading(true);
    try {
      const presignRes = await client.post(
        `/posts/${postId}/attachments/presign`,
        {
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        },
      );
      const { uploadUrl, s3Key } = presignRes.data;

      // Upload file directly to S3 via presigned URL
      const s3UploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!s3UploadRes.ok) {
        throw new Error(`S3 upload returned status ${s3UploadRes.status}`);
      }

      // Confirm upload metadata in backend
      const confirmRes = await client.post(`/posts/${postId}/attachments`, {
        s3Key,
        originalFilename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });

      setAttachments((prev) => [confirmRes.data, ...prev]);
      toast.success("File uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      const msg = err.response?.data?.error || "Upload failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownload = async (attachmentId, originalFilename) => {
    try {
      const res = await client.get(
        `/posts/${postId}/attachments/${attachmentId}/download`,
      );
      window.open(res.data.downloadUrl, "_blank");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Could not get download link.");
    }
  };

  const confirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return;
    setDeletingId(attachmentToDelete.id);
    setError("");

    try {
      await client.delete(`/posts/${postId}/attachments/${attachmentToDelete.id}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentToDelete.id));
      toast.success("Attachment deleted successfully");
      setAttachmentToDelete(null);
    } catch (err) {
      console.error("Delete attachment failed:", err);
      const code = err.response?.data?.code;
      const msg = err.response?.data?.error || "Failed to delete attachment.";
      if (code === "S3_DELETE_PERMISSION_DENIED") {
        setError("AWS S3 Permission Error: s3:DeleteObject is not granted to server IAM credentials. File record was retained.");
      } else {
        setError(msg);
      }
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="card"
      style={{ padding: 20, marginBottom: 24, textAlign: "left" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h4 style={{ margin: 0 }}>Attachments ({attachments.length})</h4>

        {isOwner && (
          <label
            className="badge"
            style={{
              cursor: uploading ? "wait" : "pointer",
              "--tab-color": "var(--ink)",
              "--tab-color-bg": "transparent",
              border: "1px solid var(--ink-soft)",
              padding: "4px 10px",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            {uploading ? "Uploading…" : "+ Add file"}
            <input
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: "none" }}
              accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
            />
          </label>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: "8px 12px",
            background: "rgba(193, 73, 61, 0.1)",
            border: "1px solid rgba(193, 73, 61, 0.3)",
            borderRadius: 6,
            color: "#c0392b",
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {attachments.length === 0 && !uploading && (
        <p className="muted" style={{ fontSize: 13 }}>
          No files attached to this post.
        </p>
      )}

      {attachments.map((a) => (
        <div
          key={a.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
            borderTop: "1px solid var(--border-soft)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                background: "var(--paper)",
                padding: "2px 6px",
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
            >
              {getFileIcon(a.mime_type)}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {a.original_filename}
            </span>
            <span style={{ color: "var(--ink-faint)", fontSize: 12, flexShrink: 0 }}>
              ({formatSize(a.size_bytes)})
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <button
              onClick={() => handleDownload(a.id, a.original_filename)}
              style={{
                fontSize: 13,
                background: "none",
                border: "none",
                color: "var(--gold-dark)",
                fontWeight: 600,
                cursor: "pointer",
                padding: "2px 6px",
              }}
            >
              Download
            </button>

            {isOwner && (
              <button
                onClick={() => setAttachmentToDelete(a)}
                disabled={deletingId === a.id}
                style={{
                  fontSize: 12.5,
                  background: "none",
                  border: "none",
                  color: "#c1493d",
                  cursor: deletingId === a.id ? "wait" : "pointer",
                  padding: "2px 6px",
                  opacity: deletingId === a.id ? 0.5 : 0.85,
                }}
                title="Delete attachment"
              >
                {deletingId === a.id ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Attachment Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(attachmentToDelete)}
        title="Delete Attachment"
        message={
          attachmentToDelete
            ? `Are you sure you want to permanently delete "${attachmentToDelete.original_filename}"? This file will be removed from cloud storage immediately.`
            : ""
        }
        confirmText="Delete File"
        confirmVariant="danger"
        loading={Boolean(deletingId)}
        onConfirm={confirmDeleteAttachment}
        onCancel={() => setAttachmentToDelete(null)}
      />
    </div>
  );
}
