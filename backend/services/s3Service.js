const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/s3');

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

async function getUploadPresignedUrl(s3Key, mimeType, expiresIn = 300) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: mimeType,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}

async function getDownloadPresignedUrl(s3Key, originalFilename, expiresIn = 300) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(originalFilename)}"`,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Deletes an object from S3.
 * Distinguishes IAM permission errors (e.g. AccessDenied) so the caller
 * can surface clear actionable error messages instead of generic 500s.
 */
async function deleteS3Object(s3Key) {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    }));
    return { success: true };
  } catch (err) {
    console.error(`S3 Delete error for key ${s3Key}:`, err);
    const isAccessDenied = 
      err.name === 'AccessDenied' || 
      err.Code === 'AccessDenied' || 
      err.$metadata?.httpStatusCode === 403 ||
      (err.message && err.message.toLowerCase().includes('accessdenied'));

    return {
      success: false,
      isAccessDenied,
      message: err.message,
      code: isAccessDenied ? 'S3_DELETE_PERMISSION_DENIED' : (err.name || 'S3_DELETE_ERROR'),
    };
  }
}

module.exports = {
  getUploadPresignedUrl,
  getDownloadPresignedUrl,
  deleteS3Object,
};
