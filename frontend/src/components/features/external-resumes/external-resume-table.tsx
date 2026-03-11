'use client';

import { ExternalResumeJobListItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import { ResumeDownloadButton } from '@/components/features/resume-generation/resume-download-button';
import { getExternalResumeDownloadPath } from '@/lib/external-resumes';

interface ExternalResumeTableProps {
  items: ExternalResumeJobListItem[];
  onView: (jobId: string) => void;
}

export function ExternalResumeTable({ items, onView }: ExternalResumeTableProps) {
  if (!items.length) {
    return <p className="text-muted-foreground">暂无外发简历任务。</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Job ID</TableHead>
          <TableHead>原文件名</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>错误信息</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>更新时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.job_id}>
            <TableCell className="font-mono text-xs">{String(item.job_id)}</TableCell>
            <TableCell className="max-w-[260px] truncate" title={item.source_file_name || ''}>
              {item.source_file_name || '-'}
            </TableCell>
            <TableCell><StatusBadge status={item.status} /></TableCell>
            <TableCell className="max-w-[300px] truncate" title={item.error_message || ''}>
              {item.error_message || '-'}
            </TableCell>
            <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
            <TableCell>{new Date(item.updated_at).toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <div className="inline-flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onView(String(item.job_id))}>查看详情</Button>
                {item.status === 'completed' ? (
                  <ResumeDownloadButton
                    jobId={String(item.job_id)}
                    resultUrl={getExternalResumeDownloadPath(String(item.job_id))}
                  />
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


