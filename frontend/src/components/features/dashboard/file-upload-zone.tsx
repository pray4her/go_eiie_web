"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import api from "@/lib/api";
import { UploadCloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface FileUploadZoneProps {
  onUploadSuccess?: () => void;
  onUploadCreated?: (parentFileId: number, options?: { autoAnnotate: boolean }) => void;
}

export function FileUploadZone({ onUploadSuccess, onUploadCreated }: FileUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [autoAnnotate, setAutoAnnotate] = useState(false);
  const [expertName, setExpertName] = useState("");

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error("未选择任何文件或文件类型不被接受。");
      return;
    }
    if (!customerId.trim()) {
      toast.error("请先输入客户号。");
      return;
    }
    
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("customer_id", customerId.trim());
    formData.append("auto_annotate", autoAnnotate ? "true" : "false");
    if (expertName.trim()) {
      formData.append("expert_name", expertName.trim());
    }

    setIsUploading(true);
    toast.loading("正在上传文件...", { id: "upload-toast" });

    try {
      const response = await api.post<{ file_id: number; message: string }>("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const fileId = response.data?.file_id;
      toast.success("文件上传成功，已开始后台处理。", { id: "upload-toast" });
      if (typeof fileId === 'number') {
        onUploadCreated?.(fileId, { autoAnnotate });
      }
      onUploadSuccess?.();
    } catch (error) {
      toast.error("文件上传失败，请重试。", { id: "upload-toast" });
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    // You can add accepted file types here, e.g., accept: { 'application/zip': ['.zip'] }
  });

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-2">
        <Label htmlFor="customerId">客户号</Label>
        <Input
          id="customerId"
          placeholder="请输入客户号"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          disabled={isUploading}
          onClick={(e) => e.stopPropagation()}
          onKeyDownCapture={(e) => e.stopPropagation()}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="autoAnnotate"
            checked={autoAnnotate}
            onCheckedChange={(checked) => setAutoAnnotate(checked === true)}
            disabled={isUploading}
          />
          <Label
            htmlFor="autoAnnotate"
            className="cursor-pointer select-none"
          >
            自动标注（信息提取完成后自动触发 OCR 标注）
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          开启后：在分类和信息提取完成后会继续执行自动标注，整体耗时更长；会对压缩包中每个支持的文件（PDF、DOCX、常见图片格式）进行自动标注。
        </p>

        <div className="mt-2 grid w-full max-w-sm items-center gap-2">
          <Label htmlFor="expertName">专家姓名（可选）</Label>
          <Input
            id="expertName"
            placeholder="请输入专家姓名，将注入到 OCR Prompt 中"
            value={expertName}
            onChange={(e) => setExpertName(e.target.value)}
            disabled={isUploading}
            onClick={(e) => e.stopPropagation()}
            onKeyDownCapture={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <div
        {...getRootProps()}
        aria-busy={isUploading}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors
        ${isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}
        ${isUploading ? "opacity-60" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} disabled={isUploading} />
        <div className="flex flex-col items-center gap-3">
          <UploadCloud className="h-10 w-10 text-muted-foreground" />
          {isUploading ? (
            <p className="text-muted-foreground">正在上传...</p>
          ) : isDragActive ? (
            <p className="text-muted-foreground">松开以开始上传</p>
          ) : (
            <>
              <p className="text-muted-foreground">拖拽文件到此处，或使用下方按钮选择文件</p>
            </>
          )}
        </div>
        {!isUploading && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={open}
              className="text-sm text-foreground underline-offset-4 hover:underline"
            >
              选择文件
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

