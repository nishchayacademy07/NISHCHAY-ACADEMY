// ============================================================
// upload.js - Cloudinary Image Upload Logic
// Nishchay Academy
// ============================================================

const CLOUDINARY_CLOUD_NAME = 'dvm8zsq4i';
const CLOUDINARY_UPLOAD_PRESET = 'academy_uploads';

// Upload image file to Cloudinary and return secure URL
export async function uploadImage(file) {
  if (!file) throw new Error('No file provided.');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Image upload failed.');
  }

  const result = await response.json();
  return result.secure_url;
}
