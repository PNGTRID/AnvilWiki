/**
 * Minimal RFC-4180-ish delimited (CSV/TSV) parser shared by the deterministic
 * content generators (bulk-new-posts, sync-codes). Quoted fields, "" escapes;
 * auto-detects tab vs comma from the first line. Reports an unterminated
 * quote instead of silently swallowing the file tail.
 */
export function parseDelimited(text: string): { rows: string[][]; unterminatedQuote: boolean } {
  const firstLine = text.slice(0, text.indexOf('\n') === -1 ? text.length : text.indexOf('\n'));
  const delim = firstLine.includes('\t') && !firstLine.includes(',') ? '\t' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return { rows, unterminatedQuote: inQuotes };
}

/** The first row that is neither blank nor starts with "#" — the header. */
export function isBlankOrComment(cells: string[]): boolean {
  return cells.every((c) => c.trim() === '') || (cells[0] ?? '').trim().startsWith('#');
}
