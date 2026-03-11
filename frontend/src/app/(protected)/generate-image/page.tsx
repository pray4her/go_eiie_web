'use client';

import { useState } from 'react';
import { ImageUploadForm } from '@/components/features/image-generation/image-upload-form';
import { ImageGenerationStatus } from '@/components/features/image-generation/image-generation-status';
import { ImageResultPreview } from '@/components/features/image-generation/image-result-preview';
import { ImageGenerationJob } from '@/types';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle, PageDescription } from '@/components/ui/page-header';
import { Section, SectionHeader, SectionTitle, SectionContent } from '@/components/ui/section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export default function GenerateImagePage() {
  const [currentJob, setCurrentJob] = useState<ImageGenerationJob | null>(null);

  const handleJobCreated = (jobId: number) => {
    const newJob: ImageGenerationJob = {
      id: jobId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setCurrentJob(newJob);
  };

  const handleStatusUpdate = (updatedJob: ImageGenerationJob) => {
    setCurrentJob(updatedJob);
  };

  const handleReset = () => {
    setCurrentJob(null);
  };

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <PageTitle>提取签名</PageTitle>
        <PageDescription>上传包含签名的图片，系统将提取图片中的签名。</PageDescription>
      </PageHeader>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Section>
          <SectionHeader>
            <SectionTitle>上传图片</SectionTitle>
          </SectionHeader>
          <SectionContent>
            <Card>
              <CardHeader>
                <CardTitle>选择或粘贴图片</CardTitle>
                <CardDescription>支持粘贴上传（Ctrl+V）。</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploadForm onJobCreated={handleJobCreated} />
                {currentJob && (
                  <div className="pt-4 text-center">
                    <button onClick={handleReset} className="text-sm text-muted-foreground transition-colors hover:text-foreground">重新开始提取</button>
                  </div>
                )}
              </CardContent>
            </Card>
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>结果与状态</SectionTitle>
          </SectionHeader>
          <SectionContent>
            {currentJob ? (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>任务状态</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImageGenerationStatus jobId={currentJob.id} onStatusUpdate={handleStatusUpdate} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>提取结果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImageResultPreview resultUrl={currentJob.result_url || ''} jobId={currentJob.id} status={currentJob.status} />
                  </CardContent>
                </Card>
              </>
            ) : (
              <EmptyState title="等待上传图片" description="上传图片后，任务状态和提取结果将在此处显示。" />
            )}
          </SectionContent>
        </Section>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">建议只保留签名区域后再上传；如效果不佳，可多试几次。</p>
      </div>
    </Container>
  );
}
