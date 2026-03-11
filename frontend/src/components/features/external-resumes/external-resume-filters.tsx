'use client';

import { JobStatus } from '@/types';
import { Button } from '@/components/ui/button';

interface ExternalResumeFiltersProps {
  status: JobStatus | '';
  onChange: (next: JobStatus | '') => void;
}

const STATUS_OPTIONS: Array<{ label: string; value: JobStatus | '' }> = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
];

export function ExternalResumeFilters({ status, onChange }: ExternalResumeFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((opt) => (
        <Button
          key={opt.label}
          variant={status === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}


