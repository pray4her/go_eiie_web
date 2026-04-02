'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CustomerAnalysisTriggerFormProps {
  customerId: string;
  includeFileIds: string;
  excludeFileIds: string;
  isLoadingSummary: boolean;
  isTriggering: boolean;
  onCustomerIdChange: (value: string) => void;
  onIncludeFileIdsChange: (value: string) => void;
  onExcludeFileIdsChange: (value: string) => void;
  onLoadSummary: () => void;
  onTrigger: () => void;
}

export function CustomerAnalysisTriggerForm({
  customerId,
  includeFileIds,
  excludeFileIds,
  isLoadingSummary,
  isTriggering,
  onCustomerIdChange,
  onIncludeFileIdsChange,
  onExcludeFileIdsChange,
  onLoadSummary,
  onTrigger,
}: CustomerAnalysisTriggerFormProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-2 md:max-w-sm">
        <Label htmlFor="customer-analysis-customer-id">客户号</Label>
        <Input
          id="customer-analysis-customer-id"
          inputMode="numeric"
          placeholder="请输入客户号"
          value={customerId}
          onChange={(event) => onCustomerIdChange(event.target.value)}
          disabled={isLoadingSummary || isTriggering}
        />
        <p className="text-xs text-muted-foreground">
          客户号分析按客户维度聚合已分类文件，优先展示最新且未过期的稳定结果。
        </p>
      </div>

      <details className="rounded-lg border bg-muted/30 p-4">
        <summary className="cursor-pointer text-sm font-medium">高级范围控制（可选）</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="customer-analysis-include-file-ids">仅分析这些文件 ID</Label>
            <Input
              id="customer-analysis-include-file-ids"
              placeholder="例如 101,102,104"
              value={includeFileIds}
              onChange={(event) => onIncludeFileIdsChange(event.target.value)}
              disabled={isTriggering}
            />
            <p className="text-xs text-muted-foreground">
              留空时默认纳入该客户号下所有已分类文件。
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer-analysis-exclude-file-ids">排除这些文件 ID</Label>
            <Input
              id="customer-analysis-exclude-file-ids"
              placeholder="例如 103,105"
              value={excludeFileIds}
              onChange={(event) => onExcludeFileIdsChange(event.target.value)}
              disabled={isTriggering}
            />
            <p className="text-xs text-muted-foreground">
              用于从默认范围或 include 范围中排除特定文件。
            </p>
          </div>
        </div>
      </details>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          onClick={onLoadSummary}
          disabled={isLoadingSummary || isTriggering}
        >
          {isLoadingSummary ? '加载中...' : '加载最新结果'}
        </Button>
        <Button onClick={onTrigger} disabled={isTriggering}>
          {isTriggering ? '触发中...' : '开始分析'}
        </Button>
      </div>
    </div>
  );
}
