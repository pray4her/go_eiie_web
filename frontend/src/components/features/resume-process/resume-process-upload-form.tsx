'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { isAxiosError } from 'axios';
import { File as FileIcon, Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadResumeProcessFile } from '@/lib/resume-process';

interface ResumeProcessUploadFormProps {
  onJobCreated: (jobId: number) => void;
  isProcessing: boolean;
}

export function ResumeProcessUploadForm({ onJobCreated, isProcessing }: ResumeProcessUploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
  });

  async function handleUpload() {
    if (files.length === 0) {
      toast.error('未选择文件', { description: '请先选择至少一个简历文件再开始处理。' });
      return;
    }

    setIsUploading(true);
    try {
      const jobId = await uploadResumeProcessFile(files);
      toast.success('任务已提交', { description: '正在进行分析，请稍候...' });
      onJobCreated(jobId);
    } catch (error: unknown) {
      const description = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error instanceof Error
          ? error.message
          : '无法启动简历处理任务，请稍后重试。';
      toast.error('上传失败', { description });
    } finally {
      setIsUploading(false);
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={[
          'relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
          files.length > 0 ? 'border-primary/50' : '',
        ].join(' ')}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground text-sm">{isDragActive ? '松开即可上传' : '将文件拖到此处，或点击选择'}</p>
          <p className="text-xs text-muted-foreground">支持 PDF, DOC, DOCX 格式</p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 border rounded-md bg-muted/30 group">
              <div className="flex items-center space-x-3 overflow-hidden">
                <FileIcon className="w-5 h-5 text-primary shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <span className="sr-only">移除文件</span>
                <span className="text-destructive">×</span>
              </Button>
            </div>
          ))}
          <div className="flex justify-end">
            <Button variant="link" size="sm" onClick={() => setFiles([])} className="text-muted-foreground">
              清空全部
            </Button>
          </div>
        </div>
      )}

      <Button onClick={handleUpload} disabled={files.length === 0 || isUploading || isProcessing} className="w-full" size="lg">
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在上传 ({files.length} 个文件)...
          </>
        ) : isProcessing ? (
          '处理中...'
        ) : (
          `开始处理 ${files.length > 0 ? `(${files.length})` : ''}`
        )}
      </Button>
    </div>
  );
}

