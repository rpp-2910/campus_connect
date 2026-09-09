const crypto = require('crypto');
const pool = require('../config/db');
const { getUploadPresignedUrl, getDownloadPresignedUrl, deleteS3Object } = require('../services/s3Service');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'image/png',
  'image/jpeg',
];
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

// 1. Request presigned URL to upload file — restricted to post author
async function presignAttachment(req, res) {
  try {
    const { id } = req.params; // post id
    const { filename, mimeType, sizeBytes } = req.body;
    const user_id = req.user.id;

    if (!filename || !mimeType || !sizeBytes) {
      return res.status(400).json({ error: "filename, mimeType, and sizeBytes are required" });
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: "File type not allowed. Supported formats: PDF, DOCX, PPTX, PNG, JPEG." });
    }

    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({ error: "File too large. Maximum allowed size is 15MB." });
    }

    const postCheck = await pool.query('SELECT id, user_id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Restrict upload to post owner
    if (postCheck.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: "Forbidden — only the post author can attach files to this post" });
    }

    // Clean filename to prevent path traversal
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueKey = `posts/${id}/${crypto.randomUUID()}-${safeFilename}`;

    const uploadUrl = await getUploadPresignedUrl(uniqueKey, mimeType);

    res.json({ uploadUrl, s3Key: uniqueKey });
  } catch (err) {
    console.error("Presign attachment failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// 2. Confirm upload succeeded — save metadata row — restricted to post author
async function confirmAttachment(req, res) {
  try {
    const { id } = req.params; // post id
    const { s3Key, originalFilename, mimeType, sizeBytes } = req.body;
    const uploader_id = req.user.id;

    if (!s3Key || !originalFilename || !mimeType || !sizeBytes) {
      return res.status(400).json({ error: "s3Key, originalFilename, mimeType, and sizeBytes are required" });
    }

    const postCheck = await pool.query('SELECT id, user_id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Restrict confirmation to post owner
    if (postCheck.rows[0].user_id !== uploader_id) {
      return res.status(403).json({ error: "Forbidden — only the post author can attach files" });
    }

    const result = await pool.query(
      `INSERT INTO post_attachments (post_id, uploader_id, s3_key, original_filename, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, uploader_id, s3Key, originalFilename, mimeType, sizeBytes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Confirm attachment failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// 3. Get all attachments for a post
async function getAttachments(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, post_id, uploader_id, original_filename, mime_type, size_bytes, uploaded_at
       FROM post_attachments 
       WHERE post_id = $1 
       ORDER BY uploaded_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get attachments failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// 4. Get presigned download URL for one attachment
async function downloadAttachment(req, res) {
  try {
    const { attachmentId } = req.params;

    const result = await pool.query(
      `SELECT s3_key, original_filename FROM post_attachments WHERE id = $1`,
      [attachmentId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    const { s3_key, original_filename } = result.rows[0];
    const downloadUrl = await getDownloadPresignedUrl(s3_key, original_filename);

    res.json({ downloadUrl });
  } catch (err) {
    console.error("Download attachment failed:", err);
    res.status(500).json({ error: err.message });
  }
}

// 5. Delete an attachment (verify JWT -> verify requester owns parent post -> delete S3 object -> delete DB row)
async function deleteAttachment(req, res) {
  try {
    const { postId, attachmentId } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role || 'student';

    // Verify attachment exists and get parent post owner
    const attResult = await pool.query(
      `SELECT a.id, a.post_id, a.s3_key, a.original_filename, p.user_id AS post_author_id
       FROM post_attachments a
       JOIN posts p ON a.post_id = p.id
       WHERE a.id = $1 AND a.post_id = $2`,
      [attachmentId, postId]
    );

    if (attResult.rows.length === 0) {
      return res.status(404).json({ error: "Attachment not found for this post" });
    }

    const attachment = attResult.rows[0];
    const isOwner = attachment.post_author_id === user_id;
    const isModerator = user_role === 'moderator' || user_role === 'admin';

    if (!isOwner && !isModerator) {
      return res.status(403).json({ error: "Forbidden — only the post author can delete this attachment" });
    }

    // Attempt S3 deletion
    const s3DeleteResult = await deleteS3Object(attachment.s3_key);

    if (!s3DeleteResult.success) {
      if (s3DeleteResult.isAccessDenied) {
        return res.status(502).json({
          error: "AWS S3 DeleteObject AccessDenied: s3:DeleteObject permission is not granted to server IAM credentials. File record was retained.",
          code: "S3_DELETE_PERMISSION_DENIED",
          details: s3DeleteResult.message,
        });
      }

      return res.status(502).json({
        error: `Failed to delete file from cloud storage: ${s3DeleteResult.message}`,
        code: s3DeleteResult.code,
      });
    }

    // S3 deletion succeeded — now safely remove DB record
    await pool.query('DELETE FROM post_attachments WHERE id = $1', [attachmentId]);

    res.json({
      message: "Attachment deleted successfully",
      attachmentId: Number(attachmentId),
    });
  } catch (err) {
    console.error("Delete attachment failed:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  presignAttachment,
  confirmAttachment,
  getAttachments,
  downloadAttachment,
  deleteAttachment,
};
