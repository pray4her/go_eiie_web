'use client';

import { ExternalResumeJob } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResumeDownloadButton } from './resume-download-button';
import { AlertCircle, CheckCircle, Hourglass } from 'lucide-react';

interface ResumeResultDisplayProps {
  job: ExternalResumeJob | null;
}

export function ResumeResultDisplay({ job }: ResumeResultDisplayProps) {
  if (!job) {
    return (
      <Card className="flex items-center justify-center h-full min-h-[200px] border-dashed">
        <div className="text-center text-muted-foreground">
          <p>请先上传简历并开始生成任务</p>
        </div>
      </Card>
    );
  }

  const renderContent = () => {
    switch (job.status) {
      case 'pending':
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center space-y-3">
            <Hourglass className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="font-semibold text-lg">正在处理中...</p>
            <p className="text-muted-foreground text-sm">{job.message || '任务已提交，请稍候。'}</p>
          </div>
        );
      case 'completed':
        return (
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <p className="font-semibold text-xl">简历生成成功！</p>
            <p className="text-muted-foreground text-sm">{job.message || '您可以下载处理后的简历文件。'}</p>
            {job.result_url && (
                <ResumeDownloadButton jobId={job.id} resultUrl={job.result_url} />
            )}
          </div>
        );
      case 'failed':
        return (
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="font-semibold text-xl">生成失败</p>
            <p className="text-destructive text-sm max-w-sm">
              {job.message || '处理过程中发生未知错误，请检查您的文件或稍后重试。'}
            </p>
          </div>
        );
      default:
        return <p>未知状态: {job.status}</p>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>生成状态与结果</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[200px] flex items-center justify-center">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

