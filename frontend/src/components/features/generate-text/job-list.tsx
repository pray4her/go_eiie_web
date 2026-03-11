'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import api from '@/lib/api';
import { GenerationJob } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface JobListHandles {
  refresh: () => void;
}

const JobList = forwardRef<JobListHandles>((_props, ref) => {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/writing/jobs');
      // Sort jobs by creation date, newest first
      const sortedJobs = response.data.sort((a: GenerationJob, b: GenerationJob) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      // Map API response to component's expected data structure
      const mappedJobs = sortedJobs.map((job: GenerationJob) => ({
        ...job,
        createdAt: (job as unknown as { created_at: string }).created_at,
      }));
      setJobs(mappedJobs);
    } catch (error) {
      console.error('Failed to fetch jobs', error);
      toast.error('获取任务列表失败。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const intervalId = setInterval(fetchJobs, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchJobs,
  }));

  if (isLoading) {
    return <p>正在加载任务列表...</p>;
  }

  if (jobs.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>历史任务</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">暂无内容生成任务。</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>历史任务</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>任务 ID</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono">{job.id}</TableCell>
                <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <StatusBadge status={job.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/jobs/${job.id}`}>查看详情</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});

JobList.displayName = 'JobList';

export { JobList };

