// Compresse une image avant envoi à Bedrock (limite : 5MB en base64)
// Utilise un canvas pour réduire la résolution si nécessaire

export async function compressImage(file, maxSizeBytes = 4 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Réduire les dimensions progressivement jusqu'à passer sous la limite
        let quality = 0.85;
        const maxDim = 1920;

        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const tryCompress = (q) => {
          const dataUrl = canvas.toDataURL('image/jpeg', q);
          const base64 = dataUrl.split(',')[1];
          const sizeBytes = (base64.length * 3) / 4;

          if (sizeBytes <= maxSizeBytes || q <= 0.3) {
            resolve({ dataUrl, base64 });
          } else {
            tryCompress(q - 0.1);
          }
        };

        tryCompress(quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
