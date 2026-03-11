'use client';

import { useRouter } from 'next/navigation';
import { AutoAnnotationItem } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AutoAnnotationItemDownloadButton } from '@/components/features/auto-annotations/auto-annotation-item-download-button';

interface AutoAnnotationItemsTableProps {
  items: AutoAnnotationItem[];
}

// 自动标注类型中文映射
function getDetectedTypeLabel(prefix: string, isPaper: boolean): string {
  if (isPaper) {
    return '论文（合并结果）';
  }

  const map: Record<string, string> = {
    'Identity Documents': '身份证明/护照',
    'Employment Verification': '工作证明',
    'Academic Credentials': '学历证明',
    'Part-time Employment': '兼职证明',
    'Project Experience': '项目证明',
    'Original Research Paper': '论文',
    Books: '书籍',
    'Conference Materials': '会议材料',
    Patents: '专利',
    'Honors and Awards': '荣誉/奖项',
  };

  return map[prefix] || prefix;
}

// 子项状态中文映射
function getItemStatusLabel(status: AutoAnnotationItem['status']): string {
  switch (status) {
    case 'pending':
      return '排队中';
    case 'running':
      return 'OCR/标注中';
    case 'completed':
      return '已完成';
    case 'failed':
      return '失败';
    default:
      return status;
  }
}

export function AutoAnnotationItemsTable({
  items,
}: AutoAnnotationItemsTableProps) {
  const router = useRouter();

  if (!items.length) {
    return <p className="text-muted-foreground">暂无明细记录。</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>文件 ID</TableHead>
          <TableHead>原始文件名 / 相对路径</TableHead>
          <TableHead>检测类型</TableHead>
          <TableHead>标注状态</TableHead>
          <TableHead>错误信息</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>更新时间</TableHead>
          <TableHead>标注 PDF</TableHead>
          <TableHead className="w-[120px] text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-mono text-xs">
              {item.file_id}
            </TableCell>
            <TableCell className="max-w-[320px]">
              <div className="truncate" title={item.original_file_name}>
                {item.original_file_name}
              </div>
              {item.relative_path && (
                <div
                  className="mt-1 truncate text-xs text-muted-foreground"
                  title={item.relative_path}
                >
                  {item.relative_path}
                </div>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {getDetectedTypeLabel(
                  item.detected_type_prefix,
                  item.is_paper
                )}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  item.status === 'completed'
                    ? 'success'
                    : item.status === 'failed'
                    ? 'destructive'
                    : 'default'
                }
              >
                {getItemStatusLabel(item.status)}
              </Badge>
            </TableCell>
            <TableCell className="max-w-[260px]">
              <span
                className="block truncate text-sm text-muted-foreground"
                title={item.error || ''}
              >
                {item.error || '-'}
              </span>
            </TableCell>
            <TableCell>
              {new Date(item.created_at).toLocaleString('zh-CN')}
            </TableCell>
            <TableCell>
              {new Date(item.updated_at).toLocaleString('zh-CN')}
            </TableCell>
            <TableCell>
              {item.annotated_pdf_path ? (
                <div className="flex items-center gap-2">
                  <Badge variant="success">已生成</Badge>
                  <AutoAnnotationItemDownloadButton
                    jobId={item.job_id}
                    itemId={item.id}
                    compact
                  />
                </div>
              ) : (
                <Badge variant="secondary">未生成</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(
                    `/auto-annotations/${item.job_id}/items/${item.id}`
                  )
                }
              >
                查看详情
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
