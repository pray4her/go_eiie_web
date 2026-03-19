"use client";

import { Badge } from "@/components/ui/badge";
import {
  ApiFile,
  JobStatus,
  AutoAnnotationJobStatus,
  ResearchPaperJobStatus,
  ResumeProcessJobStatus,
  ResumeProcessSecondaryStatus,
} from "@/types";

interface StatusBadgeProps {
  status:
    | ApiFile["ProcessingStatus"]
    | JobStatus
    | AutoAnnotationJobStatus
    | ResearchPaperJobStatus
    | ResumeProcessJobStatus
    | ResumeProcessSecondaryStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    queued: { label: "排队中", variant: "secondary" as const },
    pending: { label: "等待中", variant: "secondary" as const },
    preprocessing: { label: "预处理中", variant: "default" as const },
    processing: { label: "处理中", variant: "default" as const },
    classifying: { label: "分类中", variant: "default" as const },
    classified: { label: "已分类", variant: "secondary" as const },
    extracting: { label: "提取中", variant: "default" as const },
    annotating: { label: "标注中", variant: "default" as const },
    running: { label: "OCR/标注中", variant: "default" as const },
    unsupported: { label: "不支持", variant: "secondary" as const },
    completed: { label: "已完成", variant: "success" as const },
    completed_partial: { label: "部分完成", variant: "warning" as const },
    secondary_completed: { label: "二次完成", variant: "success" as const },
    failed: { label: "失败", variant: "destructive" as const },
    process_failed: { label: "处理失败", variant: "destructive" as const },
    failed_partial: { label: "部分失败", variant: "warning" as const },
    partial: { label: "部分成功", variant: "warning" as const },
    idle: { label: "未二次生成", variant: "secondary" as const },
    retrying: { label: "自动重试中", variant: "default" as const },
  } as const;

  const statusEntry = statusConfig[status as keyof typeof statusConfig];
  const { label, variant } = statusEntry || statusConfig.pending;

  return <Badge variant={variant}>{label}</Badge>;
}
