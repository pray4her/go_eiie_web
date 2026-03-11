'use client';

import { Button } from '@/components/ui/button';

interface ExternalResumePaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (next: number) => void;
  onPageSizeChange: (next: number) => void;
}

export function ExternalResumePagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange }: ExternalResumePaginationProps) {
  const canPrev = page > 1;
  const canNext = page < Math.max(totalPages, 1);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
          上一页
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
          下一页
        </Button>
        <span className="text-sm text-muted-foreground">第 {page} / {Math.max(totalPages, 1)} 页</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">每页</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}


