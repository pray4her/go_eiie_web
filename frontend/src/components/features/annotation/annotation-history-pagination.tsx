'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AnnotationHistoryPaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function AnnotationHistoryPagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: AnnotationHistoryPaginationProps) {
  const pageSizeOptions = [10, 20, 50, 100];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">每页显示：</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          上一页
        </Button>
        <span className="text-sm text-muted-foreground">
          第 {page} / {totalPages || 1} 页
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages || 1, page + 1))}
          disabled={page >= (totalPages || 1)}
        >
          下一页
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

