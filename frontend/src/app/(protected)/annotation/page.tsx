'use client';

import { useEffect, useRef, useState } from 'react';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle, PageDescription } from '@/components/ui/page-header';
import { Section, SectionHeader, SectionTitle, SectionContent } from '@/components/ui/section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnnotationUploadForm } from '@/components/features/annotation/annotation-upload-form';
import { AnnotationDownloadButton } from '@/components/features/annotation/annotation-download-button';
import { AnnotationStatusMessage } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAnnotationProgress } from '@/hooks/use-annotation-progress';
import { toast } from 'sonner';

export default function AnnotationPage() {
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const [annotationStatus, setAnnotationStatus] =
    useState<AnnotationStatusMessage | null>(null);
  const lastNotifiedStatusRef = useRef<AnnotationStatusMessage['status'] | null>(null);

  const handleUploadSuccess = (fileId: number) => {
    setUploadedFileId(fileId);
    setAnnotationStatus(null);
  };

  const handleStatusUpdate = (status: AnnotationStatusMessage) => {
    setAnnotationStatus(status);
  };

  const handleReset = () => {
    setUploadedFileId(null);
    setAnnotationStatus(null);
    lastNotifiedStatusRef.current = null;
  };

  useAnnotationProgress({
    fileId: uploadedFileId,
    enabled: uploadedFileId !== null,
    onStatusUpdate: handleStatusUpdate,
  });

  useEffect(() => {
    if (!annotationStatus) {
      return;
    }

    if (lastNotifiedStatusRef.current === annotationStatus.status) {
      return;
    }
    lastNotifiedStatusRef.current = annotationStatus.status;

    if (annotationStatus.status === 'completed') {
      toast.success('标注完成', {
        description: '标注PDF已生成，可以下载了。',
      });
    } else if (annotationStatus.status === 'failed') {
      toast.error('标注失败', {
        description: annotationStatus.message || '未知错误',
      });
    }
  }, [annotationStatus]);

  const canDownload =
    uploadedFileId !== null && annotationStatus?.status === 'completed';

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>PDF 标注</PageTitle>
            <PageDescription>
              上传 PDF 文件进行 OCR 提取和智能标注，完成后可下载标注后的 PDF 文件。
            </PageDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/annotation-history">查看历史记录</Link>
          </Button>
        </div>
      </PageHeader>
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
        <Section>
          <SectionHeader>
            <SectionTitle>第一步：上传文件</SectionTitle>
          </SectionHeader>
          <SectionContent>
            <Card>
              <CardHeader>
                <CardTitle>选择文件</CardTitle>
                <CardDescription>
                  支持 PDF 和图片格式，启用标注功能后会自动进行 OCR 提取和智能标注。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnnotationUploadForm
                  onUploadSuccess={handleUploadSuccess}
                />
                {uploadedFileId && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={handleReset}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      开始新的标注任务
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>第二步：查看结果</SectionTitle>
          </SectionHeader>
          <SectionContent>
            {canDownload && uploadedFileId ? (
              <Card>
                <CardHeader>
                  <CardTitle>下载结果</CardTitle>
                  <CardDescription>标注已完成，可以下载标注后的 PDF 文件。</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnnotationDownloadButton fileId={uploadedFileId} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>任务通知</CardTitle>
                  <CardDescription>处理完成后将通过消息提示您下载结果。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {annotationStatus?.status === 'failed' ? (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      标注失败：{annotationStatus.message || '未知错误'}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      上传文件后即可开始处理，期间无需保持本页，完成后将收到提示。
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </SectionContent>
        </Section>
      </div>
    </Container>
  );
}

