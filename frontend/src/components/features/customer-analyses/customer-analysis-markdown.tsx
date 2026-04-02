'use client';

import ReactMarkdown, { type Components } from 'react-markdown';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** react-markdown 组件映射：紧凑、适合分析结论长文 */
export const customerAnalysisMarkdownComponents = {
  h1: ({ ...props }) => (
    <h1
      className="mt-5 mb-2 text-lg font-semibold tracking-tight text-foreground first:mt-0"
      {...props}
    />
  ),
  h2: ({ ...props }) => (
    <h2 className="mt-4 mb-2 text-base font-semibold text-foreground first:mt-0" {...props} />
  ),
  h3: ({ ...props }) => (
    <h3 className="mt-3 mb-1.5 text-sm font-semibold text-foreground first:mt-0" {...props} />
  ),
  p: ({ ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
  ul: ({ ...props }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0" {...props} />,
  ol: ({ ...props }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0" {...props} />,
  li: ({ ...props }) => <li className="leading-relaxed [&>p]:mb-1" {...props} />,
  strong: ({ ...props }) => <strong className="font-semibold text-foreground" {...props} />,
  em: ({ ...props }) => <em className="italic" {...props} />,
  hr: ({ ...props }) => <hr className="my-4 border-border" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote
      className="my-3 border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground italic"
      {...props}
    />
  ),
  a: ({ href, children, ...props }) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-2 break-all hover:opacity-90"
      target="_blank"
      rel="noreferrer noopener"
      {...props}
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className);
    if (!isBlock) {
      return (
        <code
          className="rounded-md border border-border/60 bg-muted/70 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn('block font-mono text-xs leading-relaxed text-foreground', className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="my-3 overflow-x-auto rounded-lg border border-border/60 bg-muted/50 p-3 text-xs leading-relaxed"
      {...props}
    >
      {children}
    </pre>
  ),
  table: ({ ...props }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full min-w-[240px] border-collapse text-sm" {...props} />
    </div>
  ),
  thead: ({ ...props }) => <thead className="bg-muted/50" {...props} />,
  th: ({ ...props }) => (
    <th className="border-b border-border px-3 py-2 text-left font-semibold text-foreground" {...props} />
  ),
  td: ({ ...props }) => <td className="border-b border-border/60 px-3 py-2 align-top leading-relaxed" {...props} />,
} satisfies Components;

interface CustomerAnalysisThoughtCollapsibleProps {
  text: string;
}

/** 思考过程默认折叠，减轻主阅读路径干扰 */
export function CustomerAnalysisThoughtCollapsible({ text }: CustomerAnalysisThoughtCollapsibleProps) {
  return (
    <details className="group/details overflow-hidden rounded-xl border border-border/80 bg-muted/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/details:rotate-180" />
        <span>模型思考过程</span>
      </summary>
      <div className="border-t border-border/60 bg-muted/20 px-4 py-3">
        <pre className="max-h-[min(28rem,55vh)] overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground">
          {text}
        </pre>
      </div>
    </details>
  );
}

interface CustomerAnalysisAnswerCardProps {
  text: string;
  title?: string;
  /** 嵌在外层卡片内时使用更轻的视觉层级 */
  variant?: 'default' | 'embedded';
}

/** 回答/结论文本按 Markdown 渲染，带清晰卡片层级 */
export function CustomerAnalysisAnswerCard({
  text,
  title = '回答',
  variant = 'default',
}: CustomerAnalysisAnswerCardProps) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const isEmbedded = variant === 'embedded';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-card',
        isEmbedded
          ? 'border-border/55 shadow-none bg-muted/15'
          : 'border-border/90 shadow-sm'
      )}
    >
      <div
        className={cn(
          'border-b border-border/60 px-4 py-2.5',
          isEmbedded ? 'bg-muted/20' : 'bg-muted/25'
        )}
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <div className="max-h-[min(72vh,60rem)] overflow-auto px-4 py-4">
        <div className="min-h-0 text-sm text-foreground">
          <ReactMarkdown components={customerAnalysisMarkdownComponents}>{trimmed}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
