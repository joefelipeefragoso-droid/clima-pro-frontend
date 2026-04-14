/**
 * Converte uma imagem (possivelmente PNG transparente) para um Blob JPEG com fundo branco.
 * @param {File} file - O arquivo de imagem original.
 * @returns {Promise<Blob>} - O Blob da imagem processada (JPEG).
 */
export const flattenImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Preenche com branco
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenha a imagem por cima
        ctx.drawImage(img, 0, 0);

        // Converte para Blob (JPEG)
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
