'use client';

import { AnnotationHistoryDetail } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnnotationDownloadButton } from './annotation-download-button';
import { FileText, Calendar, HardDrive, Tag } from 'lucide-react';

interface AnnotationHistoryDetailsProps {
  data: AnnotationHistoryDetail;
}

export function AnnotationHistoryDetails({ data }: AnnotationHistoryDetailsProps) {
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>文件的基本信息和状态</CardDescription>
            </div>
            {data.has_annotated_pdf && (
              <AnnotationDownloadButton fileId={data.file_id} />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">原始文件名</p>
                <p className="text-sm text-muted-foreground">{data.original_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">文件类型</p>
                <Badge variant="outline">{getFileTypeLabel(data.file_type)}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">文件大小</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(data.file_size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-xs">📄</span>
              </div>
              <div>
                <p className="text-sm font-medium">内容类型</p>
                <p className="text-sm text-muted-foreground">{data.content_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium">标注状态</p>
                {data.has_annotated_pdf ? (
                  <Badge variant="default" className="bg-green-500">
                    已标注
                  </Badge>
                ) : (
                  <Badge variant="secondary">未标注</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">文件ID</p>
                <p className="text-sm text-muted-foreground font-mono">{data.file_id}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium">创建时间</p>
              <p className="text-sm text-muted-foreground">
                {new Date(data.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">更新时间</p>
              <p className="text-sm text-muted-foreground">
                {new Date(data.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 提取数据 */}
      {data.data && (
        <Card>
          <CardHeader>
            <CardTitle>提取数据</CardTitle>
            <CardDescription>OCR 提取的结构化数据</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(data.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 坐标信息 */}
      {data.coordinates && (
        <Card>
          <CardHeader>
            <CardTitle>坐标信息</CardTitle>
            <CardDescription>文本在PDF中的坐标位置</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(data.coordinates, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* OCR 原始数据 */}
      {data.ocr_raw && (
        <Card>
          <CardHeader>
            <CardTitle>OCR 原始数据</CardTitle>
            <CardDescription>OCR 引擎返回的原始数据</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-96">
              {JSON.stringify(data.ocr_raw, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Stage2 原始数据 */}
      {data.stage2_raw && (
        <Card>
          <CardHeader>
            <CardTitle>Stage2 原始数据</CardTitle>
            <CardDescription>第二阶段处理返回的原始数据</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm max-h-96">
              {JSON.stringify(data.stage2_raw, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

