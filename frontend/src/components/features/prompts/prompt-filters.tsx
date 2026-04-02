'use client';

import { Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PromptFiltersProps {
  promptType: string;
  label: string;
  isLoading: boolean;
  onPromptTypeChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export function PromptFilters({
  promptType,
  label,
  isLoading,
  onPromptTypeChange,
  onLabelChange,
  onSearch,
  onReset,
}: PromptFiltersProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_auto]">
      <Input
        value={promptType}
        onChange={(event) => onPromptTypeChange(event.target.value)}
        placeholder="按 Prompt 类型筛选，例如 CLASSIFICATION"
        disabled={isLoading}
      />
      <Input
        value={label}
        onChange={(event) => onLabelChange(event.target.value)}
        placeholder="按标签筛选，例如 production / staging"
        disabled={isLoading}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onSearch} disabled={isLoading}>
          <Search className="h-4 w-4" />
          查询
        </Button>
        <Button type="button" variant="outline" onClick={onReset} disabled={isLoading}>
          <RotateCcw className="h-4 w-4" />
          重置
        </Button>
      </div>
    </div>
  );
}
