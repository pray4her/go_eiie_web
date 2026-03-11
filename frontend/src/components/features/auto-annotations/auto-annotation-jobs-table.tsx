'use client';

import { AutoAnnotationJobListItem } from '@/types';
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
import { AutoAnnotationZipDownloadButton } from './auto-annotation-zip-download-button';

interface AutoAnnotationJobsTableProps {
  items: AutoAnnotationJobListItem[];
  onView: (jobId: string) => void;
}

export function AutoAnnotationJobsTable({
  items,
  onView,
}: AutoAnnotationJobsTableProps) {
  if (!items.length) {
    return <p className="text-muted-foreground">暂无自动标注任务。</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job ID</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>父文件 ID</TableHead>
          <TableHead>专家姓名</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={`auto-annotation-job-${item.id}-${item.created_at}`}>
            <TableCell className="font-mono text-xs">
              {String(item.id)}
            </TableCell>
            <TableCell>
              {new Date(item.created_at).toLocaleString('zh-CN')}
            </TableCell>
            <TableCell>{item.extraction_parent_file_id}</TableCell>
            <TableCell>{item.expert_name || '-'}</TableCell>
            <TableCell>
              <StatusBadge status={item.status} />
            </TableCell>
            <TableCell className="text-right">
              <div className="inline-flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(String(item.id))}
                >
                  查看详情
                </Button>
                <AutoAnnotationZipDownloadButton
                  jobId={item.id}
                  compact
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


