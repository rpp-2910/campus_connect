import { useState, useEffect } from "react";
import client from "../api/client";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileAttachments({ postId }) {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PDF, DOCX, PPTX, PNG, or JPG files are allowed.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("File must be under 15MB.");
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

      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      await client.post(`/posts/${postId}/attachments`, {
        s3Key,
        originalFilename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });

      await fetchAttachments();
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownload = async (attachmentId) => {
    try {
      const res = await client.get(
        `/posts/${postId}/attachments/${attachmentId}/download`,
      );
      window.open(res.data.downloadUrl, "_blank");
    } catch {
      setError("Could not get download link.");
    }
  };

  return (
    <div
      className="card"
      style={{ padding: 16, marginBottom: 20, textAlign: "left" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <h4 style={{ margin: 0 }}>Attachments ({attachments.length})</h4>
        <label
          className="badge"
          style={{
            cursor: "pointer",
            "--tab-color": "var(--ink)",
            "--tab-color-bg": "transparent",
            border: "1px solid var(--ink-soft)",
          }}
        >
          {uploading ? "Uploading…" : "+ Add file"}
          <input
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {error && (
        <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 8 }}>
          {error}
        </p>
      )}

      {attachments.length === 0 && !uploading && (
        <p className="muted" style={{ fontSize: 13 }}>
          No files shared yet.
        </p>
      )}

      {attachments.map((a) => (
        <div
          key={a.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderTop: "1px solid var(--ink-faint)",
          }}
        >
          <span style={{ fontSize: 13.5 }}>
            {a.original_filename}{" "}
            <span style={{ color: "var(--ink-faint)", fontSize: 12 }}>
              ({formatSize(a.size_bytes)})
            </span>
          </span>
          <button
            onClick={() => handleDownload(a.id)}
            style={{
              fontSize: 13,
              background: "none",
              border: "none",
              color: "var(--ink-soft)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Download
          </button>
        </div>
      ))}
    </div>
  );
}
