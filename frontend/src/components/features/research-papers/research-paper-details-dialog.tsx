'use client';

import { ResearchPaperDownloadButton } from './research-paper-download-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ResearchPaperJobDetail } from '@/types';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, BookOpen, Layers, Hash, Calendar } from 'lucide-react';

interface ResearchPaperDetailsDialogProps {
  detail: ResearchPaperJobDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResearchPaperDetailsDialog({
  detail,
  open,
  onOpenChange,
}: ResearchPaperDetailsDialogProps) {
  if (!detail) return null;

  const { job, papers } = detail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-xl">任务详情 #{job.id}</DialogTitle>
            <StatusBadge status={job.status} />
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 基本信息 */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">专家姓名</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{job.expert_name}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">创建时间</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{new Date(job.created_at).toLocaleString('zh-CN')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">结果 PDF</CardTitle>
              </CardHeader>
              <CardContent>
                {job.status === 'completed' && (job.annotated_pdf_path || job.id) ? (
                  <ResearchPaperDownloadButton
                    jobId={job.id}
                    variant="link"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {job.status === 'failed' ? '处理失败' : '处理中...'}
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 提取数据 */}
          {papers.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Layers className="h-5 w-5" />
                提取到的元数据
              </h3>
              <div className="grid gap-4">
                {papers.map((paper) => (
                  <Card key={paper.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="text-base flex flex-col gap-1">
                        <span className="text-foreground">{paper.title_zh || '无中文标题'}</span>
                        <span className="text-sm font-normal text-muted-foreground italic">
                          {paper.title_en || 'No English Title'}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> 期刊名称
                        </div>
                        <p className="text-sm font-medium">{paper.journal_name || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Hash className="h-3 w-3" /> 卷号/期号/年份
                        </div>
                        <p className="text-sm font-medium">{paper.volume_issue_year || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> 作者排序
                        </div>
                        <p className="text-sm font-medium">{paper.author_order || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" /> 起止页码
                        </div>
                        <p className="text-sm font-medium">
                          {paper.start_page} - {paper.end_page}
                        </p>
                      </div>

                      {/* 锚点数据 (Anchors) */}
                      <div className="col-span-full mt-2 pt-4 border-t border-dashed">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                          识别锚点 (用于 PDF 标注定位)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            标题: {paper.anchors.title_en_anchor || '-'}
                          </Badge>
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            专家: {paper.anchors.expert_anchor || '-'}
                          </Badge>
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            期刊: {paper.anchors.journal_anchor || '-'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {job.error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-destructive flex items-center gap-2">
                  错误信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive font-mono">{job.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

