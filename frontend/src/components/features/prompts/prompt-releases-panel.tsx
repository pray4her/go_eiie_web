import { type ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { PromptRelease } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  canDeletePromptRelease,
  formatPromptDate,
} from '@/components/features/prompts/prompt-utils';

interface PromptReleasesPanelProps {
  items: PromptRelease[];
  action?: ReactNode;
  renderPublishAction: (release: PromptRelease) => ReactNode;
  renderDeleteAction: (release: PromptRelease) => ReactNode;
}

export function PromptReleasesPanel({
  items,
  action,
  renderPublishAction,
  renderDeleteAction,
}: PromptReleasesPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>标签管理</CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            title="当前还没有标签发布"
            description="你可以从已有版本中选择一个版本，发布到 production、staging 或自定义标签。"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标签</TableHead>
                <TableHead>Prompt ID</TableHead>
                <TableHead>保护状态</TableHead>
                <TableHead>说明</TableHead>
                <TableHead>发布时间</TableHead>
                <TableHead>发布人</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const canDelete = canDeletePromptRelease(item);
                return (
                  <TableRow key={item.label}>
                    <TableCell>
                      <Badge variant={item.label === 'production' ? 'default' : 'outline'}>
                        {item.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{item.prompt_id}</TableCell>
                    <TableCell>
                      <Badge variant={item.is_protected ? 'warning' : 'secondary'}>
                        {item.is_protected ? '受保护' : '普通'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal text-sm text-muted-foreground">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell>{formatPromptDate(item.release_at)}</TableCell>
                    <TableCell>{item.release_by || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {renderPublishAction(item)}
                        {canDelete ? (
                          renderDeleteAction(item)
                        ) : (
                          <Button type="button" variant="outline" size="sm" disabled>
                            <ShieldAlert className="h-4 w-4" />
                            不可删
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
