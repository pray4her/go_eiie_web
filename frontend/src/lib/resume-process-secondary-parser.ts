export interface ResumeProcessFieldMapping {
  no: number;
  column: string;
  header: string;
  value: string;
}

import { RESUME_PROCESS_SECONDARY_NO_TO_COLUMN, RESUME_PROCESS_SECONDARY_NO_TO_HEADER } from '@/lib/resume-process-secondary-mapping';

function stripOuterQuotes(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return text;
}

export function normalizeResumeProcessText(text: string): string {
  return stripOuterQuotes(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\^\^\^/g, '\n');
}

function cleanSegmentValue(value: string): string {
  const trimmed = stripOuterQuotes(value).trim();
  if (!trimmed) return '';
  let cleaned = trimmed.replace(/\u0000/g, '');
  cleaned = cleaned.replace(/###\s*$/g, '').trim();
  cleaned = cleaned.replace(/###\s*$/g, '').trim();
  cleaned = cleaned.replace(/^"+|"+$/g, '').trim();
  return cleaned.replace(/\^\^\^/g, '\n');
}

export function parseSecondaryNOFieldsFromText(rawText: string): ResumeProcessFieldMapping[] {
  const text = normalizeResumeProcessText(rawText);
  const regex = /NO\.(\d+)###/g;
  const matches = Array.from(text.matchAll(regex));
  if (!matches.length) return [];

  const items: ResumeProcessFieldMapping[] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const next = matches[i + 1];
    const no = Number(match[1]);
    const startIndex = (match.index ?? 0) + match[0].length;
    const endIndex = next?.index ?? text.length;
    const rawValue = text.slice(startIndex, endIndex);
    const value = cleanSegmentValue(rawValue);

    if (!Number.isFinite(no) || no < 1 || no > 41) continue;
    items.push({
      no,
      column: RESUME_PROCESS_SECONDARY_NO_TO_COLUMN[no] ?? '',
      header: RESUME_PROCESS_SECONDARY_NO_TO_HEADER[no] ?? `NO.${no}`,
      value,
    });
  }

  const merged = new Map<number, ResumeProcessFieldMapping>();
  for (const item of items) {
    const prev = merged.get(item.no);
    if (!prev) {
      merged.set(item.no, item);
      continue;
    }
    if (item.value && !prev.value) {
      merged.set(item.no, item);
      continue;
    }
    if (item.value && prev.value && item.value !== prev.value) {
      merged.set(item.no, { ...prev, value: `${prev.value}\n\n${item.value}` });
    }
  }

  return Array.from(merged.values()).sort((a, b) => a.no - b.no);
}

export function parseSecondaryNOFieldsFromManyTexts(texts: string[]): ResumeProcessFieldMapping[] {
  const combined = texts
    .filter(Boolean)
    .map((t) => normalizeResumeProcessText(t))
    .join('\n');
  return parseSecondaryNOFieldsFromText(combined);
}
