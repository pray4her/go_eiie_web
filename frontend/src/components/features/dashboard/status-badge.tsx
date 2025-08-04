"use client";

import { Badge } from "@/components/ui/badge";
import { ApiFile } from "@/types";

interface StatusBadgeProps {
  status: ApiFile["processing_status"];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: { label: "等待中", variant: "secondary" as const },
    processing: { label: "处理中", variant: "default" as const },
    classification: { label: "分类中", variant: "default" as const },
    completed: { label: "已完成", variant: "success" as const },
    failed: { label: "失败", variant: "destructive" as const },
  };

  const { label, variant } = statusConfig[status] || statusConfig.pending;

  return <Badge variant={variant}>{label}</Badge>;
}

