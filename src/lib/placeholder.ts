/**
 * Content fields that are still unconfirmed are written as
 * "PLACEHOLDER — e.g. Half day". This splits them into the display value and a
 * flag, so components can show the example text with a placeholder tag.
 */
export function field(raw: string | undefined): { value: string; placeholder: boolean } {
  if (!raw) return { value: 'To be confirmed', placeholder: true };
  const m = raw.match(/^PLACEHOLDER\s*(?:[—–-]\s*(.*))?$/);
  if (!m) return { value: raw, placeholder: false };
  return { value: m[1]?.trim() || 'To be confirmed', placeholder: true };
}
