'use client';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { ProcessingStatus } from '@/types';

export interface CustomerListRow {
  customerId: number;
  expertName: string;
  latestStatus: ProcessingStatus;
  latestFileName: string;
  latestCreatedAt: string;
  filesCount: number;
}

interface CustomerAnalysisFileTasksTableProps {
  items: CustomerListRow[];
  onView: (item: CustomerListRow) => void;
}

export function CustomerAnalysisFileTasksTable({ items, onView }: CustomerAnalysisFileTasksTableProps) {
  if (items.length === 0)
    return (
      <EmptyState
        title="暂无已分类客户"
        description="当前没有可用于客户分析的 package_extraction 已分类任务。"
      />
    );

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <TableHead>客户号</TableHead>
            <TableHead>专家姓名</TableHead>
            <TableHead>最新状态</TableHead>
            <TableHead>最近文件</TableHead>
            <TableHead>任务数</TableHead>
            <TableHead>最近时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.customerId}>
              <TableCell className="font-mono">{item.customerId}</TableCell>
              <TableCell className="max-w-[180px] truncate" title={item.expertName}>
                {item.expertName || '-'}
              </TableCell>
              <TableCell>
                <StatusBadge status={item.latestStatus} />
              </TableCell>
              <TableCell className="max-w-sm truncate" title={item.latestFileName}>
                {item.latestFileName}
              </TableCell>
              <TableCell>{item.filesCount}</TableCell>
              <TableCell>{new Date(item.latestCreatedAt).toLocaleString('zh-CN')}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onView(item)}>
                  加载结果
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
