'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadResearchPaper } from '@/lib/research-papers';

interface ResearchPaperUploadFormProps {
  onUploadSuccess: (jobId: number) => void;
}

export function ResearchPaperUploadForm({ onUploadSuccess }: ResearchPaperUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [expertName, setExpertName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  });

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('未选择文件', {
        description: '请先选择一个 PDF 文件再开始上传。',
      });
      return;
    }

    if (!expertName.trim()) {
      toast.error('专家姓名必填', {
        description: '请输入需要重点标注的专家姓名。',
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadResearchPaper(file, expertName.trim());
      toast.success('上传成功', {
        description: '论文处理任务已启动，请在下方列表关注进度。',
      });
      onUploadSuccess(result.job_id);
      setFile(null);
      setExpertName('');
    } catch (error: unknown) {
      let description = '无法上传文件，请稍后重试。';
      if (error instanceof Error) {
        description = error.message;
      }
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        description = axiosError.response?.data?.error || description;
      }
      toast.error('上传失败', {
        description,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="expertName">专家姓名 <span className="text-destructive">*</span></Label>
          <Input
            id="expertName"
            placeholder="请输入专家姓名"
            value={expertName}
            onChange={(e) => setExpertName(e.target.value)}
          />
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
        ${file ? 'border-solid border-primary' : ''}`}
      >
        <input {...getInputProps()} />
        {!file ? (
          <div className="text-center p-4">
            <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">
              {isDragActive ? '松开即可上传' : '点击或将论文 PDF 拖到此处'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              目前仅支持 .pdf 格式
            </p>
          </div>
        ) : (
          <div className="w-full p-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileIcon className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={handleUpload}
        disabled={!file || !expertName.trim() || isUploading}
        className="w-full"
        size="lg"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在上传并启动任务...
          </>
        ) : (
          '开始自动标注'
        )}
      </Button>
    </div>
  );
}

