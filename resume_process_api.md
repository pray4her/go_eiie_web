# 简历处理模块（resume-process）后端接口说明

本文档用于前端 AI/开发理解后端行为与接口契约，仅描述后端接口、参数、校验规则与注意事项。

## 概览

- 路由前缀：`/api/v1/resume-process`
- 功能流程：
  1) 用户上传简历文件（PDF/DOC/DOCX）→ 异步执行“初次分析”（prompt_type=`RESUME_INITIAL`）→ 保存结果
  2) 用户查看初次分析结果后决定是否继续 → 触发“二次生成”（prompt_type=`RESUME_SECONDARY` 下的所有 prompts 并发执行，通常放 9 条）→ 保存 9 次结果
  3) 后端按约定格式解析二次结果（`NO.X###...`）并映射到 Excel 列（K..AK），填入模板并返回下载

- Gemini 调用特性（当前实现）：
  - 联网搜索：已启用（初次分析、二次生成均开启）
  - 结构化输出（forceJSON/response schema）：已关闭（按文本输出处理）

## 认证与通用约定

### Bearer Token（大多数接口）

- 需要在 Header 中携带：
  - `Authorization: Bearer <JWT>`
- 这些接口使用标准鉴权中间件（`authMiddleware`），无 token 会返回 `401`。

### SSE 订阅接口（token 查询参数）

- SSE 接口不走标准中间件，使用 query 参数鉴权：
  - `GET /subscribe/:jobId?token=<JWT>`

### 常见状态码

- `200 OK`：同步成功返回
- `202 Accepted`：异步任务已入队（初次分析/二次生成触发）
- `400 Bad Request`：参数格式错误（例如 `jobId` 非数字、文件扩展名不支持等）
- `401 Unauthorized`：未认证（Bearer 或 token query 缺失/无效）
- `404 Not Found`：资源不存在或无权限（部分接口会统一返回 not found 类错误）
- `500 Internal Server Error`：服务端处理失败（入队失败、导出失败等）

## 数据结构（后端返回字段）

### Job（ResumeProcessJob）

来自数据库表 `resume_process_jobs`（迁移：`000073_create_resume_process_tables`）。

- `id`：作业 ID（job_id）
- `user_id`：所属用户
- `source_file_id`：上传文件在 `files` 表中的 ID
- `status`：作业状态（字符串）
  - `pending`：已创建等待处理
  - `processing`：处理中
  - `completed`：初次分析完成（注意：二次生成完成不会改变该字段的枚举范围）
  - `failed`：失败
- `error_message`：失败原因（可能为空）
- `created_at` / `updated_at` / `deleted_at`

### 初次结果（ResumeInitialResult）

来自 `resume_initial_results`：

- `job_id`：对应作业
- `raw_response`：Gemini 原始文本
- `parsed_result`：如果能解析为 JSON 则为 JSON；否则为 `{"text":"..."}` 的 JSON
- `status`：`processing|completed|error`
- `error_message`

### 二次结果（ResumeSecondaryResult）

来自 `resume_secondary_results`：

- `job_id`
- `prompt_id`：对应 `prompts` 表的 ID
- `generated_text`：Gemini 返回文本
- `status`：`processing|completed|error`
- `error_message`

## 接口明细

### 1) 上传简历并创建初次分析 Job

- **URL**：`POST /api/v1/resume-process/upload`
- **认证**：Bearer Token
- **Content-Type**：`multipart/form-data`
- **表单字段**
  - `file`：必填，文件（仅支持 `.pdf` / `.docx` / `.doc`，按文件名扩展名校验）
- **校验规则**
  - 必须登录
  - 扩展名必须属于 `.pdf/.docx/.doc`，否则 `400`
  - 文件会保存到 `config.storage.local_path` 目录下（文件名为 UUID + 原扩展名）
- **行为**
  - 创建 `files` 记录（source_file）
  - 创建 `resume_process_jobs` 记录（`status=pending`）
  - 预创建 `resume_initial_results`（`status=processing`）
  - 入队 Asynq 任务：`resume:initial`
- **成功响应**（202）

```json
{
  "message": "resume process job accepted",
  "job_id": 123
}
```

### 2) SSE 订阅作业状态

- **URL**：`GET /api/v1/resume-process/subscribe/:jobId?token=<JWT>`
- **认证**：query token
- **Path 参数**
  - `jobId`：必填，数字
- **行为**
  - 校验 job 归属（`job.user_id` 必须等于 token 中 user_id），否则 `404`
  - 若 job 已是 `completed/failed`，直接返回 JSON（非 SSE 流）
  - 否则建立 SSE 连接，订阅 Redis 频道：`resume-process:job:{jobId}`
  - 心跳：每 20 秒发送 `event: ping`
  - 当收到消息体 JSON 中的 `status` 字段为 `completed` 或 `failed` 时，服务端关闭连接
- **SSE 消息格式**
  - event 名称：`message`
  - payload 为后端发布的 JSON 字符串（字段示例）：

```json
{
  "job_id": 123,
  "status": "processing|completed|failed|completed_partial|secondary_completed",
  "message": "文本消息",
  "result_url": ""
}
```

注意：SSE 关闭条件只检查 `status == completed/failed`，因此如果后端发布 `completed_partial` 等状态，连接可能保持直到后续出现 `completed/failed` 或前端断开。

### 3) 作业历史列表

- **URL**：`GET /api/v1/resume-process/jobs?limit=20&offset=0`
- **认证**：Bearer Token
- **Query 参数**
  - `limit`：可选，默认 20，范围 `1..100`
  - `offset`：可选，默认 0，范围 `>=0`
- **成功响应**（200）

```json
{
  "total": 10,
  "items": [
    {
      "id": 123,
      "user_id": 1,
      "source_file_id": 456,
      "status": "pending",
      "error_message": null,
      "created_at": "2026-01-16T00:00:00Z",
      "updated_at": "2026-01-16T00:00:00Z",
      "deleted_at": null
    }
  ]
}
```

### 4) 查看作业详情（包含初次与二次结果）

- **URL**：`GET /api/v1/resume-process/jobs/:jobId`
- **认证**：Bearer Token
- **成功响应**（200）

```json
{
  "job": { "...": "ResumeProcessJob" },
  "initial_result": {
    "job_id": 123,
    "raw_response": "......",
    "parsed_result": { "text": "......" },
    "status": "completed",
    "error_message": null
  },
  "secondary_results": [
    {
      "id": 1,
      "job_id": 123,
      "prompt_id": 999,
      "generated_text": "NO.39###...井井井...",
      "status": "completed",
      "error_message": null
    }
  ]
}
```

### 5) 删除作业

- **URL**：`DELETE /api/v1/resume-process/jobs/:jobId`
- **认证**：Bearer Token
- **成功响应**（200）

```json
{ "message": "deleted" }
```

**注意事项**
- 当前是 GORM 软删除（写 `deleted_at`），不会触发数据库层面的 `ON DELETE CASCADE`；因此初次/二次结果表记录不一定会物理删除（后续如需彻底清理需改为硬删或补清理逻辑）。
- 同时不会删除源文件 `files` 记录以及磁盘上的上传文件。

### 6) 触发二次生成（用户确认后）

- **URL**：`POST /api/v1/resume-process/jobs/:jobId/trigger-secondary`
- **认证**：Bearer Token
- **Body**：无
- **行为**
  - 入队 Asynq 任务：`resume:secondary`
  - 二次生成会读取 `prompts` 表中 `prompt_type = RESUME_SECONDARY` 的全部记录并并发执行（通常配置 9 条）
- **成功响应**（202）

```json
{
  "message": "secondary generation accepted",
  "job_id": 123
}
```

### 7) 查询二次生成结果列表

- **URL**：`GET /api/v1/resume-process/jobs/:jobId/secondary-results`
- **认证**：Bearer Token
- **成功响应**（200）

```json
{
  "items": [
    {
      "id": 1,
      "job_id": 123,
      "prompt_id": 999,
      "generated_text": "......",
      "status": "completed|processing|error",
      "error_message": null
    }
  ]
}
```

### 8) 导出模板（解析二次结果并填充）

- **URL**：`GET /api/v1/resume-process/jobs/:jobId/export-template`
- **认证**：Bearer Token
- **返回**：`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **文件名**：`resume_process_{jobId}.xlsx`
- **行为**
  - 从 `secondary_results.generated_text` 拼接文本后解析条目
  - 条目识别规则：以行首 `NO.<数字>###` 开始，内容结束于：
    - 关键字 `井井井`（出现即截断）
    - 或下一个 `NO.` 条目
    - 或文本结尾
  - 按以下映射写入模板 sheet `AI生成映射` 的第 2 行指定列（无内容则不写）：
    - `1-K, 2-L, 3-M, 4-N, 5-O, 6-P, 7-Q, 8-R, 9-S, 10-T, 11-U, 12-V, 13-W, 14-X, 15-Y, 16-Z, 17-AA, 18-AB, 19-AC, 20-AD, 21-AE, 22-AF, 23-AG, 24-AH, 25-AI, 26-AJ, 27-AN, 28-AL, 29-AM, 30-AO, 31-AP, 32-AQ, 33-AR, 34-AS, 35-AT, 36-AU, 37-AV, 38-AW, 39-AX, 40-AY, 41-AK`
  - 模板路径来自：`config.storage.template_path`
  - 若模板中不存在 `AI生成映射` sheet，后端会自动创建该 sheet
- **注意事项**
  - 导出依赖二次结果中严格包含 `NO.X###` 格式；若格式不匹配，导出 Excel 可能为空或部分为空
  - 当前写入行为不会清空该 sheet 其他单元格，仅写入目标列对应单元格

## Prompt 配置要求（后端依赖）

后端通过 `PromptService` 从数据库 `prompts` 表读取：

- 初次分析：`prompt_type = 'RESUME_INITIAL'`（取最新版本）
- 二次生成：`prompt_type = 'RESUME_SECONDARY'`（取该类型下全部 prompts，按版本倒序/ID 顺序返回）

建议在二次生成 prompts 的 `user_prompt_template` 中明确输出格式要求，例如：
- 每条必须以 `NO.<1..41>###` 开头
- 条目末尾输出独立一行 `井井井` 作为分隔符

## 运行与依赖注意事项

- Word 转 PDF：
  - 后端复用 `utils.ConvertOfficeToPdf`，底层调用 Python 脚本 `python/annotator/convert_to_pdf.py`
  - 在 Windows 环境通常依赖 `win32com` + 本机安装 Word；容器/纯 Linux 环境可能不可用，需要提前在部署侧验证
- Gemini 调用：
  - 后端使用 ManagedClient（多 Key 分配/限流/故障切换），并在初次/二次调用中带有重试与指数退避
