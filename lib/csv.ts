/**
 * CSV generation.
 *
 * Two separate problems, both handled here:
 *
 * 1. Ordinary CSV quoting — commas, quotes and newlines inside a value.
 *
 * 2. Formula injection. A donor can type `=1+1` or `=HYPERLINK(...)` into the
 *    name field on a public form. Excel and Google Sheets execute leading
 *    `= + - @` (and tab/CR) as formulas when the file is opened, which turns
 *    an export into a way to attack whoever opens it. Prefixing with a
 *    single quote neutralises it while still displaying the original text.
 *    This matters here because our CSV contains attacker-supplied strings.
 */
const RISKY_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);

  if (RISKY_PREFIX.test(text)) text = `'${text}`;

  if (/[",\n\r]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ];
  // CRLF and a UTF-8 BOM: Excel needs both to open a UTF-8 CSV correctly,
  // and without the BOM the naira sign arrives as mojibake.
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
