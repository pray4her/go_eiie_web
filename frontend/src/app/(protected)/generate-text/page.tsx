'use client';

import { useRef } from 'react';
import { GenerateContentForm } from '@/components/features/generate-text/generate-content-form';
import { JobList, JobListHandles } from '@/components/features/generate-text/job-list';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle, PageDescription } from '@/components/ui/page-header';
import { Section, SectionHeader, SectionTitle, SectionContent } from '@/components/ui/section';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function GenerateTextPage() {
  const jobListRef = useRef<JobListHandles>(null);

  const handleJobCreated = () => {
    // Call the refresh method on the JobList component
    if (jobListRef.current) {
      jobListRef.current.refresh();
    }
  };

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <PageTitle>200字生成</PageTitle>
        <PageDescription>输入主题与约束条件，快速生成 200 字以内的文本。</PageDescription>
      </PageHeader>

      <div className="space-y-8">
        <Section>
          <SectionHeader>
            <SectionTitle>创建任务</SectionTitle>
          </SectionHeader>
          <SectionContent>
            <Card>
              <CardHeader>
                <CardTitle>填写内容</CardTitle>
                <CardDescription>提交后任务将显示在下方列表中。</CardDescription>
              </CardHeader>
              <CardContent>
                <GenerateContentForm onJobCreated={handleJobCreated} />
              </CardContent>
            </Card>
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>任务列表</SectionTitle>
          </SectionHeader>
          <SectionContent>
            <Card>
              <CardContent>
                <JobList ref={jobListRef} />
              </CardContent>
            </Card>
          </SectionContent>
        </Section>
      </div>
    </Container>
  );
}
