'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalResumeJobDetails } from '@/types';
import { StatusBadge } from '@/components/features/dashboard/status-badge';
import { ResumeDownloadButton } from '@/components/features/resume-generation/resume-download-button';
import { getExternalResumeDownloadPath } from '@/lib/external-resumes';

interface ExternalResumeDetailsProps {
  data: ExternalResumeJobDetails;
}

export function ExternalResumeDetails({ data }: ExternalResumeDetailsProps) {
  const canDownload = data.status === 'completed' && !!data.generated_docx_file_id;

  function buildSummaryLine(): string | null {
    const es = data.basic_summary?.expert_summary;
    if (!es) return null;
    const birthYear = es.identity_and_birth?.birth_year;
    const birthCountry = es.identity_and_birth?.birth_country || '';
    const phd = es.phd_education;
    const employ = es.current_employment;
    if (!birthYear || !birthCountry || !phd || !employ) return null;

    const phdCountry = phd.country || '';
    const phdInst = phd.institution || '';
    const graduation = phd.graduation_year;
    const qs = phd.qs_ranking;
    const qsPart = typeof qs === 'number' && qs > 0 ? `（QS前${Math.ceil(qs / 50) * 50}）` : '';
    const gradPart = typeof graduation === 'number' && graduation > 0 ? `${graduation}年博士毕业于${phdCountry}${phdInst}` : `博士毕业于${phdCountry}${phdInst}`;
    const employPart = `现任${employ.country || ''}${employ.institution_description || ''}${employ.position || ''}。`;
    return `${birthYear}年出生于${birthCountry}，${gradPart}${qsPart}，${employPart}`;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-1 space-y-6 xl:sticky xl:top-20 h-fit">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">Job ID</span><span className="font-mono text-sm">{String(data.job_id)}</span></div>
            <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">原文件名</span><span className="text-sm">{data.source_file_name || '-'}</span></div>
            <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">状态</span><StatusBadge status={data.status} /></div>
            <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">错误信息</span><span className="text-sm">{data.error_message || '-'}</span></div>
            <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">创建时间</span><span className="text-sm">{new Date(data.created_at).toLocaleString()}</span></div>
            <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">更新时间</span><span className="text-sm">{new Date(data.updated_at).toLocaleString()}</span></div>
            <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">DOCX 文件ID</span><span className="text-sm">{data.generated_docx_file_id ?? '-'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>操作</CardTitle>
          </CardHeader>
          <CardContent>
            {canDownload ? (
              <ResumeDownloadButton jobId={String(data.job_id)} resultUrl={getExternalResumeDownloadPath(String(data.job_id))} />
            ) : (
              <p className="text-sm text-muted-foreground">任务未完成或无可下载文件。</p>
            )}
          </CardContent>
        </Card>

        {(data.professional_experience || data.research_profile || data.honors_and_roles || data.academic_achievements || data.basic_summary) && (
          <Card>
            <CardHeader>
              <CardTitle>快速导航</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <nav className="space-y-2">
                {buildSummaryLine() && (
                  <a className="block text-blue-600 hover:underline" href="#section-summary">单行综述</a>
                )}
                <a className="block text-blue-600 hover:underline" href="#section-intro">简介</a>
                {data.professional_experience && (
                  <a className="block text-blue-600 hover:underline" href="#section-professional">职业经历</a>
                )}
                {data.research_profile && (
                  <a className="block text-blue-600 hover:underline" href="#section-research">研究详情</a>
                )}
                {data.honors_and_roles && (
                  <a className="block text-blue-600 hover:underline" href="#section-honors">荣誉与任职</a>
                )}
                {data.academic_achievements && (
                  <a className="block text-blue-600 hover:underline" href="#section-achievements">学术成果</a>
                )}
                {data.basic_summary?.expert_summary && (
                  <a className="block text-blue-600 hover:underline" href="#section-basic">基础概览</a>
                )}
              </nav>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="xl:col-span-2 space-y-6">
        {buildSummaryLine() && (
          <Card id="section-summary">
            <CardHeader>
              <CardTitle>单行综述</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-sm leading-relaxed">{buildSummaryLine()}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const s = buildSummaryLine();
                  if (s) navigator.clipboard.writeText(s);
                }}
              >复制</Button>
            </CardContent>
          </Card>
        )}

        <Card id="section-intro">
          <CardHeader>
            <CardTitle>简介</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.professional_experience?.professional_timeline && data.professional_experience.professional_timeline.length > 0 && (
              <div className="space-y-2">
                {data.professional_experience.professional_timeline.map((item, idx) => {
                  const left = `${item.date_range || ''}`.trim();
                  const rightBase = `${item.country || ''}-${item.institution_name_zh || ''}`;
                  const extra = item.entry_type === 'Education'
                    ? `${item.major_zh ? `-${item.major_zh}` : ''}${item.degree_zh ? `-${item.degree_zh}` : ''}`
                    : `${item.position_zh ? `-${item.position_zh}` : ''}`;
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0">{left}</span>
                      <span className="text-sm">{rightBase}{extra}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {data.research_profile?.summary_statement && (
              <p className="text-sm text-muted-foreground">{data.research_profile.summary_statement}</p>
            )}
          </CardContent>
        </Card>

        {data.professional_experience && (
          <Card id="section-professional">
            <CardHeader>
              <CardTitle>职业经历</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.professional_experience.summary_and_warnings && (
                <div className="rounded-md bg-muted p-3 text-sm space-y-2">
                  {data.professional_experience.summary_and_warnings.analysis_notes && (
                    <p>{data.professional_experience.summary_and_warnings.analysis_notes}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {data.professional_experience.summary_and_warnings.has_gaps && (
                      <Badge variant="secondary">存在空档</Badge>
                    )}
                    {data.professional_experience.summary_and_warnings.has_overlaps && (
                      <Badge variant="secondary">存在重叠</Badge>
                    )}
                  </div>
                  {data.professional_experience.summary_and_warnings.overlap_details && (
                    <p className="text-muted-foreground">{data.professional_experience.summary_and_warnings.overlap_details}</p>
                  )}
                </div>
              )}

              {Array.isArray(data.professional_experience.professional_timeline) && data.professional_experience.professional_timeline.length > 0 ? (
                <div className="space-y-4">
                  {data.professional_experience.professional_timeline.map((item, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute left-0 top-2 h-full border-l" />
                      <span className="absolute -left-[6px] top-2 w-3 h-3 rounded-full bg-primary" />
                      <div className="mb-1 flex items-center justify-between">
                        <div className="font-medium">
                          {item.entry_type === 'Education' ? (item.degree_zh || '教育经历') : (item.position_zh || '工作经历')}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.date_range || '-'}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.institution_name_zh || '-'}
                        {item.major_zh ? ` · ${item.major_zh}` : ''}
                        {item.country ? ` · ${item.country}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">无职业时间线数据。</p>
              )}
            </CardContent>
          </Card>
        )}

        {data.research_profile && (
          <Card id="section-research">
            <CardHeader>
              <CardTitle>研究详情</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.isArray(data.research_profile.research_directions) && data.research_profile.research_directions.length > 0 && (
                <div className="space-y-4">
                  {data.research_profile.research_directions.map((dir, idx) => (
                    <div key={idx} className="border rounded-md p-3">
                      <div className="font-medium mb-2">{`${idx + 1}. ${dir.direction_name || '方向'}`}</div>
                      <ol className="list-decimal pl-5 space-y-1 text-sm">
                        {(dir.details || []).map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {data.honors_and_roles && (
          <Card id="section-honors">
            <CardHeader>
              <CardTitle>荣誉与任职</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="text-sm font-medium mb-2">头衔/荣誉</div>
                {Array.isArray(data.honors_and_roles.honors_and_titles) && data.honors_and_roles.honors_and_titles.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {data.honors_and_roles.honors_and_titles.map((h, idx) => {
                      const name = h.honor_name_zh || '-';
                      const org = h.issuing_organization as string | undefined;
                      const line = org && org.trim().length > 0 ? `${name}（${org}）` : name;
                      return <li key={idx}>{line}</li>;
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">无荣誉数据。</p>
                )}
              </div>

              <div>
                <div className="text-sm font-medium mb-2">学术兼职</div>
                {Array.isArray(data.honors_and_roles.academic_part_time_roles) && data.honors_and_roles.academic_part_time_roles.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {data.honors_and_roles.academic_part_time_roles.map((r, idx) => {
                      const title = r.role_title || '';
                      const org = r.organization_name || '';
                      const line = title ? `${org} - ${title}` : org;
                      return <li key={idx}>{line}</li>;
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">无学术兼职数据。</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {data.academic_achievements && (
          <Card id="section-achievements">
            <CardHeader>
              <CardTitle>学术成果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.academic_achievements.patents && (
                <div className="border rounded-md p-3 text-sm">
                  <div className="font-medium mb-1">专利</div>
                  <div className="text-muted-foreground">{data.academic_achievements.patents.summary || '-'}</div>
                </div>
              )}
              {data.academic_achievements.projects && (
                <div className="border rounded-md p-3 text-sm">
                  <div className="font-medium mb-1">部分项目经验</div>
                  <ol className="list-decimal pl-5 space-y-1">
                    {(data.academic_achievements.projects.recent_projects || []).map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ol>
                </div>
              )}
              {data.academic_achievements.publications && (
                <div className="border rounded-md p-3 text-sm">
                  <div className="font-medium mb-1">近期论文</div>
                  <ol className="list-decimal pl-5 space-y-1">
                    {(data.academic_achievements.publications.recent_papers || []).map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {data.basic_summary?.expert_summary && (
          <Card id="section-basic">
            <CardHeader>
              <CardTitle>基础概览</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium">博士教育</div>
                <div className="text-muted-foreground">
                  {data.basic_summary.expert_summary.phd_education?.institution || '-'}
                  {data.basic_summary.expert_summary.phd_education?.country ? ` · ${data.basic_summary.expert_summary.phd_education?.country}` : ''}
                  {data.basic_summary.expert_summary.phd_education?.graduation_year ? ` · ${data.basic_summary.expert_summary.phd_education?.graduation_year}` : ''}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">当前任职</div>
                <div className="text-muted-foreground">
                  {data.basic_summary.expert_summary.current_employment?.position || '-'}
                  {data.basic_summary.expert_summary.current_employment?.country ? ` · ${data.basic_summary.expert_summary.current_employment?.country}` : ''}
                  {data.basic_summary.expert_summary.current_employment?.institution_description ? ` · ${data.basic_summary.expert_summary.current_employment?.institution_description}` : ''}
                </div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">身份与出生</div>
                <div className="text-muted-foreground">
                  {typeof data.basic_summary.expert_summary.identity_and_birth?.birth_year === 'number' ? `出生年份 ${data.basic_summary.expert_summary.identity_and_birth?.birth_year}` : '-'}
                  {data.basic_summary.expert_summary.identity_and_birth?.birth_country ? ` · ${data.basic_summary.expert_summary.identity_and_birth?.birth_country}` : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


