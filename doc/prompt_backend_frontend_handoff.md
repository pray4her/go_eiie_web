# Prompt 管理接口后端变更交接文档

## Summary

后端已新增 `prompts` 管理接口组，前端可通过新接口完成 Prompt 列表查询、版本创建、标签发布/回滚、标签删除与类型归档。  
`已确认` 前端需要更新 API client 与管理页交互；`前端通常无需处理` 后端内部缓存/LKG/LLM 抽象实现细节。

## Scope

- 模块/功能：Prompt 生命周期管理（不可变版本 + 标签发布）
- 涉及环境：`/api/v1/prompts*` HTTP API（Bearer 鉴权）
- 证据范围：`api/router.go`、`internal/handlers/prompt_handler.go`、`internal/core/services/prompt_service.go`、`cmd/main.go`、`internal/database/migrations/000087_*.sql`、`000088_*.sql`、`000089_*.sql`
- 发布背景或版本范围：本次 Prompt 生命周期重构后新增接口

## Endpoint Inventory

| Method | Path | Purpose | Auth | Status | Frontend Priority | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/prompts` | 列出 Prompt 发布记录（可按类型/标签筛选） | BearerAuth | added | high | `api/router.go`, `internal/handlers/prompt_handler.go` |
| POST | `/api/v1/prompts` | 创建 Prompt（首版本） | BearerAuth | added | high | `api/router.go`, `internal/handlers/prompt_handler.go` |
| GET | `/api/v1/prompts/:promptType` | 获取某类型在指定标签下生效 Prompt | BearerAuth | added | high | `api/router.go`, `internal/handlers/prompt_handler.go` |
| DELETE | `/api/v1/prompts/:promptType` | 归档类型（下线所有标签） | BearerAuth | added | medium | `api/router.go`, `internal/handlers/prompt_handler.go` |
| GET | `/api/v1/prompts/:promptType/versions` | 查询版本历史 | BearerAuth | added | high | `api/router.go`, `internal/handlers/prompt_handler.go` |
| POST | `/api/v1/prompts/:promptType/versions` | 创建新版本（用于修改 Prompt） | BearerAuth | added | high | `api/router.go`, `internal/handlers/prompt_handler.go` |
| GET | `/api/v1/prompts/:promptType/releases` | 查询类型下所有标签发布记录 | BearerAuth | added | medium | `api/router.go`, `internal/handlers/prompt_handler.go` |
| POST | `/api/v1/prompts/:promptType/releases/:label/publish` | 发布/回滚标签指针到目标 `prompt_id` | BearerAuth | added | high | `api/router.go`, `internal/handlers/prompt_handler.go` |
| DELETE | `/api/v1/prompts/:promptType/releases/:label` | 删除某标签（受保护标签会被拒绝） | BearerAuth | added | medium | `api/router.go`, `internal/handlers/prompt_handler.go` |

## Confirmed Backend Changes

### 已确认

- 新增 `PromptHandler` 并注入 `SetupRouter(...)` 参数链。
- 路由新增 `/api/v1/prompts` 分组，共 9 个端点。
- Prompt 更新语义已改为“创建新版本”（`CreatePromptVersion`），不是就地更新。
- 发布语义已改为标签指针切换（`PublishPromptLabel(promptType,label,promptID,operator)`）。
- 删除标签存在后端保护逻辑：`production` 或 `is_protected=true` 返回 400。
- 读取默认 label 为 `production`（`GetPrompt` 内部 label 空值归一）。

### 前端通常无需处理

- `PromptService` 内部缓存链路（memory/redis/lkg）不改变接口协议。
- `GetLatestPrompt` 到 `GetPrompt(production)` 的兼容转发仅影响后端内部调用。
- `prompt_call_logs` 的写入由后端执行，当前无对应公开查询端点。

## API Contract Changes

| Type | Name | Before | After | Frontend Impact | Evidence |
| --- | --- | --- | --- | --- | --- |
| Route | `/api/v1/prompts*` | 无 | 新增 9 个 Prompt 管理端点 | 需要新增 Prompt 管理 API client | `api/router.go`, `internal/handlers/prompt_handler.go` |
| Request | `CreatePromptVersionRequest` | 无 | 新增字段：`name,prompt_type,provider,model_name,system_prompt,user_prompt_template,json_schema,publish_label` | 表单和请求体需对齐该结构 | `internal/handlers/prompt_handler.go` |
| Request | `PublishPromptReleaseRequest` | 无 | 新增字段：`prompt_id`(required),`description`,`is_protected` | 发布弹窗最少要提供 `prompt_id` | `internal/handlers/prompt_handler.go` |
| Auth | `/api/v1/prompts/*` | 无 | 统一 Bearer token（`authMiddleware`） | 前端需保证携带 Authorization | `api/router.go` |
| Error | 删除标签 | 无 | 删除 `production` 或受保护标签返回 400 | 需展示保护性错误提示并禁用危险操作 | `internal/handlers/prompt_handler.go` |
| Behavior | 修改 Prompt | 传统可能是 update | 现在是 `POST /versions` 新建版本 | 前端文案和交互需改为“创建版本” | `internal/handlers/prompt_handler.go`, `internal/core/services/prompt_service.go` |

## Endpoint Details

### Endpoint: `GET /api/v1/prompts`

#### 已确认

- 用途：列出发布记录（按 release 维度）。
- 前端触发时机：进入 Prompt 列表页，或筛选后刷新列表。
- 鉴权/权限：BearerAuth（登录态）；`待确认` 是否需要管理员角色。
- Headers：`Authorization: Bearer <token>`
- Path 参数：无
- Query 参数：`prompt_type`、`label`（均可选）
- Request Body：无
- Success Response：`200 {"data": []ListPromptsResponseItem}`
- Error Responses：`500 {"error":"..."}`（查询失败）
- 副作用：无
- 异步行为：无
- 幂等性/重试建议：GET 可重试
- 兼容性说明：新增接口，不影响旧业务接口

#### Request Example

```json
{}
```

#### Response Example

```json
{
  "data": [
    {
      "prompt_type": "CLASSIFICATION",
      "label": "production",
      "prompt_id": 12,
      "version": 3,
      "provider": "openrouter",
      "model_name": "google/gemini-2.5-pro",
      "schema_hash": "abc123...",
      "is_protected": true,
      "release_at": "2026-03-30T12:00:00Z",
      "release_by": "admin",
      "description": "stable"
    }
  ]
}
```

#### 字段语义

| Field | Location | Type | Required | Meaning | Allowed values | Default / Null | Frontend note | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| prompt_type | response | string | yes | Prompt 类型标识 | 任意字符串 | - | 用于跳转详情与过滤 | `internal/handlers/prompt_handler.go` |
| label | response | string | yes | 发布标签 | 如 production/staging | - | 用作发布状态展示 | `internal/handlers/prompt_handler.go` |
| prompt_id | response | number | yes | 当前标签指向的版本 ID | 正整数 | - | 发布/回滚时复用 | `internal/handlers/prompt_handler.go` |

#### 前端接入提示

- `前端需处理`：新增列表页与筛选参数透传。
- `前端通常无需处理`：无需处理缓存来源（memory/redis/lkg）。
- `推测`：可增加按 `release_by`/`release_at` 的操作审计视图。
- `待确认`：是否需要服务端分页（当前实现未体现分页参数）。

### Endpoint: `POST /api/v1/prompts`

#### 已确认

- 用途：创建 Prompt（首个版本）。
- 前端触发时机：新建 Prompt 类型。
- 鉴权/权限：BearerAuth；`待确认` 是否管理员限定。
- Headers：`Authorization` + `Content-Type: application/json`
- Path 参数：无
- Query 参数：无
- Request Body：`CreatePromptVersionRequest`，其中 `prompt_type/model_name/system_prompt/user_prompt_template` 关键。
- Success Response：`201 {"message":"Prompt 创建成功","data": <Prompt>}`
- Error Responses：`400`（参数错误/缺字段），`500`（创建失败）
- 副作用：新增一条 `prompts` 记录；可选同步发布标签（`publish_label`）
- 异步行为：无
- 幂等性/重试建议：非幂等，不建议前端自动重试
- 兼容性说明：新增能力，不替换既有业务端点

#### Request Example

```json
{
  "name": "Classification Prompt",
  "prompt_type": "CLASSIFICATION",
  "provider": "openrouter",
  "model_name": "google/gemini-2.5-pro",
  "system_prompt": "You are a classifier.",
  "user_prompt_template": "Classify this file: {{FILE_NAME}}",
  "json_schema": "{\"type\":\"object\"}",
  "publish_label": "staging"
}
```

#### Response Example

```json
{
  "message": "Prompt 创建成功",
  "data": {
    "id": 101,
    "name": "Classification Prompt",
    "prompt_type": "CLASSIFICATION",
    "provider": "openrouter",
    "model_name": "google/gemini-2.5-pro",
    "version": 1
  }
}
```

#### 字段语义

| Field | Location | Type | Required | Meaning | Allowed values | Default / Null | Frontend note | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| prompt_type | request | string | yes | Prompt 类型键 | 任意字符串 | 不能为空 | 建议前端限制为大写枚举风格 | `internal/handlers/prompt_handler.go` |
| publish_label | request | string | no | 创建后可直接发布到标签 | 任意字符串 | 空则不发布 | 可做“创建并发布”开关 | `internal/handlers/prompt_handler.go` |

#### 前端接入提示

- `前端需处理`：新建表单必填校验。
- `前端通常无需处理`：无需手动计算 `schema_hash/content_hash`。
- `推测`：可增加 schema JSON 语法前置校验。
- `待确认`：provider 可选值列表是否固定。

### Endpoint: `GET /api/v1/prompts/:promptType`

#### 已确认

- 用途：获取某类型在指定标签下的生效 Prompt。
- 前端触发时机：详情页加载、发布后校验。
- 鉴权/权限：BearerAuth
- Headers：Authorization
- Path 参数：`promptType`
- Query 参数：`label`（可选，空时默认 production）
- Request Body：无
- Success Response：`200 {"data": PromptResolved}`
- Error Responses：`404`（label 未发布或类型不存在）
- 副作用：无
- 异步行为：无
- 幂等性/重试建议：GET 可重试
- 兼容性说明：读路径已与新发布模型一致

#### Request Example

```json
{}
```

#### Response Example

```json
{
  "data": {
    "label": "production",
    "schema_hash": "abc123...",
    "provider": "openrouter",
    "model_name": "google/gemini-2.5-pro",
    "cache_source": "db",
    "prompt": {
      "id": 12,
      "prompt_type": "CLASSIFICATION",
      "version": 3
    }
  }
}
```

#### 字段语义

| Field | Location | Type | Required | Meaning | Allowed values | Default / Null | Frontend note | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| label | query | string | no | 读取哪个发布标签 | 任意字符串 | 默认 production | 前端标签切换器需传入 | `internal/handlers/prompt_handler.go`, `internal/core/services/prompt_service.go` |
| cache_source | response | string | yes | 本次读取命中来源 | memory/redis/db/lkg | - | 仅展示可选，不建议业务依赖 | `internal/core/services/prompt_service.go` |

#### 前端接入提示

- `前端需处理`：详情页支持 label 切换。
- `前端通常无需处理`：无需关心 lkg 回退细节。
- `推测`：可在管理台展示 cache_source 方便排障。
- `待确认`：生产是否允许查看 `system_prompt` 全文（安全策略）。

### Endpoint: `GET /api/v1/prompts/:promptType/versions`

#### 已确认

- 用途：查询历史版本列表（按 version DESC）。
- 前端触发时机：版本历史 tab。
- 鉴权/权限：BearerAuth
- Path 参数：`promptType`
- Success Response：`200 {"data":[Prompt...]}`；Error：`500`
- 副作用：无；幂等：是

#### Request Example

```json
{}
```

#### Response Example

```json
{
  "data": [
    {
      "id": 12,
      "prompt_type": "CLASSIFICATION",
      "version": 3
    },
    {
      "id": 9,
      "prompt_type": "CLASSIFICATION",
      "version": 2
    }
  ]
}
```

#### 字段语义

| Field | Location | Type | Required | Meaning | Allowed values | Default / Null | Frontend note | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| version | response | number | yes | 不可变版本号 | 正整数 | - | 用于显示历史顺序 | `internal/core/services/prompt_service.go` |

#### 前端接入提示

- `前端需处理`：提供版本选择与比较入口。
- `前端通常无需处理`：不需要前端自行排序，后端已降序返回。
- `推测`：可增加“与当前生产版对比”按钮。
- `待确认`：是否需要分页（当前接口未体现）。

### Endpoint: `POST /api/v1/prompts/:promptType/versions`

#### 已确认

- 用途：在现有类型下创建新版本（修改 Prompt 的唯一合法路径）。
- 前端触发时机：点击“保存新版本”。
- 鉴权/权限：BearerAuth
- Path 参数：`promptType`
- Request Body：`CreatePromptVersionRequest`（`prompt_type` 将以 path 为准）
- Success：`201`；Error：`400/500`
- 副作用：新增版本，可选立即发布标签
- 幂等性：否

#### Request Example

```json
{
  "name": "Classification Prompt v4",
  "provider": "openrouter",
  "model_name": "google/gemini-2.5-pro",
  "system_prompt": "You are a strict classifier.",
  "user_prompt_template": "Classify: {{FILE_CONTENT}}",
  "json_schema": "{\"type\":\"object\"}",
  "publish_label": "staging"
}
```

#### Response Example

```json
{
  "message": "Prompt 新版本创建成功",
  "data": {
    "id": 15,
    "prompt_type": "CLASSIFICATION",
    "version": 4
  }
}
```

#### 字段语义

| Field | Location | Type | Required | Meaning | Allowed values | Default / Null | Frontend note | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| publish_label | request | string | no | 创建后自动发布标签 | 任意字符串 | 空则仅创建 | 可做“保存并发布”二选一 | `internal/handlers/prompt_handler.go` |

#### 前端接入提示

- `前端需处理`：把“编辑”按钮改为“新建版本”。
- `前端通常无需处理`：无需传 version，后端自动递增。
- `推测`：发布前可增加预览和审批 UI。
- `待确认`：是否强制先发 staging 再发 production。

### Endpoint: `GET /api/v1/prompts/:promptType/releases`

#### 已确认

- 用途：查看该类型所有标签记录。
- 鉴权：BearerAuth
- Path 参数：`promptType`
- Success：`200 {"data":[PromptRelease...]}`；Error：`500`
- 副作用：无；幂等：是

#### Request Example

```json
{}
```

#### Response Example

```json
{
  "data": [
    {
      "prompt_type": "CLASSIFICATION",
      "label": "production",
      "prompt_id": 12,
      "is_protected": true
    },
    {
      "prompt_type": "CLASSIFICATION",
      "label": "staging",
      "prompt_id": 15,
      "is_protected": false
    }
  ]
}
```

#### 字段语义

| Field | Location | Type | Required | Meaning | Allowed values | Default / Null | Frontend note | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| is_protected | response | boolean | yes | 标签是否受保护 | true/false | false | 用于禁用删除按钮 | `internal/handlers/prompt_handler.go` |

#### 前端接入提示

- `前端需处理`：展示标签到版本的映射关系。
- `前端通常无需处理`：无需处理后端 upsert 细节。
- `推测`：可高亮 production 标签。
- `待确认`：是否有固定标签集合约束。

### Endpoint: `POST /api/v1/prompts/:promptType/releases/:label/publish`

#### 已确认

- 用途：把某标签指向目标 `prompt_id`（发布/回滚共用）。
- 前端触发时机：发布按钮、回滚按钮。
- 鉴权：BearerAuth
- Path 参数：`promptType`,`label`
- Request Body：`PublishPromptReleaseRequest`
- Success：`200 {"message":"发布成功"}`；Error：`400/500`
- 副作用：更新 `prompt_releases` 指针；触发缓存失效（内存/redis）
- 异步行为：无
- 幂等性：对同一 `prompt_id` 重复发布可视作幂等
- 兼容性：与 `GetPrompt(label)` 读路径一致

#### Request Example

```json
{
  "prompt_id": 15,
  "description": "promote to staging",
  "is_protected": false
}
```

#### Response Example

```json
{
  "message": "发布成功"
}
```

#### 字段语义

| Field | Location | Type | Required | Meaning | Allowed values | Default / Null | Frontend note | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| prompt_id | request | number | yes | 标签将指向的版本 ID | 正整数 | - | 必填并需从版本列表选择 | `internal/handlers/prompt_handler.go` |
| is_protected | request | boolean | no | 是否将标签设为受保护 | true/false | 不传则不改 | 建议仅管理员可操作 | `internal/handlers/prompt_handler.go` |

#### 前端接入提示

- `前端需处理`：发布/回滚弹窗与二次确认。
- `前端通常无需处理`：缓存失效由后端处理。
- `推测`：发布后自动刷新详情与 release 列表。
- `待确认`：`production` 发布是否需要额外审批流程。

### Endpoint: `DELETE /api/v1/prompts/:promptType/releases/:label`

#### 已确认

- 用途：删除标签。
- 鉴权：BearerAuth
- Path 参数：`promptType`,`label`
- Success：`200 {"message":"标签已删除"}`
- Error：`404`（标签不存在）、`400`（production/受保护标签）、`500`（删除失败）
- 副作用：release 软删除
- 幂等性：否（重复删除会走 404）

#### Request Example

```json
{}
```

#### Response Example

```json
{
  "message": "标签已删除"
}
```

#### 字段语义

| Field | Location | Type | Required | Meaning | Allowed values | Default / Null | Frontend note | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| label | path | string | yes | 目标标签名 | 任意字符串 | - | 删除前先判定是否可删 | `internal/handlers/prompt_handler.go` |

#### 前端接入提示

- `前端需处理`：对 production/受保护标签禁用删除操作。
- `前端通常无需处理`：无需主动清缓存。
- `推测`：可提供“下线标签”替代“删除”文案。
- `待确认`：是否需要恢复已删除标签接口。

### Endpoint: `DELETE /api/v1/prompts/:promptType`

#### 已确认

- 用途：归档类型（删除该类型所有 release）。
- 鉴权：BearerAuth
- Path 参数：`promptType`
- Success：`200`
- Error：`500`
- 副作用：类型所有标签下线；历史版本记录仍在 `prompts`
- 幂等性：近似幂等（重复执行仍返回成功/无影响）

#### Request Example

```json
{}
```

#### Response Example

```json
{
  "message": "Prompt 类型已归档（标签已下线）"
}
```

#### 字段语义

| Field | Location | Type | Required | Meaning | Allowed values | Default / Null | Frontend note | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| promptType | path | string | yes | 被归档的 Prompt 类型 | 任意字符串 | - | 需要高风险确认弹窗 | `internal/handlers/prompt_handler.go` |

#### 前端接入提示

- `前端需处理`：高风险操作确认和结果刷新。
- `前端通常无需处理`：历史 versions 查询逻辑可保持不变。
- `推测`：可提示“仅下线标签，不删除历史版本”。
- `待确认`：是否允许普通业务用户执行归档。

## Frontend Actions Required

### 前端需处理

- [ ] 新增 `/api/v1/prompts*` 的 API client 方法（9 个端点）。
- [ ] 管理页面新增：发布列表、版本历史、标签管理、创建版本/创建 Prompt。
- [ ] 把“编辑 Prompt”交互改为“创建新版本”交互。
- [ ] 发布弹窗支持 `prompt_id` 选择与目标 `label` 指定。
- [ ] 删除标签按钮根据 `label/is_protected` 做禁用和错误处理。
- [ ] 所有请求统一携带 `Authorization: Bearer <token>`。
- [ ] 联调覆盖成功与失败路径（400/404/500）。

### 推测

- 可能需要“版本差异对比”视图（后端当前无专门 diff 接口）。
- 可能需要“发布记录审计”页面（当前可由 `GET /prompts` 基础实现）。

## Breaking Changes And Compatibility

- 是否存在破坏性变更：`已确认` Prompt 管理语义变化（修改走新版本，不走 update）。
- 兼容策略：旧后端业务读取 `GetLatestPrompt` 仍兼容（内部转发 production）。
- 前端最低改造要求：仅当你们要接入 Prompt 管理 UI 时需要改造；现有业务页面不强制改。

## Verification And Test Guidance

### 联调最小清单

- [ ] `GET /prompts` 能返回发布列表，筛选 `prompt_type/label` 生效。
- [ ] `POST /prompts/:promptType/versions` 创建成功后，`version` 递增。
- [ ] `POST .../publish` 后，`GET /:promptType?label=...` 返回新 `prompt_id`。
- [ ] 删除 `production` 标签返回 400。
- [ ] 删除不存在标签返回 404。
- [ ] 未携带 token 访问任意 prompts 端点返回 401。
- [ ] 归档后 release 列表为空，versions 仍可查（历史保留）。

### 建议测试输入

```json
{
  "name": "Classification Prompt v5",
  "provider": "openrouter",
  "model_name": "google/gemini-2.5-pro",
  "system_prompt": "You are a strict classification model.",
  "user_prompt_template": "Classify: {{TEXT}}",
  "json_schema": "{\"type\":\"object\",\"properties\":{\"category\":{\"type\":\"string\"}},\"required\":[\"category\"]}",
  "publish_label": "staging"
}
```

### 建议观察点

- Network：path、method、auth header 是否准确。
- Publish 后详情接口返回的 `label/prompt.id/version` 是否已切换。
- 错误提示是否区分 400（受保护标签）与 404（资源不存在）。
- 归档后管理列表与详情页状态是否同步刷新。

## Risks And Items To Confirm

### 待确认

- 是否需要管理员 RBAC（当前仅认证，无角色限制证据）。
- 是否要求 `production` 发布必须经过 `staging`（当前代码未强制）。
- `GET /prompts` 与 `GET /versions` 是否需要后端分页（当前代码未实现分页参数）。
- 是否需要单独开放 `prompt_call_logs` 查询接口给前端管理台。

### 联调建议

- 先接读接口（列表/详情/versions/releases），再接写接口（create/publish/delete）。
- 发布和删除都加二次确认弹窗，避免误操作。
- 将 “创建并发布” 与 “仅创建版本” 分成两个明确按钮。

## Verification Sources

- `api/router.go`
- `cmd/main.go`
- `internal/handlers/prompt_handler.go`
- `internal/core/services/prompt_service.go`
- `internal/database/migrations/000087_prompt_releases_and_prompt_hashes.up.sql`
- `internal/database/migrations/000088_prompt_call_logs.up.sql`
- `internal/database/migrations/000089_seed_prompt_release_labels.up.sql`
- `docs/prompt_management_api_plan.md`

