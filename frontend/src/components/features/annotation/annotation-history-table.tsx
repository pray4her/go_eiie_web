'use client';

import { AnnotationHistoryItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { AnnotationDownloadButton } from './annotation-download-button';

interface AnnotationHistoryTableProps {
  items: AnnotationHistoryItem[];
  onView: (fileId: number) => void;
}

export function AnnotationHistoryTable({ items, onView }: AnnotationHistoryTableProps) {
  if (!items.length) {
    return <p className="text-muted-foreground">暂无历史标注记录。</p>;
  }

  // 文件类型映射
  const getFileTypeLabel = (fileType: string) => {
    const typeMap: Record<string, string> = {
      'PASSPORT_EXTRACTION_OCR_STAGE1': '身份证明',
      'ACADEMIC_EXTRACTION_OCR_STAGE1': '学历证明',
      'WORK_EXTRACTION_OCR_STAGE1': '工作证明',
      'PARTIME_EXTRACTION_OCR_STAGE1': '兼职证明',
      'PROJECT_EXTRACTION_OCR_STAGE1': '项目证明',
      'PAPER_EXTRACTION_OCR_STAGE1': '论文证明',
      'BOOK_EXTRACTION_OCR_STAGE1': '书籍证明',
      'CONFERENCE_EXTRACTION_OCR_STAGE1': '会议证明',
      'PATENT_EXTRACTION_OCR_STAGE1': '专利证明',
      'HONOR_EXTRACTION_OCR_STAGE1': '荣誉证明',
    };
    return typeMap[fileType] || fileType;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>文件ID</TableHead>
          <TableHead>原始文件名</TableHead>
          <TableHead>文件类型</TableHead>
          <TableHead>标注状态</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>更新时间</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.file_id}>
            <TableCell className="font-mono text-xs">{item.file_id}</TableCell>
            <TableCell className="max-w-[260px] truncate" title={item.original_name}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                {item.original_name}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{getFileTypeLabel(item.file_type)}</Badge>
            </TableCell>
            <TableCell>
              {item.has_annotated_pdf ? (
                <Badge variant="default" className="bg-green-500">
                  已标注
                </Badge>
              ) : (
                <Badge variant="secondary">未标注</Badge>
              )}
            </TableCell>
            <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
            <TableCell>{new Date(item.updated_at).toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <div className="inline-flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onView(item.file_id)}>
                  查看详情
                </Button>
                {item.has_annotated_pdf && (
                  <AnnotationDownloadButton fileId={item.file_id} compact />
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

