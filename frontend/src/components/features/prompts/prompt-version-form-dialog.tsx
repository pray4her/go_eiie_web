'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { CreatePromptVersionRequest, PromptMutationResponse } from '@/types';
import {
  createPrompt,
  createPromptVersion,
  getPromptErrorMessage,
} from '@/lib/prompts';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const promptVersionSchema = z.object({
  name: z.string().trim().min(1, '请输入 Prompt 名称'),
  prompt_type: z.string().trim().optional(),
  provider: z.string().trim().min(1, '请输入 provider'),
  model_name: z.string().trim().min(1, '请输入模型名称'),
  system_prompt: z.string().trim().min(1, '请输入 system prompt'),
  user_prompt_template: z.string().trim().min(1, '请输入 user prompt template'),
  json_schema: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    }, 'json_schema 需要是合法 JSON'),
  publish_label: z.string().trim().optional(),
});

type PromptVersionFormValues = z.infer<typeof promptVersionSchema>;

interface PromptVersionFormDialogProps {
  mode: 'create' | 'version';
  promptType?: string;
  initialValues?: Partial<CreatePromptVersionRequest>;
  trigger: ReactNode;
  onSubmitted: (response: PromptMutationResponse) => Promise<void> | void;
}

function buildDefaultValues(
  mode: 'create' | 'version',
  promptType?: string,
  initialValues?: Partial<CreatePromptVersionRequest>
): PromptVersionFormValues {
  return {
    name: initialValues?.name ?? '',
    prompt_type: mode === 'create' ? initialValues?.prompt_type ?? promptType ?? '' : undefined,
    provider: initialValues?.provider ?? '',
    model_name: initialValues?.model_name ?? '',
    system_prompt: initialValues?.system_prompt ?? '',
    user_prompt_template: initialValues?.user_prompt_template ?? '',
    json_schema: initialValues?.json_schema ?? '',
    publish_label: '',
  };
}

export function PromptVersionFormDialog({
  mode,
  promptType,
  initialValues,
  trigger,
  onSubmitted,
}: PromptVersionFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const defaultValues = useMemo(
    () => buildDefaultValues(mode, promptType, initialValues),
    [initialValues, mode, promptType]
  );

  const form = useForm<PromptVersionFormValues>({
    resolver: zodResolver(promptVersionSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  async function submitForm(shouldPublish: boolean) {
    await form.handleSubmit(async (values) => {
      if (mode === 'create' && !values.prompt_type?.trim()) {
        form.setError('prompt_type', { message: '请输入 Prompt 类型' });
        return;
      }

      if (shouldPublish && !values.publish_label?.trim()) {
        form.setError('publish_label', { message: '请输入发布标签' });
        return;
      }

      const payload: CreatePromptVersionRequest = {
        name: values.name.trim(),
        provider: values.provider.trim(),
        model_name: values.model_name.trim(),
        system_prompt: values.system_prompt.trim(),
        user_prompt_template: values.user_prompt_template.trim(),
        json_schema: values.json_schema?.trim() || undefined,
        publish_label: shouldPublish ? values.publish_label?.trim() : undefined,
      };

      if (mode === 'create') {
        payload.prompt_type = values.prompt_type?.trim();
      }

      setIsSaving(true);
      try {
        const response =
          mode === 'create'
            ? await createPrompt(payload)
            : await createPromptVersion(promptType || '', payload);

        toast.success(response.message || '保存成功');
        setOpen(false);
        await onSubmitted(response);
      } catch (error) {
        toast.error(
          getPromptErrorMessage(
            error,
            mode === 'create' ? '创建 Prompt 失败' : '创建新版本失败'
          )
        );
      } finally {
        setIsSaving(false);
      }
    })();
  }

  const actionLabel = mode === 'create' ? '创建 Prompt' : '创建新版本';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? '创建某个 Prompt 类型的首个版本，并可选同步发布到指定标签。'
              : `为 ${promptType} 创建一个新的不可变版本，并可选同步发布。`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名称</FormLabel>
                    <FormControl>
                      <Input placeholder="例如 Classification Prompt v5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === 'create' ? (
                <FormField
                  control={form.control}
                  name="prompt_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt 类型</FormLabel>
                      <FormControl>
                        <Input placeholder="例如 CLASSIFICATION" {...field} />
                      </FormControl>
                      <FormDescription>建议使用稳定的大写类型键。</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="rounded-lg border bg-muted/20 px-4 py-3">
                  <div className="text-sm text-muted-foreground">Prompt 类型</div>
                  <div className="mt-1 font-medium">{promptType}</div>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="例如 openrouter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>模型名称</FormLabel>
                    <FormControl>
                      <Input placeholder="例如 google/gemini-2.5-pro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="system_prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormControl>
                    <Textarea placeholder="请输入 system prompt" className="min-h-36" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="user_prompt_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User Prompt Template</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入 user prompt template"
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="json_schema"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>JSON Schema</FormLabel>
                  <FormControl>
                    <Textarea placeholder='例如 {"type":"object"}' className="min-h-28" {...field} />
                  </FormControl>
                  <FormDescription>可留空，但若填写必须是合法 JSON。</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="publish_label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>发布标签（可选）</FormLabel>
                  <FormControl>
                    <Input placeholder="例如 staging / production" {...field} />
                  </FormControl>
                  <FormDescription>
                    仅在点击“创建并发布”时使用；“仅创建”不会写入标签。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>
            取消
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={() => submitForm(false)} disabled={isSaving}>
              {isSaving ? '提交中...' : mode === 'create' ? '仅创建' : '仅创建新版本'}
            </Button>
            <Button type="button" onClick={() => submitForm(true)} disabled={isSaving}>
              {isSaving ? '提交中...' : mode === 'create' ? '创建并发布' : '创建并发布新版本'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
