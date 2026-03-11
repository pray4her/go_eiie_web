"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { ApiFile } from "@/types";
import { FileUploadZone } from "@/components/features/dashboard/file-upload-zone";
import { FileStatusTable } from "@/components/features/dashboard/file-status-table";
import { FileDetailsDrawer } from "@/components/features/dashboard/file-details-drawer";
import { useFileExtractionSubscription } from "@/hooks/use-file-extraction-subscription";
import { Container } from "@/components/ui/container";
import { PageHeader, PageTitle, PageDescription, PageActions } from "@/components/ui/page-header";
import { Section, SectionHeader, SectionTitle, SectionContent } from "@/components/ui/section";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { CustomerExportDialog } from "@/components/features/dashboard/customer-export-dialog";

export default function DashboardPage() {
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ApiFile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeParentId, setActiveParentId] = useState<number | null>(null);
  const [refreshSignalCounter, setRefreshSignalCounter] = useState(0);
  const [lastUploadAutoAnnotate, setLastUploadAutoAnnotate] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await api.get<ApiFile[]>("/files");
      const filteredFiles = response.data.filter(file => 
        (file.OriginalFileName.toLowerCase().endsWith('.zip') || 
         file.OriginalFileName.toLowerCase().endsWith('.rar')) ||
        file.TaskType === '信息提取'
      );
      setFiles(filteredFiles);
    } catch (error) {
      console.error("Failed to fetch files:", error);
      // Optionally, show a toast notification for fetch errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    const id = window.setInterval(() => {
      fetchFiles();
    }, 5000);
    return () => window.clearInterval(id);
  }, [fetchFiles]);

  useFileExtractionSubscription(activeParentId, {
    onProgress: ({ parentFileId }) => {
      if (isDrawerOpen && selectedFile?.ID === parentFileId) {
        setRefreshSignalCounter((x) => x + 1);
      }
    },
    onCompleted: ({ parentFileId }) => {
      fetchFiles();
      if (isDrawerOpen && selectedFile?.ID === parentFileId) {
        setRefreshSignalCounter((x) => x + 1);
      }
      if (lastUploadAutoAnnotate && activeParentId === parentFileId) {
        toast.info("自动标注正在后台执行", {
          description: "分类和信息提取已完成，自动标注将在后台继续运行，请稍后在“自动标注历史”中查看进度和结果。",
        });
      }
      setActiveParentId(null);
    },
    onCancelled: ({ parentFileId }) => {
      setFiles((prev) => prev.filter((f) => f.ID !== parentFileId));
      if (selectedFile?.ID === parentFileId) {
        setIsDrawerOpen(false);
        setSelectedFile(null);
      }
      if (activeParentId === parentFileId) {
        setActiveParentId(null);
      }
      toast.info("任务已取消", { description: "该任务已被取消并移除。" });
    },
  });

  const handleDeleteFile = async (file: ApiFile) => {
    try {
      const response = await api.delete(`/files/${file.ID}`);
      // 无论是首次删除(200 deleted)还是幂等成功(200 already deleted)，都从列表移除
      setFiles((prev) => prev.filter((f) => f.ID !== file.ID));
      
      const isProcessing = ['pending', 'preprocessing', 'processing', 'classifying', 'extracting'].includes(file.ProcessingStatus);
      const msg = response.data?.message === "already deleted" 
        ? "文件已被删除" 
        : (isProcessing ? "已取消任务并删除文件" : "文件已删除");
      toast.success(msg);

      if (selectedFile?.ID === file.ID) {
        setIsDrawerOpen(false);
        setSelectedFile(null);
      }
      if (activeParentId === file.ID) {
        setActiveParentId(null);
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (error as any).response?.status;
      if (status === 409) {
        toast.error("删除失败", { description: "正在删除中，请稍后刷新列表" });
      } else if (status === 403) {
        toast.error("无法删除", { description: "您没有权限删除此文件" });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toast.error("删除出错", { description: (error as any).message || "请稍后重试" });
      }
    }
  };

  const handleViewDetails = (file: ApiFile) => {
    // 在打开抽屉前主动移除背景上可能保持的焦点，避免 aria-hidden 期间仍有聚焦元素
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSelectedFile(file);
    setIsDrawerOpen(true);
  };

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <PageTitle>信息提取</PageTitle>
        <PageDescription>上传您的文件，系统将自动处理并提取信息。</PageDescription>
        <PageActions>
          <CustomerExportDialog />
        </PageActions>
      </PageHeader>

      <div className="space-y-8">
        <Section>
          <SectionHeader>
            <SectionTitle>第一步：上传文件</SectionTitle>
          </SectionHeader>
          <SectionContent>
            <Card>
              <CardHeader>
                <CardTitle>上传文件</CardTitle>
                <CardDescription>支持 zip/rar 压缩包，内含待处理文件。</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onUploadSuccess={fetchFiles}
                  onUploadCreated={(id, options) => {
                    setActiveParentId(id);
                    setLastUploadAutoAnnotate(!!options?.autoAnnotate);
                  }}
                />
              </CardContent>
            </Card>
          </SectionContent>
        </Section>

        <Section>
          <SectionHeader>
            <SectionTitle>第二步：查看处理状态</SectionTitle>
          </SectionHeader>
          <SectionContent>
            {isLoading ? (
              <SkeletonTable rows={6} columns={4} />
            ) : files.length === 0 ? (
              <EmptyState title="暂无文件" description="请先上传一个压缩包以开始信息提取。" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>文件处理进度</CardTitle>
                  <CardDescription>查看已上传压缩包的处理状态与详情。</CardDescription>
                </CardHeader>
                <CardContent>
                  <FileStatusTable 
                    files={files} 
                    onViewDetails={handleViewDetails} 
                    onDelete={handleDeleteFile}
                  />
                </CardContent>
              </Card>
            )}
          </SectionContent>
        </Section>
      </div>

      <FileDetailsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        file={selectedFile}
        refreshSignal={refreshSignalCounter}
      />
    </Container>
  );
}
