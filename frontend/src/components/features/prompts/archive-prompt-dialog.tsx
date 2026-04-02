'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { archivePromptType, getPromptErrorMessage } from '@/lib/prompts';
import { Button } from '@/components/ui/button';
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

interface ArchivePromptDialogProps {
  promptType: string;
  trigger: ReactNode;
  onSubmitted: () => Promise<void> | void;
}

export function ArchivePromptDialog({
  promptType,
  trigger,
  onSubmitted,
}: ArchivePromptDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

  async function handleArchive() {
    if (confirmText.trim() !== promptType) {
      toast.error('请输入完整的 Prompt 类型以确认归档');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await archivePromptType(promptType);
      toast.success(response.message || 'Prompt 类型已归档');
      setOpen(false);
      await onSubmitted();
    } catch (error) {
      toast.error(getPromptErrorMessage(error, '归档 Prompt 类型失败'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>归档 Prompt 类型</DialogTitle>
          <DialogDescription>
            归档会下线当前类型下的所有标签，但历史版本仍会保留。请输入完整类型名以继续。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="prompt-type-confirm">确认输入 `{promptType}`</Label>
          <Input
            id="prompt-type-confirm"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder={promptType}
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button type="button" variant="destructive" onClick={handleArchive} disabled={isSubmitting}>
            {isSubmitting ? '归档中...' : '确认归档'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
