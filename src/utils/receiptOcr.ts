import { createWorker } from 'tesseract.js';

export interface OcrDetectionResult {
  success: boolean;
  rawText: string;
  detectedAmount?: number;
  candidateAmounts: { amount: number; label: string; rawSnippet: string }[];
  storeName?: string;
  error?: string;
}

/**
 * Preprocess image via HTML Canvas to boost contrast and binarize for clearer receipt OCR
 */
export const preprocessReceiptCanvas = async (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1500;
      let w = img.width;
      let h = img.height;

      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageSrc);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;

      // Grayscale + Contrast Boost
      for (let i = 0; i < d.length; i += 4) {
        // Luminance
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // Contrast enhancement
        const contrast = 1.35;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
        const adjusted = factor * (gray - 128) + 128;
        const finalColor = Math.min(255, Math.max(0, adjusted));

        d[i] = finalColor;
        d[i + 1] = finalColor;
        d[i + 2] = finalColor;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};

/**
 * Parse extracted text to identify receipt total rupiah nominal and line items
 */
export const extractRupiahFromText = (text: string): {
  detectedAmount?: number;
  candidateAmounts: { amount: number; label: string; rawSnippet: string }[];
  storeName?: string;
} => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const candidates: { amount: number; label: string; rawSnippet: string }[] = [];

  // Potential store name from top 3 non-empty lines
  let storeName = '';
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const l = lines[i];
    if (l.length >= 3 && !/^\d+$/.test(l) && !l.toLowerCase().includes('nota') && !l.toLowerCase().includes('struk')) {
      storeName = l;
      break;
    }
  }

  // Regular expressions for keywords and numbers
  const totalKeywords = ['total', 'grand total', 'subtotal', 'jumlah', 'bayar', 'tunai', 'cash', 'tagihan', 'netto'];
  const numberRegex = /(?:rp\.?|idr)?\s*([0-9]{1,3}(?:[\.,][0-9]{3})*(?:[\.,][0-9]{2})?|[0-9]{4,8})/gi;

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    const hasTotalKeyword = totalKeywords.some(kw => lower.includes(kw));

    let match;
    while ((match = numberRegex.exec(line)) !== null) {
      const rawNum = match[1];
      if (!rawNum) continue;

      // Clean separators: standard Indonesian currency e.g. 45.000 or 45,000
      let cleanNum = rawNum.replace(/\s+/g, '');
      
      // If contains dot as thousands separator (e.g. 45.000)
      if (cleanNum.includes('.') && !cleanNum.includes(',')) {
        const parts = cleanNum.split('.');
        if (parts[parts.length - 1].length === 3) {
          cleanNum = cleanNum.replace(/\./g, '');
        } else if (parts[parts.length - 1].length === 2) {
          cleanNum = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
        }
      } else if (cleanNum.includes(',') && !cleanNum.includes('.')) {
        const parts = cleanNum.split(',');
        if (parts[parts.length - 1].length === 3) {
          cleanNum = cleanNum.replace(/,/g, '');
        } else if (parts[parts.length - 1].length === 2) {
          cleanNum = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
        }
      } else if (cleanNum.includes('.') && cleanNum.includes(',')) {
        // e.g. 1.250.000,00 or 1,250,000.00
        if (cleanNum.lastIndexOf(',') > cleanNum.lastIndexOf('.')) {
          cleanNum = cleanNum.replace(/\./g, '').replace(',', '.');
        } else {
          cleanNum = cleanNum.replace(/,/g, '');
        }
      }

      const parsedVal = Math.round(parseFloat(cleanNum));

      // Filter realistic receipt amounts (Rp 1.000 to Rp 50.000.000)
      if (!isNaN(parsedVal) && parsedVal >= 1000 && parsedVal <= 50000000) {
        let label = 'Nominal Terdeteksi';
        if (hasTotalKeyword) {
          label = 'Total Belanja (Kata Kunci: ' + (totalKeywords.find(k => lower.includes(k)) || 'Total').toUpperCase() + ')';
        } else if (lower.includes('rp')) {
          label = 'Format Mata Uang Rp';
        }

        // Avoid exact duplicates
        if (!candidates.some(c => c.amount === parsedVal)) {
          candidates.push({
            amount: parsedVal,
            label,
            rawSnippet: line
          });
        }
      }
    }
  });

  // Sort candidates prioritizing keyword match, then highest amount
  candidates.sort((a, b) => {
    const aIsTotal = a.label.includes('Total') || a.label.includes('JUMLAH');
    const bIsTotal = b.label.includes('Total') || b.label.includes('JUMLAH');
    if (aIsTotal && !bIsTotal) return -1;
    if (!aIsTotal && bIsTotal) return 1;
    return b.amount - a.amount;
  });

  const detectedAmount = candidates.length > 0 ? candidates[0].amount : undefined;

  return {
    detectedAmount,
    candidateAmounts: candidates,
    storeName
  };
};

/**
 * Scan receipt image using Tesseract worker
 */
export const scanReceiptOcr = async (
  imageFileOrUrl: File | string,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrDetectionResult> => {
  let objectUrl = '';
  try {
    if (imageFileOrUrl instanceof File) {
      objectUrl = URL.createObjectURL(imageFileOrUrl);
    } else {
      objectUrl = imageFileOrUrl;
    }

    onProgress?.(15, 'Mempersiapkan gambar & meningkatkan kontras...');
    const preprocessedDataUrl = await preprocessReceiptCanvas(objectUrl);

    onProgress?.(30, 'Menginisialisasi modul OCR Tesseract...');
    const worker = await createWorker('eng');

    onProgress?.(60, 'Membaca teks struk dan mendeteksi total rupiah...');
    const ret = await worker.recognize(preprocessedDataUrl);
    await worker.terminate();

    const rawText = ret.data.text || '';
    onProgress?.(90, 'Menganalisis nominal pengeluaran kas...');

    const { detectedAmount, candidateAmounts, storeName } = extractRupiahFromText(rawText);

    onProgress?.(100, 'Pemindaian selesai!');
    return {
      success: true,
      rawText,
      detectedAmount,
      candidateAmounts,
      storeName
    };
  } catch (err: any) {
    console.error('OCR Error:', err);
    return {
      success: false,
      rawText: '',
      candidateAmounts: [],
      error: err?.message || 'Gagal memindai nota secara otomatis. Anda dapat memasukkan nominal secara manual.'
    };
  } finally {
    if (imageFileOrUrl instanceof File && objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
};
