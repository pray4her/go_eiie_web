'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalResumeJob } from '@/types';
import { ResumeUploadForm } from '@/components/features/resume-generation/resume-upload-form';
import { ResumeGenerationStatus } from '@/components/features/resume-generation/resume-generation-status';
import { ResumeResultDisplay } from '@/components/features/resume-generation/resume-result-display';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle, PageDescription } from '@/components/ui/page-header';
import { Section, SectionHeader, SectionTitle, SectionContent } from '@/components/ui/section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function GenerateResumePage() {
  const [currentJob, setCurrentJob] = useState<ExternalResumeJob | null>(null);

  const handleJobCreated = (jobId: string) => {
    const newJob: ExternalResumeJob = {
      id: jobId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setCurrentJob(newJob);
  };

  const handleStatusUpdate = (updatedJob: ExternalResumeJob) => {
    setCurrentJob(updatedJob);
  };

  const handleReset = () => {
    setCurrentJob(null);
  };

  const isProcessing = currentJob?.status === 'pending' || currentJob?.status === 'processing';

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <PageTitle>外发简历生成</PageTitle>
        <PageDescription>上传简历并生成标准化外发版本。</PageDescription>
      </PageHeader>
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
        <Section>
          <SectionHeader>
            <SectionTitle>第一步：上传简历</SectionTitle>
          </SectionHeader>
          <SectionContent>
            <Card>
              <CardHeader>
                <CardTitle>选择文件</CardTitle>
                <CardDescription>支持常见文档格式。</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="pb-2">
                  <Button asChild variant="outline" size="sm"><Link href="/external-resumes">查看历史记录</Link></Button>
                </div>
                <ResumeUploadForm onJobCreated={handleJobCreated} isProcessing={isProcessing} />
                {currentJob && (
                  <div className="pt-2 text-center">
                    <Button variant="ghost" onClick={handleReset} className="text-sm">开始新的生成任务</Button>
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
            {currentJob ? (
              <>
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle>处理状态</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResumeGenerationStatus jobId={currentJob.id} onStatusUpdate={handleStatusUpdate} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>生成结果</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResumeResultDisplay job={currentJob} />
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">等待上传简历...</p>
                </CardContent>
              </Card>
            )}
          </SectionContent>
        </Section>
      </div>
    </Container>
  );
}

