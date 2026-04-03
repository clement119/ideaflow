/** Read a File, resize/compress to max 800px wide JPEG at 72% quality, return dataUrl + aspect ratio. */
export async function loadAndCompressImage(
  file: File,
  maxWidth = 800,
  quality = 0.72,
): Promise<{ dataUrl: string; aspectRatio: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.onload = e => {
      const src = e.target!.result as string;
      const img = new window.Image();
      img.onerror = () => reject(new Error('Image load error'));
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        const scale = Math.min(1, maxWidth / img.naturalWidth);
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', quality), aspectRatio });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

/** Open native file picker, compress the selected image, call callback with result. */
export function pickImageFile(
  onPick: (result: { dataUrl: string; aspectRatio: number }) => void,
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const result = await loadAndCompressImage(file);
      onPick(result);
    } catch (err) {
      console.error('Photo pick failed:', err);
    }
  });
  input.click();
}
