'use client';

import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { downloadResumeProcessExportTemplate } from '@/lib/resume-process';

interface ResumeProcessExportButtonProps {
  jobId: number | string;
  compact?: boolean;
}

export function ResumeProcessExportButton({ jobId, compact }: ResumeProcessExportButtonProps) {
  async function handleDownload() {
    try {
      const { blob, fileName } = await downloadResumeProcessExportTemplate(jobId);
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `resume_process_${jobId}.xls`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('下载失败', { description: '无法下载导出模板，请稍后重试。' });
    }
  }

  return (
    <Button onClick={handleDownload} size={compact ? 'sm' : undefined} variant={compact ? 'outline' : undefined}>
      <Download className="mr-2 h-4 w-4" />
      {compact ? '导出' : '导出 Excel'}
    </Button>
  );
}
