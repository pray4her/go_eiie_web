'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PromptRecord } from '@/types';
import {
  getPromptErrorMessage,
  publishPromptRelease,
} from '@/lib/prompts';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PublishReleaseDialogProps {
  promptType: string;
  versions: PromptRecord[];
  trigger: ReactNode;
  initialLabel?: string;
  initialPromptId?: number;
  onSubmitted: () => Promise<void> | void;
}

export function PublishReleaseDialog({
  promptType,
  versions,
  trigger,
  initialLabel,
  initialPromptId,
  onSubmitted,
}: PublishReleaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(initialLabel ?? '');
  const [selectedPromptId, setSelectedPromptId] = useState(
    initialPromptId ? String(initialPromptId) : versions[0]?.id ? String(versions[0].id) : ''
  );
  const [description, setDescription] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultPromptId = useMemo(() => {
    if (initialPromptId) return String(initialPromptId);
    return versions[0]?.id ? String(versions[0].id) : '';
  }, [initialPromptId, versions]);

  useEffect(() => {
    if (!open) return;

    setLabel(initialLabel ?? '');
    setSelectedPromptId(defaultPromptId);
    setDescription('');
    setIsProtected(false);
  }, [defaultPromptId, initialLabel, open]);

  async function handleSubmit() {
    if (!label.trim()) {
      toast.error('请输入目标标签');
      return;
    }

    if (!selectedPromptId) {
      toast.error('请选择要发布的版本');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await publishPromptRelease(promptType, label.trim(), {
        prompt_id: Number(selectedPromptId),
        description: description.trim() || undefined,
        is_protected: isProtected,
      });

      toast.success(response.message || '发布成功');
      setOpen(false);
      await onSubmitted();
    } catch (error) {
      toast.error(getPromptErrorMessage(error, '发布标签失败'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>发布或回滚标签</DialogTitle>
          <DialogDescription>
            选择目标版本后，标签会被切换到对应 Prompt ID。该操作同时适用于首次发布和回滚。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-release-label">目标标签</Label>
            <Input
              id="prompt-release-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="例如 production 或 staging"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>目标版本</Label>
            <Select value={selectedPromptId} onValueChange={setSelectedPromptId} disabled={isSubmitting}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择一个版本" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={String(version.id)}>
                    {`v${version.version} · ${version.id} · ${version.model_name || version.name || '未命名版本'}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-release-description">说明（可选）</Label>
            <Input
              id="prompt-release-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="例如 promote to staging"
              disabled={isSubmitting}
            />
          </div>

          <label className="flex items-center gap-3 rounded-lg border px-4 py-3">
            <Checkbox checked={isProtected} onCheckedChange={setIsProtected} disabled={isSubmitting} />
            <div className="space-y-1">
              <div className="text-sm font-medium">将标签设为受保护</div>
              <p className="text-xs text-muted-foreground">
                开启后，该标签后续应禁止直接删除，适合 production 等关键环境。
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || versions.length === 0}>
            {isSubmitting ? '发布中...' : '确认发布'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
