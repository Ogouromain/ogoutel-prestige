// ============================================
// OGOUTEL_Prestige - HTML Escape Utility
// Protection anti-XSS pour les templates email
//
// Échappe les caractères HTML spéciaux dans les
// entrées utilisateur avant interpolation dans du HTML.
// ============================================

/**
 * Échappe les caractères HTML spéciaux pour prévenir les attaques XSS.
 * @param str - Chaîne à échapper
 * @returns Chaîne échappée safe pour interpolation HTML
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Échappe les attributs HTML (utilisé pour les values d'attributs).
 * Alias de escapeHtml pour clarté sémantique.
 */
export function escapeAttr(str: string | null | undefined): string {
  return escapeHtml(str);
}
