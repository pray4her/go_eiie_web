"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ApiFile } from "@/types";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useState } from "react";

interface FileStatusTableProps {
  files: ApiFile[];
  onViewDetails: (file: ApiFile) => void;
  onDelete: (file: ApiFile) => Promise<void>;
}

export function FileStatusTable({ files, onViewDetails, onDelete }: FileStatusTableProps) {
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  const isProcessing = (status: string) => {
    return ['queued', 'pending', 'preprocessing', 'processing', 'classifying', 'extracting'].includes(status);
  };

  const getDeleteButtonText = (status: string, isDeleting: boolean) => {
    if (isDeleting) return "删除中...";
    if (isProcessing(status)) return "取消并删除";
    return "删除";
  };

  const getDeleteConfirmMessage = (status: string) => {
    if (isProcessing(status)) {
      return "确定要取消任务并删除文件吗？此操作不可恢复。";
    }
    return "确定要删除文件吗？此操作不可恢复。";
  };

  const handleDelete = async (file: ApiFile) => {
    const confirmMessage = getDeleteConfirmMessage(file.ProcessingStatus);
    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(file.ID));
    try {
      await onDelete(file);
    } catch (error) {
      // Error handling is done in parent, but we need to clear loading state if it fails and wasn't removed
      console.error(error);
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(file.ID);
        return next;
      });
    }
  };

  if (files.length === 0) {
    return (
      <EmptyState title="暂无文件" description="请先上传一个文件。" />
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            <TableHead>文件名</TableHead>
            <TableHead>上传时间</TableHead>
            <TableHead>处理状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.ID}>
              <TableCell className="max-w-xs truncate font-medium" title={file.OriginalFileName}>{file.OriginalFileName}</TableCell>
              <TableCell>{formatDate(file.CreatedAt)}</TableCell>
              <TableCell>
                <StatusBadge status={file.ProcessingStatus} />
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDelete(file)}
                  disabled={deletingIds.has(file.ID)}
                >
                  {getDeleteButtonText(file.ProcessingStatus, deletingIds.has(file.ID))}
                </Button>
                <Button variant="outline" size="sm" onClick={() => onViewDetails(file)}>
                  查看详情
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

