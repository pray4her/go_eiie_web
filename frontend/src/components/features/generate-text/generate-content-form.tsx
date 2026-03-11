'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';
import { FileUp, CheckCircle, XCircle } from 'lucide-react';
import { DegreeType } from '@/types';

interface GenerateContentFormProps {
  onJobCreated: () => void;
}

export function GenerateContentForm({ onJobCreated }: GenerateContentFormProps) {
  const [declarationFile, setDeclarationFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [excludedDegrees, setExcludedDegrees] = useState<DegreeType[]>([]);

  // 学位选项配置
  const degreeOptions: { value: DegreeType; label: string; description: string }[] = [
    { value: 'bachelor', label: '学士', description: '排除学士学位相关200字内容' },
    { value: 'master', label: '硕士', description: '排除硕士学位相关200字内容' },
    { value: 'doctor', label: '博士', description: '排除博士学位相关200字内容' },
  ];

  // 处理学位选择变化
  const handleDegreeToggle = (degree: DegreeType, checked: boolean) => {
    setExcludedDegrees(prev => {
      if (checked) {
        return [...prev, degree];
      } else {
        return prev.filter(d => d !== degree);
      }
    });
  };

  const onDrop = useCallback((acceptedFiles: File[], field: 'declaration' | 'resume') => {
    if (acceptedFiles.length > 0) {
      if (field === 'declaration') {
        setDeclarationFile(acceptedFiles[0]);
      } else {
        setResumeFile(acceptedFiles[0]);
      }
    }
  }, []);

  const { getRootProps: getDeclarationRootProps, getInputProps: getDeclarationInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'declaration'),
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
  });

  const { getRootProps: getResumeRootProps, getInputProps: getResumeInputProps } = useDropzone({
    onDrop: (files) => onDrop(files, 'resume'),
    maxFiles: 1,
    accept: {
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const handleSubmit = async () => {
    if (!declarationFile || !resumeFile) {
      toast.error('请确保两个文件都已上传。');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('proposal_file', declarationFile);
    formData.append('resume_file', resumeFile);
    
    // 添加学位过滤参数
    if (excludedDegrees.length > 0) {
      formData.append('excluded_degrees', excludedDegrees.join(','));
    }
    
    // 调试：打印 FormData 字段名与文件名
    try {
      const debugEntries: Array<{ key: string; value: string }> = [];
      for (const [key, value] of formData.entries()) {
        debugEntries.push({ key, value: value instanceof File ? value.name : String(value) });
      }
      console.log('[GenerateContentForm] FormData entries:', debugEntries);
    } catch {}

    try {
      const response = await api.post('/writing/generate', formData);
      if (response.data.job_id) {
        toast.success('任务已成功创建！');
        onJobCreated();
        // Reset form
        setDeclarationFile(null);
        setResumeFile(null);
        setExcludedDegrees([]);
      } else {
        toast.error('创建任务失败，未收到任务ID。');
      }
    } catch (error) {
      console.error('Submission failed', error);
      toast.error('创建任务时出错，请检查控制台获取详情。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDropzoneContent = (file: File | null, title: string) => {
    if (file) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
          <p className="font-semibold">{file.name}</p>
          <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-red-500"
            onClick={(e) => {
              e.stopPropagation(); // Prevent dropzone activation
              if (title.includes('申报书')) setDeclarationFile(null);
              else setResumeFile(null);
            }}
          >
            <XCircle className="w-4 h-4 mr-1" />
            移除
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <FileUp className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">拖拽文件至此, 或点击选择</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>200字一键生成</CardTitle>
        <CardDescription>请分别上传申报书和简历文件，我们将为您一键生成200字。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            {...getDeclarationRootProps()}
            className="p-8 border-2 border-dashed rounded-lg cursor-pointer flex items-center justify-center h-48"
          >
            <input {...getDeclarationInputProps()} />
            {renderDropzoneContent(declarationFile, '上传申报书文件')}
          </div>
          <div
            {...getResumeRootProps()}
            className="p-8 border-2 border-dashed rounded-lg cursor-pointer flex items-center justify-center h-48"
          >
            <input {...getResumeInputProps()} />
            {renderDropzoneContent(resumeFile, '上传简历文件')}
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium">内容生成选项</h3>
            <p className="text-xs text-muted-foreground">选择要排除的学位类型，默认生成全部内容</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {degreeOptions.map((option) => (
              <div key={option.value} className="flex items-start space-x-2">
                <Checkbox
                  id={`degree-${option.value}`}
                  checked={excludedDegrees.includes(option.value)}
                  onCheckedChange={(checked: boolean) => 
                    handleDegreeToggle(option.value, checked)
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={`degree-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    排除{option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {excludedDegrees.length > 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              将排除 {excludedDegrees.map(d => degreeOptions.find(o => o.value === d)?.label).join('、')} 相关的200字内容生成
            </div>
          )}
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={!declarationFile || !resumeFile || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? '正在创建任务...' : '开始生成'}
        </Button>
      </CardContent>
    </Card>
  );
}
