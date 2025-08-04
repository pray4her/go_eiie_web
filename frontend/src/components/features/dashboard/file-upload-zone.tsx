"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import api from "@/lib/api";
import { UploadCloud } from "lucide-react";

interface FileUploadZoneProps {
  onUploadSuccess: () => void;
}

export function FileUploadZone({ onUploadSuccess }: FileUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error("未选择任何文件或文件类型不被接受。");
      return;
    }
    
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    toast.loading("正在上传文件...", { id: "upload-toast" });

    try {
      await api.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("文件上传成功，已开始后台处理。", { id: "upload-toast" });
      onUploadSuccess();
    } catch (error) {
      toast.error("文件上传失败，请重试。", { id: "upload-toast" });
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    // You can add accepted file types here, e.g., accept: { 'application/zip': ['.zip'] }
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
      ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}
      ${isUploading ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input {...getInputProps()} disabled={isUploading} />
      <div className="flex flex-col items-center gap-2">
        <UploadCloud className="w-10 h-10 text-muted-foreground" />
        {isUploading ? (
          <p className="text-muted-foreground">正在上传...</p>
        ) : isDragActive ? (
          <p className="text-muted-foreground">松开以开始上传</p>
        ) : (
          <p className="text-muted-foreground">拖拽文件到此处，或点击选择文件</p>
        )}
      </div>
    </div>
  );
}

