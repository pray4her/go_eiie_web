import { JobDetails } from '@/components/features/jobs/job-details';
import { Container } from '@/components/ui/container';
import { PageHeader, PageTitle } from '@/components/ui/page-header';

interface JobDetailsPageProps {
  params: Promise<{
    jobId: string;
  }>;
}

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const { jobId } = await params;
  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <PageTitle>任务详情</PageTitle>
      </PageHeader>
      <JobDetails jobId={jobId} />
    </Container>
  );
}
