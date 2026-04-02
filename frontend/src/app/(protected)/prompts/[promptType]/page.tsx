'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { Archive, ArrowLeft, Plus, Rocket, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteReleaseDialog } from '@/components/features/prompts/delete-release-dialog';
import { ArchivePromptDialog } from '@/components/features/prompts/archive-prompt-dialog';
import { PromptDetailSummary } from '@/components/features/prompts/prompt-detail-summary';
import { PromptReleasesPanel } from '@/components/features/prompts/prompt-releases-panel';
import { PromptVersionFormDialog } from '@/components/features/prompts/prompt-version-form-dialog';
import { PromptVersionsPanel } from '@/components/features/prompts/prompt-versions-panel';
import { PublishReleaseDialog } from '@/components/features/prompts/publish-release-dialog';
import { compactHash } from '@/components/features/prompts/prompt-utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoadingCard } from '@/components/ui/page-loading';
import { PageDescription, PageHeader, PageTitle } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  fetchPromptReleases,
  fetchPromptResolved,
  fetchPromptVersions,
  getPromptErrorMessage,
} from '@/lib/prompts';
import { PromptRecord, PromptRelease, PromptResolved } from '@/types';

const SECTION_OPTIONS = [
  { value: 'overview', label: '概览' },
  { value: 'versions', label: '版本' },
  { value: 'releases', label: '标签' },
] as const;

export default function PromptDetailPage() {
  const params = useParams<{ promptType: string }>();
  const promptType = decodeURIComponent(String(params?.promptType || ''));
  const [labelQuery, setLabelQuery] = useQueryState(
    'label',
    parseAsString.withDefault('').withOptions({ shallow: false })
  );
  const [section, setSection] = useQueryState(
    'section',
    parseAsString.withDefault('overview').withOptions({ shallow: false })
  );

  const [resolved, setResolved] = useState<PromptResolved | null>(null);
  const [versions, setVersions] = useState<PromptRecord[]>([]);
  const [releases, setReleases] = useState<PromptRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedLabel = labelQuery || 'production';

  const loadPageData = useCallback(async () => {
    if (!promptType) return;

    setIsLoading(true);
    try {
      const [resolvedData, versionsData, releasesData] = await Promise.all([
        fetchPromptResolved(promptType, labelQuery || undefined),
        fetchPromptVersions(promptType),
        fetchPromptReleases(promptType),
      ]);

      setResolved(resolvedData);
      setVersions(versionsData);
      setReleases(releasesData);
    } catch (error) {
      toast.error(getPromptErrorMessage(error, '获取 Prompt 详情失败'));
    } finally {
      setIsLoading(false);
    }
  }, [labelQuery, promptType]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const availableLabels = useMemo(() => {
    const values = new Set<string>();

    if (selectedLabel) values.add(selectedLabel);
    releases.forEach((item) => {
      if (item.label) values.add(item.label);
    });

    if (values.size === 0) values.add('production');
    return Array.from(values);
  }, [releases, selectedLabel]);

  const currentRelease = useMemo(
    () => releases.find((item) => item.label === selectedLabel) ?? null,
    [releases, selectedLabel]
  );

  const versionInitialValues = useMemo(() => {
    if (!resolved) {
      return {
        name: versions[0]?.name ?? '',
        provider: versions[0]?.provider ?? '',
        model_name: versions[0]?.model_name ?? '',
        system_prompt: versions[0]?.system_prompt ?? '',
        user_prompt_template: versions[0]?.user_prompt_template ?? '',
        json_schema: versions[0]?.json_schema ?? '',
      };
    }

    return {
      name: resolved.prompt.name ?? `${resolved.prompt.prompt_type} v${resolved.prompt.version + 1}`,
      provider: resolved.provider ?? resolved.prompt.provider ?? '',
      model_name: resolved.model_name ?? resolved.prompt.model_name ?? '',
      system_prompt: resolved.prompt.system_prompt ?? '',
      user_prompt_template: resolved.prompt.user_prompt_template ?? '',
      json_schema: resolved.prompt.json_schema ?? '',
    };
  }, [resolved, versions]);

  const currentSection = SECTION_OPTIONS.some((item) => item.value === section)
    ? section
    : 'overview';

  const isPromptMissing = !resolved && versions.length === 0 && releases.length === 0 && !isLoading;

  return (
    <Container className="max-w-none py-6">
      <PageHeader>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Link href="/prompts" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'px-0')}>
                <ArrowLeft className="h-4 w-4" />
                返回列表
              </Link>
              <span>/</span>
              <span className="font-mono">{promptType}</span>
              {resolved?.schema_hash ? <span>Schema {compactHash(resolved.schema_hash)}</span> : null}
            </div>
            <div>
              <PageTitle>{promptType}</PageTitle>
              <PageDescription>
                统一查看当前标签生效版本、历史版本与标签映射。高风险操作都会通过弹窗确认。
              </PageDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PromptVersionFormDialog
              mode="version"
              promptType={promptType}
              initialValues={versionInitialValues}
              trigger={
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                  创建新版本
                </Button>
              }
              onSubmitted={loadPageData}
            />
            <ArchivePromptDialog
              promptType={promptType}
              onSubmitted={loadPageData}
              trigger={
                <Button variant="destructive">
                  <Archive className="h-4 w-4" />
                  归档类型
                </Button>
              }
            />
          </div>
        </div>
      </PageHeader>

      {isLoading ? (
        <PageLoadingCard message="正在加载 Prompt 详情…" />
      ) : isPromptMissing ? (
        <EmptyState
          title="未找到该 Prompt 类型"
          description="当前类型没有可读详情、版本或标签记录，请确认路由参数是否正确。"
          action={
            <Button asChild variant="outline">
              <Link href="/prompts">返回 Prompt 列表</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {SECTION_OPTIONS.map((item) => {
                  const isActive = currentSection === item.value;
                  return (
                    <Button
                      key={item.value}
                      type="button"
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSection(item.value)}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-sm text-muted-foreground">查看标签</span>
                <Select
                  value={selectedLabel}
                  onValueChange={(value) => setLabelQuery(value === 'production' ? null : value)}
                >
                  <SelectTrigger className="w-full min-w-[12rem] sm:w-56">
                    <SelectValue placeholder="选择标签" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLabels.map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {currentSection === 'overview' ? (
            <PromptDetailSummary data={resolved} selectedLabel={selectedLabel} />
          ) : null}

          {currentSection === 'versions' ? (
            <PromptVersionsPanel
              items={versions}
              action={
                <PromptVersionFormDialog
                  mode="version"
                  promptType={promptType}
                  initialValues={versionInitialValues}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4" />
                      新建版本
                    </Button>
                  }
                  onSubmitted={loadPageData}
                />
              }
            />
          ) : null}

          {currentSection === 'releases' ? (
            <PromptReleasesPanel
              items={releases}
              action={
                <PublishReleaseDialog
                  promptType={promptType}
                  versions={versions}
                  onSubmitted={loadPageData}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Rocket className="h-4 w-4" />
                      发布到标签
                    </Button>
                  }
                />
              }
              renderPublishAction={(release) => (
                <PublishReleaseDialog
                  key={`publish-${release.label}`}
                  promptType={promptType}
                  versions={versions}
                  initialLabel={release.label}
                  initialPromptId={release.prompt_id}
                  onSubmitted={loadPageData}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      <Rocket className="h-4 w-4" />
                      重新发布
                    </Button>
                  }
                />
              )}
              renderDeleteAction={(release) => (
                <DeleteReleaseDialog
                  key={`delete-${release.label}`}
                  promptType={promptType}
                  release={release}
                  onSubmitted={async () => {
                    if (release.label === selectedLabel) {
                      await setLabelQuery(null);
                      return;
                    }
                    await loadPageData();
                  }}
                  trigger={
                    <Button type="button" variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                      删除
                    </Button>
                  }
                />
              )}
            />
          ) : null}

          {currentSection !== 'overview' && currentRelease ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                当前标签 `{currentRelease.label}` 指向 Prompt ID `{currentRelease.prompt_id}`，
                {currentRelease.is_protected ? '该标签受保护。' : '该标签可重新发布或删除。'}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </Container>
  );
}
