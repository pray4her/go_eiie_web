'use client';

import { Button } from '@/components/ui/button';

interface FileStatusPaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
  onPageSizeChange: (next: number) => void;
}

export function FileStatusPagination({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: FileStatusPaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const canPrev = page > 1;
  const canNext = page < safeTotalPages;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">共 {total} 条</div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-muted-foreground">每页</label>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
          上一页
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
          下一页
        </Button>
        <span className="text-sm text-muted-foreground">
          第 {page} / {safeTotalPages} 页
        </span>
      </div>
    </div>
  );
}
