'use client';

import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { PromptRelease } from '@/types';
import { deletePromptRelease, getPromptErrorMessage } from '@/lib/prompts';
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

interface DeleteReleaseDialogProps {
  promptType: string;
  release: PromptRelease;
  trigger: ReactNode;
  onSubmitted: () => Promise<void> | void;
}

export function DeleteReleaseDialog({
  promptType,
  release,
  trigger,
  onSubmitted,
}: DeleteReleaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const response = await deletePromptRelease(promptType, release.label);
      toast.success(response.message || '标签已删除');
      setOpen(false);
      await onSubmitted();
    } catch (error) {
      toast.error(getPromptErrorMessage(error, '删除标签失败'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>删除标签</DialogTitle>
          <DialogDescription>
            你将删除标签 `{release.label}` 对应的发布记录。该操作不会删除历史版本，但会让该标签失去指向。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            取消
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
