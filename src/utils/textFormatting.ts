/**
 * Utility function to convert strings to Title Case (Capitalize First Letter of Each Word)
 * Example: "m rachman fajri m" -> "M Rachman Fajri M"
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
