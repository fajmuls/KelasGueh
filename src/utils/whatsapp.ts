import { showToast } from '../components/UI/DoodleDialog.tsx';

/**
 * Normalizes Indonesian phone numbers into international WhatsApp digits (628...)
 */
export const formatWhatsAppPhone = (phone?: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

/**
 * Builds a deep-link friendly wa.me URL (works across Android, iOS, and Desktop WhatsApp)
 */
export const buildWhatsAppUrl = (message: string, phone?: string): string => {
  const encoded = encodeURIComponent(message);
  const formattedPhone = formatWhatsAppPhone(phone);
  if (formattedPhone) {
    return `https://wa.me/${formattedPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
};

/**
 * Copies text to clipboard silently using modern Clipboard API with legacy textarea fallback
 */
export const copyTextSilently = async (text: string): Promise<boolean> => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    textarea.remove();
    return ok;
  } catch {
    return false;
  }
};

/**
 * Reliable cross-platform WhatsApp launcher that survives mobile webviews & iframe popup blockers.
 * - Uses synchronous <a> anchor navigation to wa.me (deep-links to WhatsApp app on mobile)
 * - Optionally uses native Web Share Sheet when triggered without a specific phone target
 * - Automatically copies text to clipboard as a guaranteed fallback
 */
export const openWhatsAppSafe = async (
  message: string,
  options?: {
    phone?: string;
    title?: string;
    preferNativeShare?: boolean;
  }
): Promise<{ method: 'native' | 'link' | 'clipboard'; url: string }> => {
  const url = buildWhatsAppUrl(message, options?.phone);

  // Copy silently first so user always has text ready even if browser blocks external navigation
  const copied = await copyTextSilently(message);

  // If no specific recipient phone and mobile native share is preferred & supported
  const isTouchMobile =
    typeof window !== 'undefined' &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

  if (options?.preferNativeShare && !options?.phone && isTouchMobile && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: options?.title || 'Kelas Gue',
        text: message
      });
      return { method: 'native', url };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { method: 'native', url };
      }
      // Fall through to wa.me anchor click if share failed
    }
  }

  // Trigger synchronous DOM anchor click (more reliable than window.open in iframes & PWAs)
  let opened = false;
  try {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => link.remove(), 250);
    opened = true;
  } catch {
    opened = false;
  }

  if (!opened) {
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      opened = !!win;
    } catch {
      opened = false;
    }
  }

  if (copied) {
    showToast(
      opened
        ? 'Membuka WhatsApp... (Teks pesan juga disalin otomatis ke clipboard)'
        : 'Popup diblokir browser — teks pesan sudah disalin ke clipboard untuk ditempel di WhatsApp!',
      opened ? 'success' : 'info'
    );
  } else if (!opened) {
    showToast('Tidak dapat membuka tab WhatsApp otomatis. Gunakan tombol tautan langsung di layar.', 'info');
  }

  return { method: opened ? 'link' : 'clipboard', url };
};
