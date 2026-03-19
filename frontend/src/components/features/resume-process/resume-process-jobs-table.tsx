'use client';

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { ResumeProcessJob } from '@/types';

interface ResumeProcessJobsTableProps {
  items: ResumeProcessJob[];
  onView: (jobId: string) => void;
}

export function ResumeProcessJobsTable({ items, onView }: ResumeProcessJobsTableProps) {
  if (!items.length) {
    return <p className="text-muted-foreground">暂无简历处理任务。</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job ID</TableHead>
          <TableHead>初次分析</TableHead>
          <TableHead>二次生成</TableHead>
          <TableHead>错误信息</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>更新时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-mono text-xs">{String(item.id)}</TableCell>
            <TableCell><StatusBadge status={item.status} /></TableCell>
            <TableCell>
              {item.secondary_status ? (
                <StatusBadge status={item.secondary_status} />
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </TableCell>
            <TableCell className="max-w-[320px] truncate" title={item.error_message || item.secondary_error_message || ''}>
              {item.error_message || item.secondary_error_message || '-'}
            </TableCell>
            <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
            <TableCell>{new Date(item.updated_at).toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" onClick={() => onView(String(item.id))}>查看详情</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

