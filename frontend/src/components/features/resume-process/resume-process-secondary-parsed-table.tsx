'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResumeProcessFieldMapping } from '@/lib/resume-process-secondary-parser';
import { RESUME_PROCESS_SECONDARY_IMPORTANT_COLUMNS } from '@/lib/resume-process-secondary-mapping';

interface ResumeProcessSecondaryParsedTableProps {
  items: ResumeProcessFieldMapping[];
}

const MAX_FIELD_CHAR_COUNT = 800;

function getCharCount(value: string): number {
  return value.replace(/\s/g, '').length;
}

export function ResumeProcessSecondaryParsedTable({ items }: ResumeProcessSecondaryParsedTableProps) {
  if (!items.length) {
    return <p className="text-muted-foreground">未检测到 NO.*### 段落。</p>;
  }

  const overLimitItems = items
    .map((item) => ({ item, charCount: item.value ? getCharCount(item.value) : 0 }))
    .filter(({ charCount }) => charCount > MAX_FIELD_CHAR_COUNT)
    .sort((a, b) => b.charCount - a.charCount);

  return (
    <div className="space-y-4">
      {overLimitItems.length ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">超长提醒</Badge>
              <CardTitle className="text-base">以下字段超过 {MAX_FIELD_CHAR_COUNT} 字</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {overLimitItems.map(({ item, charCount }) => (
              <div key={item.no} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">NO.{item.no}</span>
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{item.column || '-'}</span>
                <Badge variant="destructive">{charCount}字</Badge>
                <span className="text-muted-foreground">{item.header}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">NO</TableHead>
            <TableHead className="w-[80px]">列</TableHead>
            <TableHead className="w-[120px]">重点</TableHead>
            <TableHead className="w-[100px]">字数</TableHead>
            <TableHead className="min-w-[260px]">字段</TableHead>
            <TableHead>内容</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const charCount = item.value ? getCharCount(item.value) : 0;
            const isOverLimit = charCount > MAX_FIELD_CHAR_COUNT;
            const isImportant = Boolean(RESUME_PROCESS_SECONDARY_IMPORTANT_COLUMNS[item.column]);

            const rowClassName = isOverLimit
              ? 'bg-red-50/60 hover:bg-red-50'
              : isImportant
                ? 'bg-amber-50/60 hover:bg-amber-50'
                : undefined;

            return (
              <TableRow key={item.no} className={rowClassName}>
                <TableCell className="font-mono text-xs whitespace-nowrap">NO.{item.no}</TableCell>
                <TableCell className="font-mono text-xs whitespace-nowrap">{item.column || '-'}</TableCell>
                <TableCell>
                  {isImportant ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">重点</Badge>
                      <span className="text-xs text-muted-foreground">{RESUME_PROCESS_SECONDARY_IMPORTANT_COLUMNS[item.column]}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {isOverLimit ? <Badge variant="destructive">{charCount}字</Badge> : <span className="text-sm text-muted-foreground">{charCount}</span>}
                </TableCell>
                <TableCell className="whitespace-nowrap">{item.header}</TableCell>
                <TableCell className="whitespace-pre-wrap">{item.value || '-'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
