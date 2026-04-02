import { PromptResolved } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { compactHash, formatPromptDate } from '@/components/features/prompts/prompt-utils';

interface PromptDetailSummaryProps {
  data: PromptResolved | null;
  selectedLabel: string;
}

function PromptTextBlock({
  title,
  content,
  placeholder,
}: {
  title: string;
  content?: string | null;
  placeholder: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {content ? (
          <pre className="max-h-80 overflow-auto rounded-lg bg-muted/40 p-4 text-sm whitespace-pre-wrap break-words">
            {content}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">{placeholder}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PromptDetailSummary({
  data,
  selectedLabel,
}: PromptDetailSummaryProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>当前标签未发布</CardTitle>
          <CardDescription>
            标签 `{selectedLabel || 'production'}` 当前没有生效版本。你仍然可以在“版本”与“标签”分段里继续创建版本或重新发布。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-xl">
              {data.prompt.prompt_type} · v{data.prompt.version}
            </CardTitle>
            <CardDescription>
              当前查看标签 `{data.label}` 下的生效 Prompt，可据此创建新版本或重新发布。
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={data.label === 'production' ? 'default' : 'outline'}>
              {data.label}
            </Badge>
            <Badge variant={data.is_protected ? 'warning' : 'secondary'}>
              {data.is_protected ? '受保护标签' : '普通标签'}
            </Badge>
            {data.cache_source ? <Badge variant="outline">缓存来源：{data.cache_source}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-sm text-muted-foreground">Prompt ID</div>
            <div className="mt-1 font-mono text-lg">{data.prompt.id || '-'}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-sm text-muted-foreground">模型</div>
            <div className="mt-1 text-sm font-medium">{data.model_name || '-'}</div>
            <div className="text-xs text-muted-foreground">{data.provider || '-'}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-sm text-muted-foreground">Schema Hash</div>
            <div className="mt-1 font-mono text-sm">{compactHash(data.schema_hash)}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="text-sm text-muted-foreground">最近发布时间</div>
            <div className="mt-1 text-sm font-medium">{formatPromptDate(data.release_at)}</div>
            <div className="text-xs text-muted-foreground">{data.release_by || '-'}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <PromptTextBlock
          title="System Prompt"
          content={data.prompt.system_prompt}
          placeholder="当前接口未返回 system_prompt 全文，或该标签尚未暴露完整内容。"
        />
        <PromptTextBlock
          title="User Prompt Template"
          content={data.prompt.user_prompt_template}
          placeholder="当前接口未返回 user_prompt_template 全文，或该标签尚未暴露完整内容。"
        />
      </div>

      <PromptTextBlock
        title="JSON Schema"
        content={data.prompt.json_schema}
        placeholder="当前接口未返回 json_schema 内容。"
      />
    </div>
  );
}
