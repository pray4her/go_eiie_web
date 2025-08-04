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

interface FileStatusTableProps {
  files: ApiFile[];
  onViewDetails: (file: ApiFile) => void;
}

export function FileStatusTable({ files, onViewDetails }: FileStatusTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>文件名</TableHead>
            <TableHead>上传时间</TableHead>
            <TableHead>处理状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.length > 0 ? (
            files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">{file.filename}</TableCell>
                <TableCell>{formatDate(file.created_at)}</TableCell>
                <TableCell>
                  <StatusBadge status={file.processing_status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(file)}>
                    查看详情
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                暂无文件。请先上传一个文件。
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

