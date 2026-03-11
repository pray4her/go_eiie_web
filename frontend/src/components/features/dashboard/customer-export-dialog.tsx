"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { Download } from "lucide-react";

export function CustomerExportDialog() {
  const [open, setOpen] = useState(false);
  const [customerID, setCustomerID] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!customerID.trim()) {
      toast.error("请输入客户号");
      return;
    }

    setIsExporting(true);
    toast.loading("正在准备导出客户模板...", { id: "customer-export-toast" });

    try {
      const response = await api.get(`/files/export/template/by-customer/${customerID.trim()}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `customer_${customerID.trim()}_templates.xlsx`;
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

      toast.success("客户模板文件已开始下载。", { id: "customer-export-toast" });
      setOpen(false);
    } catch (error) {
      console.error("Customer export failed:", error);
      toast.error("导出失败，请检查客户号是否正确或稍后重试。", { id: "customer-export-toast" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          按客户导出
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>按客户号导出模板</DialogTitle>
          <DialogDescription>
            请输入客户号，系统将导出该客户下所有文件的 Excel 汇总模板。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer-id" className="text-right">
              客户号
            </Label>
            <Input
              id="customer-id"
              value={customerID}
              onChange={(e) => setCustomerID(e.target.value)}
              placeholder="请输入客户号"
              className="col-span-3"
              disabled={isExporting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "导出中..." : "开始导出"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
