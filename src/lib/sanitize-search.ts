/**
 * Sanitize a search parameter before using it in a PostgREST `.or()` filter string.
 *
 * Removes PostgREST filter operators and special characters (dots, parentheses,
 * commas, quotes, backslashes) that could be used to inject or alter filter logic.
 *
 * ⚠️  Only needed when building `.or()` strings via template literals.
 *     Parameterized methods like `.eq()`, `.ilike(col, val)` are safe by default.
 */
export function sanitizeSearchParam(value: string): string {
  return value.replace(/[.,()'"\\]/g, '').trim();
}
