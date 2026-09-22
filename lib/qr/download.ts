/** Trigger a browser download of an SVG string. Client-side only. */
export function downloadSvgFile(svgMarkup: string, filename: string): void {
  const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Rasterize an SVG string to a PNG download at the given pixel size.
 * Uses an Image + canvas — fine for QR stickers (no external resources
 * inside the SVG).
 *
 * Rejects when rasterization or PNG encoding fails (e.g. the browser blocks
 * the blob-backed image load), so the caller can surface the failure instead
 * of the download button appearing silently dead.
 */
export function downloadSvgAsPng(svgMarkup: string, filename: string, sizePx = 1024): Promise<void> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    function cleanup() {
      URL.revokeObjectURL(url);
    }

    img.onerror = () => {
      cleanup();
      reject(new Error("The image couldn't be rasterized in this browser."));
    };
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Square QR assets; the aspect is preserved for non-square SVGs.
        const ratio = img.width && img.height ? img.height / img.width : 1;
        canvas.width = sizePx;
        canvas.height = Math.round(sizePx * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("Canvas isn't available in this browser."));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        cleanup();
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            reject(new Error("PNG encoding failed in this browser."));
            return;
          }
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `${filename}.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(pngUrl);
          resolve();
        }, "image/png");
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.src = url;
  });
}

export function vehicleFileName(vehicleName: string, suffix?: string): string {
  const base = vehicleName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return suffix ? `pingmycar-${base}-${suffix}` : `pingmycar-${base}`;
}
