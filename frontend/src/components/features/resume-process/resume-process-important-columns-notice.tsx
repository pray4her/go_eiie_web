'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RESUME_PROCESS_SECONDARY_IMPORTANT_COLUMNS_NOTICE_TEXT } from '@/lib/resume-process-secondary-mapping';

export function ResumeProcessImportantColumnsNotice() {
  return (
    <Card className="border-amber-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="warning">请重点核对</Badge>
          <CardTitle className="text-base">以下列需要人工检查并修正</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {RESUME_PROCESS_SECONDARY_IMPORTANT_COLUMNS_NOTICE_TEXT}
      </CardContent>
    </Card>
  );
}
