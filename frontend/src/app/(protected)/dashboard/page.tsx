"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { ApiFile } from "@/types";
import { FileUploadZone } from "@/components/features/dashboard/file-upload-zone";
import { FileStatusTable } from "@/components/features/dashboard/file-status-table";
import { FileDetailsDrawer } from "@/components/features/dashboard/file-details-drawer";

export default function DashboardPage() {
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ApiFile | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await api.get("/files");
      setFiles(response.data);
    } catch (error) {
      console.error("Failed to fetch files:", error);
      // Optionally, show a toast notification for fetch errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles(); // Initial fetch
    const intervalId = setInterval(fetchFiles, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [fetchFiles]);

  const handleViewDetails = (file: ApiFile) => {
    setSelectedFile(file);
    setIsDrawerOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">信息提取</h1>
        <p className="text-muted-foreground mt-1">
          上传您的文件，系统将自动处理并提取信息。
        </p>
      </header>
      
      <main className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">第一步：上传文件</h2>
          <FileUploadZone onUploadSuccess={fetchFiles} />
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">第二步：查看处理状态</h2>
          {isLoading ? (
            <div className="flex justify-center items-center h-48 border rounded-lg">
              <p>正在加载文件列表...</p>
            </div>
          ) : (
            <FileStatusTable files={files} onViewDetails={handleViewDetails} />
          )}
        </section>
      </main>

      <FileDetailsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        file={selectedFile}
      />
    </div>
  );
}
