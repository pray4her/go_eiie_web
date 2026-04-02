import { PromptRelease } from '@/types';

export function formatPromptDate(value?: string | null): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('zh-CN');
}

export function compactHash(value?: string | null, fallback = '-'): string {
  if (!value) return fallback;
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function canDeletePromptRelease(release: PromptRelease): boolean {
  return release.label !== 'production' && !release.is_protected;
}
