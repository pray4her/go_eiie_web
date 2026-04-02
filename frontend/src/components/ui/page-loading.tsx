import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton, SkeletonTable } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type PageLoadingCardProps = {
  /** 辅助提示文案，默认「加载中…」 */
  message?: string;
  className?: string;
};

/**
 * 页面级整块加载占位（卡片 + 骨架），用于替换纯「正在加载…」文案。
 */
export function PageLoadingCard({ message = '加载中…', className }: PageLoadingCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="space-y-4 p-6" role="status" aria-live="polite" aria-busy="true">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
          <span>{message}</span>
        </div>
        <Skeleton className="h-24 w-full rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
      </CardContent>
    </Card>
  );
}

type ListLoadingPlaceholderProps = {
  message?: string;
  /** 是否附带表格形骨架（适合列表/表格区域） */
  withTableSkeleton?: boolean;
  className?: string;
};

/**
 * 列表/表格区域加载：短文案 + 行状骨架，可选表格骨架。
 */
export function ListLoadingPlaceholder({
  message = '加载中…',
  withTableSkeleton = false,
  className,
}: ListLoadingPlaceholderProps) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-live="polite" aria-busy="true">
      <p className="text-sm text-muted-foreground">{message}</p>
      {withTableSkeleton ? (
        <SkeletonTable rows={4} columns={4} />
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      )}
    </div>
  );
}

type AppShellLoadingProps = {
  className?: string;
};

/**
 * 全屏壳层加载（如鉴权 hydration 前），与其它页面骨架风格一致。
 */
export function AppShellLoading({ className }: AppShellLoadingProps) {
  return (
    <div
      className={cn('flex h-screen w-full flex-col items-center justify-center gap-4 px-4', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="加载中"
    >
      <Skeleton className="h-10 w-48 max-w-full rounded-md" />
      <Skeleton className="h-4 w-32 rounded-md" />
    </div>
  );
}
