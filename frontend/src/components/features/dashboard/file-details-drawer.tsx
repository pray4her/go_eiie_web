"use client";

import { useState, useEffect, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { ApiFile, ApiSubFile } from "@/types";
import { toast } from "sonner";
import { StatusBadge } from "./status-badge";
import { FILE_TYPE_OPTIONS, getFileTypeLabel } from "@/lib/utils";

interface FileDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: ApiFile | null;
  refreshSignal?: number;
}

export function FileDetailsDrawer({ open, onOpenChange, file, refreshSignal }: FileDetailsDrawerProps) {
  const focusTargetRef = useRef<HTMLDivElement | null>(null);
  const [subFiles, setSubFiles] = useState<ApiSubFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingTemplate, setIsExportingTemplate] = useState(false);
  const [isExportingClassifiedZip, setIsExportingClassifiedZip] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<number>>(new Set());
  const [isTriggering, setIsTriggering] = useState(false);
  const [updatingFileTypes, setUpdatingFileTypes] = useState<Set<number>>(new Set());
  const [editingFileTypeId, setEditingFileTypeId] = useState<number | null>(null);

  const fetchSubFiles = async (parentFileId: number, preserveSelection: boolean) => {
    setIsLoading(true);
    try {
      const response = await api.get<ApiSubFile[]>(`/files/${parentFileId}/children`);
      setSubFiles(response.data);
      setSelectedFileIds((prev) => {
        if (!preserveSelection) {
          return new Set();
        }

        const next = new Set<number>();
        const currentFileIds = new Set(response.data.map((item) => item.file_id));
        prev.forEach((id) => {
          if (currentFileIds.has(id)) {
            next.add(id);
          }
        });
        return next;
      });
    } catch (error) {
      console.error("Failed to fetch sub-files:", error);
      toast.error("加载子文件列表失败。");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && file) {
      fetchSubFiles(file.ID, false);
    } else {
      // 关闭抽屉时重置选中状态
      setSelectedFileIds(new Set());
    }
  }, [open, file]);

  useEffect(() => {
    if (open && file && typeof refreshSignal === 'number') {
      fetchSubFiles(file.ID, true);
    }
  }, [refreshSignal, open, file]);

  // 抽屉打开后将焦点移入抽屉内部，避免焦点留在被隐藏区域
  useEffect(() => {
    if (open && focusTargetRef.current) {
      // 微任务后聚焦，确保内容已渲染
      const id = window.setTimeout(() => {
        focusTargetRef.current?.focus();
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const handleExport = async () => {
    if (!file) return;

    setIsExporting(true);
    toast.loading("正在准备导出...", { id: "export-toast" });

    try {
      const response = await api.get(`/files/${file.ID}/export`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${file.OriginalFileName.split('.')[0]}_export.xlsx`; // fallback filename
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = decodeURIComponent(filenameMatch[1]);
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

  const handleExportTemplate = async () => {
    if (!file) return;

    setIsExportingTemplate(true);
    toast.loading("正在准备导出模板...", { id: "export-template-toast" });

    try {
      const response = await api.get(`/files/export/template/${file.ID}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `template_export_${file.ID}.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("模板已开始下载。", { id: "export-template-toast" });
    } catch (error) {
      console.error("Template export failed:", error);
      toast.error("导出模板失败，请重试。", { id: "export-template-toast" });
    } finally {
      setIsExportingTemplate(false);
    }
  };

  const handleExportClassifiedZip = async () => {
    if (!file) return;

    setIsExportingClassifiedZip(true);
    toast.loading("正在准备分类 ZIP...", { id: "export-classified-zip-toast" });

    try {
      const response = await api.get(`/files/${file.ID}/export-classified-zip`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: response.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `${file.OriginalFileName.split(".")[0]}_classified.zip`;
      if (contentDisposition) {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (utf8Match && utf8Match[1]) {
          filename = decodeURIComponent(utf8Match[1]);
        } else if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("分类 ZIP 已开始下载。", { id: "export-classified-zip-toast" });
    } catch (error: unknown) {
      console.error("Classified zip export failed:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const status = (error as any)?.response?.status;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (error as any)?.response?.data?.error || (error as any)?.response?.data?.message;
      const description =
        status === 409
          ? "分类尚未完成，当前无法导出分类 ZIP。"
          : message || "导出分类 ZIP 失败，请重试。";
      toast.error("导出失败", {
        id: "export-classified-zip-toast",
        description,
      });
    } finally {
      setIsExportingClassifiedZip(false);
    }
  };

  // 判断文件是否可以被选中（已完成分类但未提取信息）
  const isFileSelectable = (subFile: ApiSubFile) => {
    // 已完成分类且有分类结果，但还未提取信息的文件
    return subFile.has_classification_result && 
           subFile.processing_status !== 'extracting' && 
           subFile.processing_status !== 'completed';
  };

  // 判断文件是否可以修改类型（已分类状态）
  const isFileTypeEditable = (subFile: ApiSubFile) => {
    // 仅允许修改 StatusClassified（已分类，等待提取）状态的文件
    // 根据后端接口说明，状态应该是 'classifying' 或类似状态
    // 不允许修改 'extracting', 'completed', 'process_failed' 状态的文件
    return subFile.has_classification_result && 
           subFile.processing_status !== 'extracting' && 
           subFile.processing_status !== 'completed' &&
           subFile.processing_status !== 'process_failed' &&
           subFile.processing_status !== 'failed';
  };

  // 解析复合文件类型（用 | 分隔）
  const parseFileTypes = (fileType: string | undefined | null): string[] => {
    if (!fileType) return [];
    return fileType.split("|").map(t => t.trim()).filter(t => t.length > 0);
  };

  const parseMultiValue = (value: string | undefined | null): string[] => {
    if (!value) return [];
    return value.split("|").map((item) => item.trim()).filter((item) => item.length > 0);
  };

  const getFileNameWithoutExtension = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex <= 0) {
      return fileName;
    }
    return fileName.slice(0, lastDotIndex);
  };

  // 组合文件类型数组为字符串（用 | 分隔）
  const combineFileTypes = (types: string[]): string => {
    return types.filter(t => t.length > 0).join("|");
  };

  // 处理文件类型修改
  const handleFileTypeChange = async (fileId: number, newFileTypes: string[]) => {
    if (updatingFileTypes.has(fileId)) return;

    const newFileTypeString = combineFileTypes(newFileTypes);
    if (newFileTypes.length === 0) {
      toast.error("至少需要选择一个文件类型");
      return;
    }

    setUpdatingFileTypes(prev => new Set(prev).add(fileId));
    toast.loading("正在更新文件类型...", { id: `update-file-type-${fileId}` });

    try {
      const response = await api.put<{
        message: string;
        file_id: number;
        old_file_type?: string;
        new_file_type?: string;
        file_type?: string;
      }>(`/files/${fileId}/file-type`, {
        file_type: newFileTypeString,
      });

      toast.success("文件类型已更新", {
        id: `update-file-type-${fileId}`,
        description: response.data.message,
      });

      // 更新本地状态
      setSubFiles(prev => prev.map(subFile => 
        subFile.file_id === fileId 
          ? { ...subFile, file_type: newFileTypeString }
          : subFile
      ));
      
      // 关闭编辑模式
      setEditingFileTypeId(null);
    } catch (error: unknown) {
      console.error("Update file type failed:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).response?.data?.error || (error as any).message || "更新文件类型失败，请重试";
      toast.error("更新失败", {
        id: `update-file-type-${fileId}`,
        description: errorMessage,
      });
    } finally {
      setUpdatingFileTypes(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  // 处理删除文件类型
  const handleRemoveFileType = (fileId: number, currentTypes: string[], typeToRemove: string) => {
    const newTypes = currentTypes.filter(t => t !== typeToRemove);
    if (newTypes.length === 0) {
      toast.error("至少需要保留一个文件类型");
      return;
    }
    handleFileTypeChange(fileId, newTypes);
  };

  // 处理添加文件类型
  const handleAddFileType = (fileId: number, currentTypes: string[], newType: string) => {
    if (currentTypes.includes(newType)) {
      toast.error("该文件类型已存在");
      return;
    }
    handleFileTypeChange(fileId, [...currentTypes, newType]);
  };

  // 切换单个文件的选中状态
  const handleToggleFileSelection = (fileId: number) => {
    setSelectedFileIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const handleToggleSelectAll = () => {
    const selectableFiles = numberedSubFiles.filter(f => isFileSelectable(f));
    const allSelected = selectableFiles.every(f => selectedFileIds.has(f.file_id));
    
    if (allSelected) {
      // 取消全选
      setSelectedFileIds(prev => {
        const newSet = new Set(prev);
        selectableFiles.forEach(f => newSet.delete(f.file_id));
        return newSet;
      });
    } else {
      // 全选
      setSelectedFileIds(prev => {
        const newSet = new Set(prev);
        selectableFiles.forEach(f => newSet.add(f.file_id));
        return newSet;
      });
    }
  };

  // 触发信息提取
  const handleTriggerExtraction = async () => {
    if (selectedFileIds.size === 0) {
      toast.error("请至少选择一个文件");
      return;
    }

    setIsTriggering(true);
    toast.loading("正在触发信息提取...", { id: "trigger-extraction-toast" });

    try {
      const fileIdsArray = Array.from(selectedFileIds);
      const response = await api.post<{
        message: string;
        file_ids: number[];
        parent_id: number;
        files_count: number;
      }>("/files/trigger-extraction", {
        file_ids: fileIdsArray,
      });

      toast.success("信息提取已触发", {
        id: "trigger-extraction-toast",
        description: `已为 ${response.data.files_count} 个文件触发信息提取`,
      });

      // 清空选中状态
      setSelectedFileIds(new Set());
      
      // 触发刷新
      if (file) {
        await fetchSubFiles(file.ID, false);
      }
    } catch (error: unknown) {
      console.error("Trigger extraction failed:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (error as any).response?.data?.message || (error as any).message || "触发信息提取失败，请重试";
      toast.error("触发失败", {
        id: "trigger-extraction-toast",
        description: errorMessage,
      });
    } finally {
      setIsTriggering(false);
    }
  };

  // 格式化analysis_trace显示
  const formatAnalysisTrace = (trace: string | Record<string, unknown> | unknown[] | null | undefined): string => {
    if (!trace) return "N/A";
    
    if (typeof trace === "string") {
      return trace;
    }
    
    if (Array.isArray(trace)) {
      return trace.map((item, index) => {
        if (typeof item === "string") {
          return `${index + 1}. ${item}`;
        }
        return `${index + 1}. ${JSON.stringify(item, null, 2)}`;
      }).join("\n");
    }
    
    if (typeof trace === "object") {
      return JSON.stringify(trace, null, 2);
    }
    
    return String(trace);
  };

  // 获取analysis_trace的简短预览（用于表格显示）
  const getAnalysisTracePreview = (trace: string | Record<string, unknown> | unknown[] | null | undefined): string => {
    const fullText = formatAnalysisTrace(trace);
    if (fullText === "N/A") return "N/A";
    if (fullText.length <= 50) return fullText;
    return fullText.substring(0, 50) + "...";
  };

  const getDisplayFolderCategories = (subFile: ApiSubFile): string[] => {
    const folderCategories = parseMultiValue(
      subFile.folder_category ?? subFile.classification_result?.folder_category
    );
    if (folderCategories.length > 0) {
      return folderCategories;
    }

    const fileTypes = parseFileTypes(subFile.file_type);
    if (fileTypes.length > 0) {
      return fileTypes.map((type) => getFileTypeLabel(type));
    }

    const legacyCategories = parseFileTypes(subFile.classification_result?.category);
    if (legacyCategories.length > 0) {
      return legacyCategories.map((type) => getFileTypeLabel(type));
    }

    return ["未分类"];
  };

  const getDisplayClassifiedNames = (subFile: ApiSubFile): string[] => {
    const classifiedNames = parseMultiValue(
      subFile.classified_file_name ?? subFile.classification_result?.file_name
    );
    if (classifiedNames.length > 0) {
      return classifiedNames;
    }

    return [getFileNameWithoutExtension(subFile.original_file_name)];
  };

  const getDisplayFolderNamePairs = (subFile: ApiSubFile) => {
    const folders = getDisplayFolderCategories(subFile);
    const fileNames = getDisplayClassifiedNames(subFile);
    const fallbackFileName = fileNames[0] ?? getFileNameWithoutExtension(subFile.original_file_name);

    return folders.map((folder, index) => ({
      folder,
      fileName: fileNames[index] ?? fallbackFileName,
    }));
  };

  // 处理子文件数据（保持原有结构以兼容其他逻辑）
  const processedSubFiles = subFiles.map((subFile) => {
    return {
      ...subFile,
      displayPairs: getDisplayFolderNamePairs(subFile),
    };
  });

  const numberedSubFiles = processedSubFiles;
  const selectableFiles = numberedSubFiles.filter(f => isFileSelectable(f));
  const allSelectableSelected = selectableFiles.length > 0 && selectableFiles.every(f => selectedFileIds.has(f.file_id));
  const blockingStatuses = new Set(["queued", "pending", "preprocessing", "classifying"]);
  const hasPendingClassification = subFiles.some((item) => blockingStatuses.has(item.processing_status));
  const canExportClassifiedZip =
    subFiles.length > 0 && !hasPendingClassification && !isLoading && !!file;
  const classifiedZipTooltip = hasPendingClassification
    ? "分类尚未完成"
    : subFiles.length === 0
      ? "暂无子文件"
      : "按分类文件夹和标准文件名导出 ZIP";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <div ref={focusTargetRef} tabIndex={-1} className="absolute opacity-0 h-0 w-0" />
        <DrawerHeader>
          <DrawerTitle>文件详情: {file?.OriginalFileName}</DrawerTitle>
          <DrawerDescription>
            查看压缩包内的子文件、分类文件夹和标准文件名。勾选已完成分类的文件后可触发信息提取；双击“文件类型”字段可修改后端提取类型。
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 z-10 bg-background/95 backdrop-blur">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allSelectableSelected}
                    onCheckedChange={handleToggleSelectAll}
                    disabled={selectableFiles.length === 0}
                  />
                </TableHead>
                <TableHead className="w-[50px]">序号</TableHead>
                <TableHead className="w-[18%]">子文件名</TableHead>
                <TableHead className="w-[12%]">处理状态</TableHead>
                <TableHead className="w-[18%]">分类文件夹</TableHead>
                <TableHead className="w-[18%]">标准文件名</TableHead>
                <TableHead className="w-[14%]">文件类型</TableHead>
                <TableHead className="w-[20%]">分析过程</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24">
                    <div className="flex flex-col gap-2 py-2" role="status" aria-live="polite" aria-busy="true">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-full max-w-md" />
                      <Skeleton className="h-4 w-full max-w-sm" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : numberedSubFiles.length > 0 ? (
                numberedSubFiles.map((subFile, index) => {
                  // analysis_trace 在 classification_result 对象内部
                  const analysisTrace = subFile.classification_result?.analysis_trace;
                  const tracePreview = getAnalysisTracePreview(analysisTrace);
                  const traceFull = formatAnalysisTrace(analysisTrace);
                  const hasLongTrace = traceFull !== "N/A" && traceFull.length > 50;
                  const isSelectable = isFileSelectable(subFile);
                  const isSelected = selectedFileIds.has(subFile.file_id);
                  const isTypeEditable = isFileTypeEditable(subFile);
                  const isUpdating = updatingFileTypes.has(subFile.file_id);
                  const isEditing = editingFileTypeId === subFile.file_id;
                  const displayPairs = subFile.displayPairs;
                  
                  return (
                    <TableRow key={subFile.file_id}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleFileSelection(subFile.file_id)}
                          disabled={!isSelectable}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="max-w-xs truncate font-medium" title={subFile.original_file_name}>{subFile.original_file_name}</TableCell>
                      <TableCell>
                        <StatusBadge status={subFile.processing_status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {displayPairs.map(({ folder }, idx) => (
                            <Badge key={`${folder}-${idx}`} variant="secondary" className="text-xs">
                              {folder}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {displayPairs.map(({ fileName }, idx) => (
                            <Badge key={`${fileName}-${idx}`} variant="outline" className="text-xs">
                              {fileName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isEditing && isTypeEditable ? (
                          <div className="flex flex-wrap gap-1 items-center min-w-[200px]">
                            {(() => {
                              const currentTypes = parseFileTypes(subFile.file_type);
                              const availableTypes = FILE_TYPE_OPTIONS.filter(
                                opt => !currentTypes.includes(opt.value)
                              );
                              
                              return (
                                <>
                                  {currentTypes.map((type) => (
                                    <Badge
                                      key={type}
                                      variant="default"
                                      className="flex items-center gap-1 pr-1"
                                    >
                                      {getFileTypeLabel(type)}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFileType(subFile.file_id, currentTypes, type)}
                                        disabled={isUpdating || currentTypes.length <= 1}
                                        className="hover:bg-primary/80 rounded-full p-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="删除此类型"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  {availableTypes.length > 0 && (
                                    <Select
                                      onValueChange={(value) => {
                                        handleAddFileType(subFile.file_id, currentTypes, value);
                                      }}
                                      disabled={isUpdating}
                                    >
                                      <SelectTrigger className="h-6 w-auto min-w-[80px] text-xs px-2" size="sm">
                                        <SelectValue placeholder="+ 添加">
                                          <span className="text-muted-foreground">+ 添加</span>
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {availableTypes.map((option) => (
                                          <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={() => {
                                      if (!isUpdating) {
                                        setEditingFileTypeId(null);
                                      }
                                    }}
                                    disabled={isUpdating}
                                  >
                                    完成
                                  </Button>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div
                            className={`flex flex-wrap gap-1 items-center ${
                              isTypeEditable ? "cursor-pointer hover:opacity-80" : ""
                            }`}
                            onDoubleClick={() => {
                              if (isTypeEditable && !isUpdating) {
                                setEditingFileTypeId(subFile.file_id);
                              }
                            }}
                            title={isTypeEditable ? "双击修改文件类型" : undefined}
                          >
                            {(() => {
                              const fileTypes = parseFileTypes(subFile.file_type);
                              
                              if (fileTypes.length === 0) {
                                return (
                                  <span className="text-muted-foreground">未设置</span>
                                );
                              }
                              
                              return fileTypes.map((type, idx) => (
                                <Badge
                                  key={`${type}-${idx}`}
                                  variant="default"
                                  className="text-xs"
                                >
                                  {getFileTypeLabel(type)}
                                </Badge>
                              ));
                            })()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        {hasLongTrace ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help text-sm text-muted-foreground truncate block">
                                {tracePreview}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <pre className="whitespace-pre-wrap text-xs font-mono">
                                {traceFull}
                              </pre>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {tracePreview}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    没有找到子文件或该文件正在处理中。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DrawerFooter className="pt-2">
          <div className="flex gap-2 w-full">
            <Button
              onClick={handleTriggerExtraction}
              disabled={selectedFileIds.size === 0 || isTriggering}
              className="flex-1"
            >
              {isTriggering ? "触发中..." : `触发信息提取 (${selectedFileIds.size})`}
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              className="flex-1"
              onClick={handleExport}
              disabled={file?.ProcessingStatus !== "completed" || isExporting}
            >
              {isExporting ? "导出中..." : "导出结果 (Excel)"}
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              onClick={handleExportTemplate}
              disabled={file?.ProcessingStatus !== "completed" || isExportingTemplate}
            >
              {isExportingTemplate ? "导出中..." : "导出模板 (Excel)"}
            </Button>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={handleExportClassifiedZip}
                  disabled={!canExportClassifiedZip || isExportingClassifiedZip}
                >
                  {isExportingClassifiedZip ? "导出中..." : "导出分类 ZIP"}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{classifiedZipTooltip}</p>
            </TooltipContent>
          </Tooltip>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">关闭</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
