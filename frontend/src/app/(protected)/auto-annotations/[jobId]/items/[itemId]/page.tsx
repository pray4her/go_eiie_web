'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { PageLoadingCard } from '@/components/ui/page-loading';
import { PageHeader, PageTitle } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AutoAnnotationJobDetail, AutoAnnotationItem } from '@/types';
import { fetchAutoAnnotationJob } from '@/lib/auto-annotations';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { AutoAnnotationItemDownloadButton } from '@/components/features/auto-annotations/auto-annotation-item-download-button';
import { toast } from 'sonner';

interface Stage1DataProjectsItem {
  [key: string]: unknown;
}

interface Stage1DataShape {
  analysis?: string;
  projects?: Stage1DataProjectsItem[];
}

interface Stage2FieldEntry {
  page?: number;
  value?: string;
  source_text?: string;
  [key: string]: unknown;
}

type Stage2RawShape = Record<string, Stage2FieldEntry[] | undefined>;

function isStage1DataShape(data: unknown): data is Stage1DataShape {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return (
    (typeof record.analysis === 'string' || record.analysis === undefined) &&
    (Array.isArray(record.projects) || record.projects === undefined)
  );
}

function normalizeStage1Data(data: unknown): Stage1DataShape | null {
  if (!isStage1DataShape(data)) return null;
  return {
    analysis: data.analysis,
    projects: data.projects,
  };
}

function toStage2RawShape(data: unknown): Stage2RawShape | null {
  if (!data || typeof data !== 'object') return null;
  return data as Stage2RawShape;
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN');
}

function renderJsonPreview(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return '';
  }
}

function getDetectedTypeLabel(prefix: string, isPaper: boolean): string {
  if (isPaper) {
    return '论文（合并结果）';
  }

  const map: Record<string, string> = {
    'Identity Documents': '身份证明/护照',
    'Employment Verification': '工作证明',
    'Academic Credentials': '学历证明',
    'Part-time Employment': '兼职证明',
    'Project Experience': '项目证明',
    'Original Research Paper': '论文',
    Books: '书籍',
    'Conference Materials': '会议材料',
    Patents: '专利',
    'Honors and Awards': '荣誉/奖项',
  };

  return map[prefix] || prefix;
}

export default function AutoAnnotationItemDetailPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string; itemId: string }>();

  const jobId = params?.jobId as string;
  const itemId = params?.itemId as string;

  const [data, setData] = useState<AutoAnnotationJobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const resp = await fetchAutoAnnotationJob(jobId);
        if (!cancelled) {
          setData(resp);
        }
      } catch {
        if (!cancelled) {
          toast.error('获取自动标注任务详情失败');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (jobId) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const item: AutoAnnotationItem | undefined = useMemo(() => {
    if (!data) return undefined;
    const numericId = Number(itemId);
    if (Number.isNaN(numericId)) return undefined;
    return data.items.find((i) => i.id === numericId);
  }, [data, itemId]);

  const stage1 = useMemo(
    () => normalizeStage1Data(item?.stage1_data),
    [item?.stage1_data]
  );

  const stage2Raw = useMemo(
    () => toStage2RawShape(item?.stage2_raw),
    [item?.stage2_raw]
  );

  const hasAnnotatedPdf =
    item && item.annotated_pdf_path && item.status !== 'failed';

  return (
    <Container className="py-6 max-w-none">
      <PageHeader>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <PageTitle>自动标注结果详情</PageTitle>
            {item && (
              <p className="text-sm text-muted-foreground">
                Job #{item.job_id} · 文件 ID {item.file_id}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {item && (
              <div className="mr-2">
                <StatusBadge status={item.status} />
              </div>
            )}
            {item && hasAnnotatedPdf && (
              <AutoAnnotationItemDownloadButton
                jobId={item.job_id}
                itemId={item.id}
                compact
              />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/auto-annotations/${jobId}`)}
            >
              返回任务详情
            </Button>
          </div>
        </div>
      </PageHeader>

      {isLoading ? (
        <PageLoadingCard className="mt-6" message="正在加载条目详情…" />
      ) : !data ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>提示</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">未找到该自动标注任务。</p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/auto-annotations')}
              >
                返回自动标注任务列表
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !item ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>提示</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">未找到该自动标注子文件。</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/auto-annotations/${jobId}`)}
              >
                返回任务详情
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/auto-annotations')}
              >
                返回任务列表
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-6">
          {/* 基础信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基础信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="text-muted-foreground">文件 ID：</span>
                  <span className="font-mono text-xs">{item.file_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Job ID：</span>
                  <span className="font-mono text-xs">{item.job_id}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">检测类型：</span>
                  <Badge variant="outline">
                    {getDetectedTypeLabel(
                      item.detected_type_prefix,
                      item.is_paper
                    )}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">OCR 类型：</span>
                  <span>{item.ocr_file_type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">是否论文：</span>
                  <span>{item.is_paper ? '是（论文合并结果）' : '否'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="truncate" title={item.original_file_name}>
                  <span className="text-muted-foreground">原始文件名：</span>
                  <span>{item.original_file_name}</span>
                </div>
                {item.relative_path && (
                  <div className="truncate" title={item.relative_path}>
                    <span className="text-muted-foreground">相对路径：</span>
                    <span className="text-xs text-muted-foreground">
                      {item.relative_path}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="text-muted-foreground">创建时间：</span>
                  <span>{formatDateTime(item.created_at)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">更新时间：</span>
                  <span>{formatDateTime(item.updated_at)}</span>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground">错误信息：</span>
                <span
                  className="inline-block max-w-full truncate align-bottom text-xs text-muted-foreground"
                  title={item.error || ''}
                >
                  {item.error || '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* stage1 概览 */}
          {(stage1?.analysis || (stage1?.projects && stage1.projects.length)) && (
            <Card>
              <CardHeader>
                <CardTitle>stage1 分析概览</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {stage1?.analysis && (
                  <p className="whitespace-pre-line text-muted-foreground">
                    {stage1.analysis}
                  </p>
                )}

                {stage1?.projects && stage1.projects.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      下方为第一条项目的原始字段名和值（仅展示基础类型字段）：
                    </p>
                    <Table>
                      <TableBody>
                        {(() => {
                          const first = stage1.projects![0];
                          const record = first as Record<string, unknown>;

                          return Object.entries(record)
                            .filter(([, value]) => {
                              const type = typeof value;
                              return (
                                type === 'string' ||
                                type === 'number' ||
                                type === 'boolean'
                              );
                            })
                            .map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell className="w-40 text-xs text-muted-foreground">
                                  {key}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {String(value)}
                                </TableCell>
                              </TableRow>
                            ));
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* stage2 结构化结果 */}
          {stage2Raw && Object.keys(stage2Raw).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>stage2 结构化结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">
                  下方直接展示 stage2_raw 中的原始字段名和对应的 value（取第一条记录）。
                </p>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>字段名</TableHead>
                        <TableHead>值</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(stage2Raw).map(([key, entries]) => {
                        if (!entries || !entries.length) return null;
                        const first = entries[0];
                        return (
                          <TableRow key={key}>
                            <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                              {key}
                            </TableCell>
                            <TableCell
                              className="max-w-xs truncate text-sm"
                              title={first.source_text ?? undefined}
                            >
                              {first.value ?? '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 原始数据：OCR 与坐标 */}
          {(item.ocr_raw || item.coordinates) && (
            <Card>
              <CardHeader>
                <CardTitle>原始 OCR 与坐标数据</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {item.ocr_raw && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">OCR 原始结果（ocr_raw）</span>
                      <span className="text-xs text-muted-foreground">
                        仅供技术排查使用，内容可能较长。
                      </span>
                    </div>
                    <pre className="max-h-80 overflow-auto rounded border bg-muted p-3 text-xs">
                      {renderJsonPreview(item.ocr_raw)}
                    </pre>
                  </div>
                )}

                {item.coordinates && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">坐标信息（coordinates）</span>
                      <span className="text-xs text-muted-foreground">
                        用于定位页面中的高亮区域。
                      </span>
                    </div>
                    <pre className="max-h-80 overflow-auto rounded border bg-muted p-3 text-xs">
                      {renderJsonPreview(item.coordinates)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </Container>
  );
}


