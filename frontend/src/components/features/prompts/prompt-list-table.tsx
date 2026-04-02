'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PromptListItem } from '@/types';
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
import { compactHash, formatPromptDate } from '@/components/features/prompts/prompt-utils';

interface PromptListTableProps {
  items: PromptListItem[];
}

export function PromptListTable({ items }: PromptListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Prompt 类型</TableHead>
          <TableHead>标签</TableHead>
          <TableHead>版本</TableHead>
          <TableHead>模型</TableHead>
          <TableHead>Schema Hash</TableHead>
          <TableHead>保护状态</TableHead>
          <TableHead>发布时间</TableHead>
          <TableHead>发布人</TableHead>
          <TableHead>描述</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={`${item.prompt_type}-${item.label}-${item.prompt_id}`}>
            <TableCell className="font-medium">{item.prompt_type}</TableCell>
            <TableCell>
              <Badge variant={item.label === 'production' ? 'default' : 'outline'}>
                {item.label}
              </Badge>
            </TableCell>
            <TableCell>v{item.version}</TableCell>
            <TableCell>
              <div className="space-y-1 whitespace-normal">
                <div>{item.provider || '-'}</div>
                <div className="text-xs text-muted-foreground">{item.model_name || '-'}</div>
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs">{compactHash(item.schema_hash)}</TableCell>
            <TableCell>
              <Badge variant={item.is_protected ? 'warning' : 'secondary'}>
                {item.is_protected ? '受保护' : '普通'}
              </Badge>
            </TableCell>
            <TableCell>{formatPromptDate(item.release_at)}</TableCell>
            <TableCell>{item.release_by || '-'}</TableCell>
            <TableCell className="max-w-[220px] whitespace-normal text-sm text-muted-foreground">
              {item.description || '-'}
            </TableCell>
            <TableCell className="text-right">
              <Button asChild variant="outline" size="sm">
                <Link href={`/prompts/${encodeURIComponent(item.prompt_type)}?label=${encodeURIComponent(item.label)}`}>
                  查看详情
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
