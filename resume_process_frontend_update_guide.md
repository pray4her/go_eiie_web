# 简历处理模块前端改造说明

本文档用于指导前端或前端 AI 修改 `resume-process` 相关页面与请求逻辑，适配后端已经完成的二次生成重构。

适用范围：

- 简历上传页
- 简历处理任务列表/详情页
- 二次生成按钮与结果展示页
- SSE 订阅逻辑
- 错误提示逻辑
- 模板导出逻辑

## 一句话概括这次后端变化

原来的二次生成是“同一个 job 下重复堆结果”；现在改成了“一个 job 下可以有多个 secondary run（批次）”，前端默认只读最新 run，重试时后端只会新建一个 run，并默认只重跑上次失败的 prompts。

## 前端必须知道的核心变化

1. `job` 新增了 `secondary_status` 和 `secondary_error_message`，不能再只看 `job.status` 判断二次生成状态。
2. 二次生成引入了 `run_id`。同一个 `job_id` 下可能有多个 run。
3. 后端默认返回“最新 run”的二次结果；如果前端需要查看历史 run，必须传 `run_id`。
4. 重试二次生成时，后端不会覆盖旧结果，而是创建一个新的 run。
5. 如果上一个 run 是 `completed_partial` 或 `failed`，新 run 默认只重跑失败 prompts。
6. 同一个 job 存在进行中的 secondary run 时，后端会拒绝重复触发。
7. 错误返回格式已经统一，不要再只读 `error` 文本。
8. SSE 消息现在有明确的 `stage/status`，不要再从 `message` 猜状态。

## 状态模型变化

### 1) Job 状态

`job.status` 仍然只表示“初次分析”主流程状态：

- `pending`
- `processing`
- `completed`
- `failed`

说明：

- `job.status = completed` 只表示初次分析完成。
- 它不再表示 secondary 的完成情况。

### 2) Secondary 状态

新增 `job.secondary_status`：

- `idle`
- `pending`
- `processing`
- `retrying`
- `completed`
- `completed_partial`
- `failed`

前端含义建议：

- `idle`：还没触发二次生成
- `pending`：二次生成已受理，等待 worker 处理
- `processing`：正在跑本次 secondary run
- `retrying`：后端任务级重试中
- `completed`：本次 run 全部 prompt 成功
- `completed_partial`：本次 run 部分成功、部分失败，可允许再次点击“二次生成”
- `failed`：本次 run 完全失败，可允许再次点击“二次生成”

### 3) Secondary Run

新增 `secondary run` 概念。一个 job 会对应多个批次：

- 第一次点击“二次生成”会创建第一个 run
- 后续重试会创建新的 run
- 前端默认展示最新 run

run 关键字段：

- `id`
- `job_id`
- `retry_of_run_id`
- `status`
- `prompt_ids`
- `failed_prompt_ids`
- `error_message`
- `retryable`
- `retry_after_seconds`
- `total_prompts`
- `completed_prompts`
- `error_prompts`

## 接口变化

## 1) 上传简历

### 请求

`POST /api/v1/resume-process/upload`

无变化。

### 前端需要知道

- 后端现在对上传流程做了事务和补偿。
- 如果任务入队失败，不会再留下“表面创建成功但实际没跑”的僵尸 job。
- 前端仍然按 `202 Accepted` 处理即可。

## 2) 查询任务详情

### 请求

`GET /api/v1/resume-process/jobs/:jobId`

新增可选参数：

- `run_id`

示例：

```http
GET /api/v1/resume-process/jobs/123
GET /api/v1/resume-process/jobs/123?run_id=8
```

### 响应结构变化

旧结构：

```json
{
  "job": {},
  "initial_result": {},
  "secondary_results": []
}
```

新结构：

```json
{
  "job": {
    "id": 123,
    "status": "completed",
    "secondary_status": "completed_partial",
    "secondary_error_message": "以下提示词生成失败: [1001,1002]"
  },
  "initial_result": {
    "status": "completed"
  },
  "secondary_run": {
    "id": 8,
    "job_id": 123,
    "retry_of_run_id": 7,
    "status": "completed_partial",
    "prompt_ids": [1001,1002,1003],
    "failed_prompt_ids": [1002],
    "retryable": false,
    "retry_after_seconds": null,
    "total_prompts": 3,
    "completed_prompts": 2,
    "error_prompts": 1
  },
  "secondary_results": [
    {
      "id": 1,
      "job_id": 123,
      "secondary_run_id": 8,
      "prompt_id": 1001,
      "status": "completed",
      "generated_text": "...",
      "error_message": null
    }
  ]
}
```

### 前端改造要求

1. 默认不传 `run_id`，直接展示后端返回的最新 run。
2. 展示 `secondary_run` 的状态摘要，不要只从 `secondary_results` 推断。
3. 如果后续要做“查看历史重试批次”，再增加 run 切换器，并在切换时传 `run_id`。

## 3) 触发二次生成

### 请求

`POST /api/v1/resume-process/jobs/:jobId/trigger-secondary`

### 新行为

- 初次分析未完成时，后端会拒绝触发。
- 如果存在进行中的 run，后端会拒绝重复触发。
- 如果上一轮是 `completed_partial` 或 `failed`，会创建新 run，并只重跑失败 prompts。
- 如果是首次触发，创建全量 prompts 的 run。

### 新响应

```json
{
  "message": "secondary generation accepted",
  "job_id": 123,
  "run_id": 8
}
```

### 前端改造要求

1. 触发成功后保存返回的 `run_id`。
2. 进入详情页或刷新结果时，优先用这个 `run_id` 拉取对应 run。
3. 按钮禁用条件不能只看 `job.status`，还要看：
   - `job.status !== completed` 时禁用
   - `job.secondary_status in [pending, processing, retrying]` 时禁用
4. 当 `secondary_status in [completed_partial, failed]` 时，按钮文案建议改为“重试失败项”或“重新二次生成”。

## 4) 查询二次生成结果

### 请求

`GET /api/v1/resume-process/jobs/:jobId/secondary-results`

新增可选参数：

- `run_id`

### 旧响应

```json
{
  "items": []
}
```

### 新响应

```json
{
  "run": {
    "id": 8,
    "status": "completed_partial",
    "failed_prompt_ids": [1002]
  },
  "items": [
    {
      "secondary_run_id": 8,
      "prompt_id": 1001,
      "status": "completed",
      "generated_text": "...",
      "error_message": null
    },
    {
      "secondary_run_id": 8,
      "prompt_id": 1002,
      "status": "error",
      "generated_text": "",
      "error_message": "..."
    }
  ]
}
```

### 前端改造要求

1. 结果页要读取 `run` 和 `items` 两部分。
2. 失败项展示应优先用：
   - `run.failed_prompt_ids`
   - 各 item 的 `status=error`
   - 各 item 的 `error_message`
3. 不要再假设同一个 job 下只有一组 secondary 结果。

## 5) 导出模板

### 请求

`GET /api/v1/resume-process/jobs/:jobId/export-template`

新增可选参数：

- `run_id`

### 新行为

- 默认导出最新 run。
- 如果传了 `run_id`，导出指定 run。

### 前端改造要求

1. 默认导出当前展示的 run。
2. 如果详情页当前是在看某个指定历史 run，导出时必须把同一个 `run_id` 带上。

## 6) SSE 订阅

### 订阅地址

`GET /api/v1/resume-process/subscribe/:jobId?token=<JWT>`

### 旧问题

之前 secondary 的状态会混在 `message` 里，前端很难可靠判断。

### 新 SSE 消息结构

```json
{
  "job_id": 123,
  "run_id": 8,
  "stage": "secondary",
  "status": "processing",
  "message": "secondary processing started",
  "retryable": false,
  "retry_after": null,
  "failed_prompt_ids": [],
  "job_status": "completed",
  "secondary_status": "processing"
}
```

可能的 `stage`：

- `initial`
- `secondary`

可能的 `status`：

- 初次分析：`processing` / `retrying` / `completed` / `failed`
- 二次生成：`pending` / `processing` / `retrying` / `completed` / `completed_partial` / `failed`

### 前端改造要求

1. SSE 状态判断必须基于：
   - `stage`
   - `status`
2. 不要再根据 `message` 文本推断状态。
3. 当收到 secondary 的 `completed` / `completed_partial` / `failed` 时，应停止本轮 loading，并刷新当前 run 详情。
4. 如果收到 `retrying`，可展示“系统正在自动重试”。
5. 如果收到 `retry_after`，可展示“建议 X 秒后再重试”。

## 错误响应结构变化

所有关键接口现在统一返回以下结构：

```json
{
  "code": "secondary_run_in_progress",
  "stage": "secondary",
  "message": "已有进行中的二次生成任务，请勿重复触发",
  "retryable": false,
  "retry_after": null,
  "failed_prompt_ids": []
}
```

字段说明：

- `code`：稳定错误码，前端逻辑判断优先用它
- `stage`：错误所在阶段
- `message`：可直接给用户展示的消息
- `retryable`：是否建议稍后重试
- `retry_after`：建议多少秒后重试
- `failed_prompt_ids`：仅二次生成相关错误可能返回

## 前端建议建立的错误码处理

至少识别这些错误码：

- `unauthorized`
- `job_not_found`
- `job_forbidden`
- `initial_not_completed`
- `secondary_run_in_progress`
- `secondary_run_not_found`
- `secondary_prompts_missing`
- `template_export_failed`
- `initial_generation_failed`
- `secondary_processing_failed`

推荐交互：

- `initial_not_completed`
  - toast：请先等待初次分析完成
- `secondary_run_in_progress`
  - toast：已有进行中的二次生成，请稍后刷新
- `secondary_run_not_found`
  - toast：当前批次不存在，已切回最新结果
- `retryable=true`
  - toast：操作失败，可稍后重试
- `retry_after` 存在
  - toast：请在 X 秒后重试

## 前端页面逻辑修改建议

## 1) 列表页

任务列表中建议新增二次生成状态展示：

- 初次分析状态：看 `job.status`
- 二次生成状态：看 `job.secondary_status`

建议文案：

- `idle` -> 未二次生成
- `pending` -> 已提交
- `processing` -> 二次生成中
- `retrying` -> 自动重试中
- `completed` -> 二次生成完成
- `completed_partial` -> 部分完成
- `failed` -> 二次生成失败

## 2) 详情页

详情页建议分两个区域：

1. 初次分析
2. 二次生成

二次生成区域建议展示：

- 当前 run ID
- run 状态
- 成功/失败 prompt 数
- 失败 prompt ID 列表
- 每个 prompt 的结果状态

## 3) 二次生成按钮

建议按钮禁用逻辑：

```ts
const disableSecondaryTrigger =
  job.status !== 'completed' ||
  ['pending', 'processing', 'retrying'].includes(job.secondary_status)
```

建议按钮文案：

- `secondary_status = idle` -> 二次生成
- `secondary_status in [completed_partial, failed]` -> 重试失败项
- `secondary_status in [pending, processing, retrying]` -> 生成中

## 4) 结果展示

每条结果建议用以下优先级展示状态：

1. `item.status`
2. `item.error_message`
3. `run.failed_prompt_ids`

建议在 UI 上明确区分：

- 本次 run 成功项
- 本次 run 失败项

不要再把同一 job 历史 run 的结果混在一起展示。

## 5) 历史 run 支持

当前后端已经支持按 `run_id` 读指定批次。

如果前端暂时不做历史 run 切换，也至少要做到：

- 默认只看 latest run
- 不把历史 secondary_results 缓存在同一个数组里复用

如果后续要增强，可增加：

- “查看本次重试批次”
- “查看上一次失败批次”
- “按 run_id 导出”

## 推荐前端数据结构调整

建议将原本的：

```ts
type ResumeProcessDetail = {
  job: Job
  initial_result?: InitialResult
  secondary_results: SecondaryResult[]
}
```

改为：

```ts
type ResumeProcessDetail = {
  job: Job
  initial_result?: InitialResult
  secondary_run?: SecondaryRun
  secondary_results: SecondaryResult[]
}

type Job = {
  id: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  secondary_status:
    | 'idle'
    | 'pending'
    | 'processing'
    | 'retrying'
    | 'completed'
    | 'completed_partial'
    | 'failed'
  secondary_error_message?: string | null
}

type SecondaryRun = {
  id: number
  job_id: number
  retry_of_run_id?: number | null
  status: Job['secondary_status']
  prompt_ids: number[]
  failed_prompt_ids: number[]
  error_message?: string | null
  retryable: boolean
  retry_after_seconds?: number | null
  total_prompts: number
  completed_prompts: number
  error_prompts: number
}

type SecondaryResult = {
  id: number
  job_id: number
  secondary_run_id: number
  prompt_id: number
  status: 'processing' | 'completed' | 'error'
  generated_text: string
  error_message?: string | null
}

type ApiError = {
  code: string
  stage: 'upload' | 'initial' | 'secondary' | 'export' | 'job'
  message: string
  retryable: boolean
  retry_after?: number | null
  failed_prompt_ids?: number[]
}
```

## 推荐前端联调顺序

1. 先修改类型定义，支持 `secondary_status`、`secondary_run`、`run_id`、统一错误结构。
2. 再修改详情页和二次结果页，确保只读取最新 run。
3. 再修改“二次生成”按钮禁用逻辑与成功后刷新逻辑。
4. 再修改 SSE 订阅逻辑，按 `stage/status` 驱动页面状态。
5. 最后再补充历史 run 切换功能。

## 最后提醒

这次改造后，前端最容易出错的地方有 4 个：

1. 还在用 `job.status` 判断 secondary 是否完成
2. 还在把同一 job 的所有 secondary_results 混在一起展示
3. 触发二次生成后没有保存 `run_id`
4. 还在把后端错误当作 `{ error: string }` 处理

如果前端先把这 4 点改掉，核心联调就能稳定下来。
