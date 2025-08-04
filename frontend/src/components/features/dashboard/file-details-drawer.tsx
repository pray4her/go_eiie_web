"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { ApiFile, ApiSubFile } from "@/types";
import { toast } from "sonner";

interface FileDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: ApiFile | null;
}

export function FileDetailsDrawer({ open, onOpenChange, file }: FileDetailsDrawerProps) {
  const [subFiles, setSubFiles] = useState<ApiSubFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (open && file) {
      const fetchSubFiles = async () => {
        setIsLoading(true);
        try {
          const response = await api.get(`/files/${file.id}/children`);
          setSubFiles(response.data);
        } catch (error) {
          console.error("Failed to fetch sub-files:", error);
          toast.error("加载子文件列表失败。");
        } finally {
          setIsLoading(false);
        }
      };
      fetchSubFiles();
    }
  }, [open, file]);

  const handleExport = async () => {
    if (!file) return;

    setIsExporting(true);
    toast.loading("正在准备导出...", { id: "export-toast" });

    try {
      const response = await api.get(`/files/${file.id}/export`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${file.filename.split('.')[0]}_export.xlsx`; // fallback filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("文件已开始下载。", { id: "export-toast" });
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("导出失败，请重试。", { id: "export-toast" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>文件详情: {file?.filename}</DrawerTitle>
          <DrawerDescription>
            查看压缩包内的子文件及其处理状态。
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>子文件名</TableHead>
                <TableHead>AI分类结果</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    正在加载...
                  </TableCell>
                </TableRow>
              ) : subFiles.length > 0 ? (
                subFiles.map((subFile) => (
                  <TableRow key={subFile.id}>
                    <TableCell>{subFile.filename}</TableCell>
                    <TableCell>{subFile.file_type || "N/A"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    没有找到子文件。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DrawerFooter className="pt-2">
          <Button
            onClick={handleExport}
            disabled={file?.processing_status !== "completed" || isExporting}
          >
            {isExporting ? "导出中..." : "导出结果 (Excel)"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">关闭</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

