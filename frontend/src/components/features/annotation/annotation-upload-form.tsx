'use client';

import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { isAxiosError } from 'axios';
import { UploadCloud, File as FileIcon, Loader2, X } from 'lucide-react';
import { useAuthStore } from '@/contexts/auth-store';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnnotationUploadResponse } from '@/types';

interface AnnotationUploadFormProps {
  onUploadSuccess: (fileId: number) => void;
}

// 文件类型映射（按指定顺序）
const FILE_TYPE_OPTIONS = [
  { value: 'PASSPORT_EXTRACTION_OCR_STAGE1', label: '身份证明' },
  { value: 'ACADEMIC_EXTRACTION_OCR_STAGE1', label: '学历证明' },
  { value: 'WORK_EXTRACTION_OCR_STAGE1', label: '工作证明' },
  { value: 'PARTIME_EXTRACTION_OCR_STAGE1', label: '兼职证明' },
  { value: 'PROJECT_EXTRACTION_OCR_STAGE1', label: '项目证明' },
  { value: 'PAPER_EXTRACTION_OCR_STAGE1', label: '论文证明' },
  { value: 'BOOK_EXTRACTION_OCR_STAGE1', label: '书籍证明' },
  { value: 'CONFERENCE_EXTRACTION_OCR_STAGE1', label: '会议证明' },
  { value: 'PATENT_EXTRACTION_OCR_STAGE1', label: '专利证明' },
  { value: 'HONOR_EXTRACTION_OCR_STAGE1', label: '荣誉证明' },
] as const;

const AUTHOR_NAME_STORAGE_KEY = 'annotation:authorName';

export function AnnotationUploadForm({ onUploadSuccess }: AnnotationUploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState('PASSPORT_EXTRACTION_OCR_STAGE1');
  const [authorName, setAuthorName] = useState('');
  const [annotate, setAnnotate] = useState(true);
  const [handwritten, setHandwritten] = useState(false);
  const [useRemoteOcrProvider, setUseRemoteOcrProvider] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { token } = useAuthStore();
  const [isAuthorNameInitialized, setIsAuthorNameInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedAuthor = window.localStorage.getItem(AUTHOR_NAME_STORAGE_KEY);
    if (storedAuthor) {
      setAuthorName(storedAuthor);
    }
    setIsAuthorNameInitialized(true);
  }, []);

  const updateAuthorName = (value: string) => {
    setAuthorName(value);
    if (typeof window === 'undefined') return;
    if (value) {
      window.localStorage.setItem(AUTHOR_NAME_STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(AUTHOR_NAME_STORAGE_KEY);
    }
  };

  const clearAuthorName = () => {
    updateAuthorName('');
  };

  // 检查是否所有文件都是 PDF
  const allFilesArePDF = files.length > 0 && files.every((file) => file.type === 'application/pdf');

  const onDrop = (acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp'],
    },
    multiple: true,
  });

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('未选择文件', {
        description: '请先选择至少一个文件再开始上传。',
      });
      return;
    }
    if (!token) {
      toast.error('未认证', {
        description: '无法获取认证信息，请重新登录。',
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files[]', file);
      });
      formData.append('file_type', fileType);
      formData.append('AuthorName', authorName.trim());
      // 只有所有文件都是 PDF 时才启用标注
      formData.append('annotate', annotate && allFilesArePDF ? 'true' : 'false');
      formData.append('handwritten', handwritten ? 'true' : 'false');
      if (useRemoteOcrProvider) {
        formData.append('ocr_provider', 'remote');
      }

      const response = await api.post<AnnotationUploadResponse>(
        '/ocr-extract/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.queued.length > 0) {
        const fileId = response.data.queued[0].file_id;
        toast.success('处理已开始', {
          description: '系统正在处理，完成后会提醒并提供下载链接。',
        });
        onUploadSuccess(fileId);
        // 清空文件列表
        setFiles([]);
      } else {
        throw new Error('服务器未返回任务信息');
      }
    } catch (error: unknown) {
      const description = isAxiosError(error)
        ? error.response?.data?.error || error.response?.data?.message || error.message
        : error instanceof Error
        ? error.message
        : '无法上传文件，请稍后重试。';

      toast.error('上传失败', {
        description,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center w-full min-h-[200px] border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
        ${files.length > 0 ? 'border-solid border-primary' : ''}`}
      >
        <input {...getInputProps()} />
        {files.length === 0 ? (
          <div className="text-center p-4">
            <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {isDragActive ? '松开即可上传' : '将文件拖到此处，或点击选择'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              支持 PDF, JPG, PNG, WEBP, GIF, BMP 格式
            </p>
          </div>
        ) : (
          <div className="w-full p-4 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <FileIcon className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="authorName">专家名称</Label>
          <div className="relative">
            <Input
              id="authorName"
              placeholder="请输入专家名称"
              value={authorName}
              disabled={!isAuthorNameInitialized}
              onChange={(event) => updateAuthorName(event.target.value)}
              className={authorName ? 'pr-9' : undefined}
            />
            {authorName && (
              <button
                type="button"
                aria-label="清除专家名称"
                onClick={clearAuthorName}
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>文件类型</Label>
          <div className="flex flex-wrap gap-2">
            {FILE_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFileType(option.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                  fileType === option.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-foreground border-border hover:bg-gray-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="annotate"
            checked={annotate}
            disabled={!allFilesArePDF}
            onCheckedChange={(checked) => setAnnotate(checked === true)}
          />
          <Label
            htmlFor="annotate"
            className={allFilesArePDF ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
          >
            启用标注（仅 PDF 文件支持）
          </Label>
        </div>
        {files.length > 0 && !allFilesArePDF && annotate && (
          <p className="text-sm text-amber-600">
            提示：标注功能仅支持 PDF 文件，当前选择的文件包含非 PDF 格式，标注功能将被禁用。
          </p>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="handwritten"
            checked={handwritten}
            onCheckedChange={(checked) => setHandwritten(checked === true)}
          />
          <Label htmlFor="handwritten" className="cursor-pointer">
            手写文档
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="useRemoteOcrProvider"
            checked={useRemoteOcrProvider}
            onCheckedChange={(checked) => setUseRemoteOcrProvider(checked === true)}
          />
          <Label htmlFor="useRemoteOcrProvider" className="cursor-pointer">
            使用远程 OCR（默认百度）
          </Label>
        </div>
      </div>

      <Button onClick={handleUpload} disabled={files.length === 0 || isUploading} className="w-full" size="lg">
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            正在上传...
          </>
        ) : (
          annotate ? '上传并开始标注' : '上传并开始 OCR 提取'
        )}
      </Button>
    </div>
  );
}
