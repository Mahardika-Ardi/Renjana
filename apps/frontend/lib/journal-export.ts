/* Client-only journal export. No requests, no uploads, no server storage:
   everything here runs on text already loaded in the browser. */

import { splitBody } from './journal-content';

export interface JournalExportInput {
  title: string;
  body: string;
  tags: string[];
  entryDateLabel: string;
  updatedLabel: string;
}

export function slugify(value: string): string {
  const slug = (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'jurnal';
}

export function splitJournalBody(content: string): string {
  return splitBody(content);
}

export function buildJournalMarkdown(input: JournalExportInput): string {
  const lines = [
    `# ${input.title.trim() || 'Tanpa Judul'}`,
    '',
    `${input.entryDateLabel} · ${input.updatedLabel}`,
  ];
  if (input.tags.length > 0) {
    lines.push('', input.tags.map((tag) => `#${tag}`).join(' '));
  }
  lines.push('', input.body.trim() || '_Jurnal kosong._');
  return `${lines.join('\n')}\n`;
}

export function downloadJournalMarkdown(
  input: JournalExportInput,
  entryDate: string,
): void {
  const markdown = buildJournalMarkdown(input);
  const blob = new Blob([markdown], {
    type: 'text/markdown;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `renjana-${slugify(input.title)}-${entryDate}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printJournal(): void {
  window.print();
}
