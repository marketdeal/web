// Client-side photo handling for the community board — there's no backend, so an attached photo
// is resized/re-compressed in the browser and stored as a compact JPEG data URL (small enough to
// live safely in localStorage alongside everything else).

const MAX_DIMENSION = 900;
const JPEG_QUALITY = 0.72;
const MAX_SOURCE_BYTES = 10 * 1024 * 1024; // reject absurdly large source files before we even try

export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      reject(new Error('That image is too large — please pick one under 10MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
