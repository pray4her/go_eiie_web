'use client';

import { ResearchPaperJob } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { ResearchPaperDownloadButton } from './research-paper-download-button';
import { Eye, Trash2, Loader2 } from 'lucide-react';

interface ResearchPaperJobsTableProps {
  items: ResearchPaperJob[];
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting?: number | null;
}

export function ResearchPaperJobsTable({
  items,
  onView,
  onDelete,
  isDeleting,
}: ResearchPaperJobsTableProps) {
  if (!items.length) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
        <p className="text-muted-foreground">暂无论文自动标注任务。</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>专家姓名</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isFinished = item.status === 'completed';

            return (
              <TableRow key={`rp-job-${item.id}`}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {item.id}
                </TableCell>
                <TableCell className="font-medium">
                  {item.expert_name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(item.created_at).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(item.id)}
                      title="查看详情"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      详情
                    </Button>

                    {isFinished && item.annotated_pdf_path && (
                      <ResearchPaperDownloadButton
                        jobId={item.id}
                        compact
                      />
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(item.id)}
                      disabled={isDeleting === item.id}
                      title="删除任务"
                    >
                      {isDeleting === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

