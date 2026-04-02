'use client';

import { Badge } from '@/components/ui/badge';

function toChineseResultLabel(resultStatus: string): string {
  const map: Record<string, string> = {
    complete: '完整',
    incomplete: '不完整',
    sufficient: '充分',
    insufficient: '不充分',
    ambiguous: '待确认',
    no_resume_patent: '简历未体现专利',
    no_resume_honors: '简历未体现荣誉',
  };

  return map[resultStatus] ?? resultStatus;
}

export function CustomerAnalysisExecutionBadge({ status }: { status: string | null | undefined }) {
  const config: Record<string, { label: string; variant: 'secondary' | 'default' | 'success' | 'destructive' }> = {
    pending: { label: '等待中', variant: 'secondary' },
    processing: { label: '处理中', variant: 'default' },
    completed: { label: '已完成', variant: 'success' },
    skipped: { label: '已跳过', variant: 'secondary' },
    failed: { label: '失败', variant: 'destructive' },
  };

  const entry = (status && config[status]) || { label: status || '未知', variant: 'secondary' as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function CustomerAnalysisResultBadge({
  resultStatus,
}: {
  resultStatus: string | null | undefined;
}) {
  if (!resultStatus) {
    return <Badge variant="secondary">未判定</Badge>;
  }

  const variant =
    resultStatus === 'complete' || resultStatus === 'sufficient'
      ? 'success'
      : resultStatus === 'incomplete' || resultStatus === 'insufficient'
        ? 'warning'
        : resultStatus === 'ambiguous'
          ? 'secondary'
          : 'outline';

  return <Badge variant={variant}>{toChineseResultLabel(resultStatus)}</Badge>;
}

export function CustomerAnalysisStaleBadge({ isStale }: { isStale: boolean }) {
  return <Badge variant={isStale ? 'warning' : 'success'}>{isStale ? '结果已过期' : '结果有效'}</Badge>;
}
