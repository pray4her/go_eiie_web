import { type ReactNode } from 'react';
import { PromptRecord } from '@/types';
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
import { formatPromptDate } from '@/components/features/prompts/prompt-utils';

interface PromptVersionsPanelProps {
  items: PromptRecord[];
  action?: ReactNode;
}

export function PromptVersionsPanel({ items, action }: PromptVersionsPanelProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>版本历史</CardTitle>
        {action}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            title="还没有版本记录"
            description="创建首个版本后，历史版本会按后端返回顺序展示在这里。"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>模型</TableHead>
                <TableHead>System Prompt（摘要）</TableHead>
                <TableHead>User Template（摘要）</TableHead>
                <TableHead>更新时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono">{item.id}</TableCell>
                  <TableCell>v{item.version}</TableCell>
                  <TableCell className="max-w-[240px] whitespace-normal">
                    {item.name || `${item.prompt_type} v${item.version}`}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 whitespace-normal">
                      <div>{item.provider || '-'}</div>
                      <div className="text-xs text-muted-foreground">{item.model_name || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[min(280px,40vw)] whitespace-normal align-top">
                    {item.system_prompt ? (
                      <p
                        className="line-clamp-4 whitespace-pre-wrap break-words text-xs text-muted-foreground"
                        title={item.system_prompt}
                      >
                        {item.system_prompt}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[min(280px,40vw)] whitespace-normal align-top">
                    {item.user_prompt_template ? (
                      <p
                        className="line-clamp-4 whitespace-pre-wrap break-words text-xs text-muted-foreground"
                        title={item.user_prompt_template}
                      >
                        {item.user_prompt_template}
                      </p>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatPromptDate(item.updated_at || item.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
