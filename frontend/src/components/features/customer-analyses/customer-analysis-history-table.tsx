'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { CustomerAnalysisRunListItem } from '@/types';
import {
  CustomerAnalysisExecutionBadge,
  CustomerAnalysisStaleBadge,
} from '@/components/features/customer-analyses/customer-analysis-badges';

interface CustomerAnalysisHistoryTableProps {
  items: CustomerAnalysisRunListItem[];
  onView: (runId: number) => void;
}

export function CustomerAnalysisHistoryTable({
  items,
  onView,
}: CustomerAnalysisHistoryTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="暂无历史记录"
        description="当前客户号还没有客户级沟通需求分析记录。"
      />
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <TableHead>Run ID</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>时效</TableHead>
            <TableHead>已选文件</TableHead>
            <TableHead>类别统计</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>完成时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono">{item.id}</TableCell>
              <TableCell>
                <CustomerAnalysisExecutionBadge status={item.status} />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <CustomerAnalysisStaleBadge isStale={item.is_stale} />
                  {item.is_stale && item.stale_reason ? (
                    <p className="max-w-xs text-xs text-muted-foreground">{item.stale_reason}</p>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{item.selected_file_count}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.completed_count}/{item.category_count}
                {item.failed_count > 0 ? `，失败 ${item.failed_count}` : ''}
              </TableCell>
              <TableCell>{new Date(item.created_at).toLocaleString('zh-CN')}</TableCell>
              <TableCell>
                {item.completed_at ? new Date(item.completed_at).toLocaleString('zh-CN') : '-'}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onView(item.id)}>
                  查看详情
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
