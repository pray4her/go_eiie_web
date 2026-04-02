'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { fetchPromptList, getPromptErrorMessage } from '@/lib/prompts';
import { PromptListItem } from '@/types';
import { PromptFilters } from '@/components/features/prompts/prompt-filters';
import { PromptListTable } from '@/components/features/prompts/prompt-list-table';
import { PromptVersionFormDialog } from '@/components/features/prompts/prompt-version-form-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { EmptyState } from '@/components/ui/empty-state';
import { ListLoadingPlaceholder } from '@/components/ui/page-loading';
import { PageDescription, PageHeader, PageTitle } from '@/components/ui/page-header';

export default function PromptsPage() {
  const router = useRouter();
  const [promptTypeQuery, setPromptTypeQuery] = useQueryState(
    'prompt_type',
    parseAsString.withDefault('').withOptions({ shallow: false })
  );
  const [labelQuery, setLabelQuery] = useQueryState(
    'label',
    parseAsString.withDefault('').withOptions({ shallow: false })
  );

  const [promptTypeInput, setPromptTypeInput] = useState(promptTypeQuery);
  const [labelInput, setLabelInput] = useState(labelQuery);
  const [items, setItems] = useState<PromptListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPromptTypeInput(promptTypeQuery);
  }, [promptTypeQuery]);

  useEffect(() => {
    setLabelInput(labelQuery);
  }, [labelQuery]);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPromptList({
        prompt_type: promptTypeQuery,
        label: labelQuery,
      });
      setItems(data);
    } catch (error) {
      toast.error(getPromptErrorMessage(error, '获取 Prompt 发布列表失败'));
    } finally {
      setIsLoading(false);
    }
  }, [labelQuery, promptTypeQuery]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleSearch() {
    await Promise.all([
      setPromptTypeQuery(promptTypeInput.trim() || null),
      setLabelQuery(labelInput.trim() || null),
    ]);
  }

  async function handleReset() {
    setPromptTypeInput('');
    setLabelInput('');
    await Promise.all([setPromptTypeQuery(null), setLabelQuery(null)]);
  }

  return (
    <Container className="max-w-none py-6">
      <PageHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <PageTitle>Prompt 管理</PageTitle>
            <PageDescription>
              查看当前各类型 Prompt 的标签发布情况，并从这里进入详情页管理版本、发布和归档。
            </PageDescription>
          </div>
          <PromptVersionFormDialog
            mode="create"
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                新建 Prompt
              </Button>
            }
            onSubmitted={async (response) => {
              await loadItems();
              if (response.data.prompt_type) {
                router.push(`/prompts/${encodeURIComponent(response.data.prompt_type)}`);
              }
            }}
          />
        </div>
      </PageHeader>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>筛选条件</CardTitle>
          </CardHeader>
          <CardContent>
            <PromptFilters
              promptType={promptTypeInput}
              label={labelInput}
              isLoading={isLoading}
              onPromptTypeChange={setPromptTypeInput}
              onLabelChange={setLabelInput}
              onSearch={handleSearch}
              onReset={handleReset}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>发布列表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <ListLoadingPlaceholder message="正在加载 Prompt 发布记录…" withTableSkeleton />
            ) : items.length === 0 ? (
              <EmptyState
                title="没有匹配的 Prompt 发布记录"
                description="可以调整筛选条件，或先创建首个 Prompt 再回来查看。"
              />
            ) : (
              <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <PromptListTable items={items} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
