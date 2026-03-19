# 客户号级沟通需求分析前端接入说明

## 1. 当前可用性结论

**当前除“著作证明”“会议证明”外，其余客户号级分析能力已可用。**

当前后端已接入并可运行的类别：

- 简历画像 `resume`
- 身份证明 `identity_documents`
- 学历证明 `educational_credentials`
- 工作证明 `employment_verification`
- 项目证明 `research_project_documentation`
- 专利证明 `patent_documentation`
- 荣誉证明 `honors_documentation`

补充说明：

- `academic_appointment_documentation` 已预留展示名映射为“学术兼职”，但当前未单独提供完整 prompt/rule 种子，不建议前端按已上线能力处理。
- 著作、会议暂未接入正式规则，不应在前端标记为“可分析完成态”。
- 上述“可用”指后端链路、数据库模型、异步任务、查询接口、规则校验接口都已具备；正式上线前仍建议先调用规则校验接口确认 `valid=true`。

## 2. 前端应如何理解这套能力

这是一个**按客户号触发**的异步分析流程，不是单文件同步接口。

基础业务流：

1. 文件先完成分类。
2. 用户如有需要，可修改分类。
3. 用户按客户号触发“沟通需求分析”。
4. 后端先生成主简历/客户简历画像。
5. 后端再按类别生成材料分析结果。
6. 前端展示客户号级汇总、类别结果、沟通文案和历史 run。

## 3. 前端必须知道的几个核心规则

### 3.1 触发单位

- 触发单位是 `customer_id`
- 默认纳入该客户号下全部已分类文件
- 也支持通过 `include_file_ids` / `exclude_file_ids` 控制本次分析范围

### 3.2 主简历规则

- 若该客户号下有多份简历，优先选择文件名中可识别年份的最新一份
- 若所有简历都没有年份，则合并多份简历生成客户级简历画像

### 3.3 过期规则

当文件分类被人工修改，旧的分析结果不会被删除，而是会被标记为：

- `is_stale = true`
- `stale_reason` 会记录原因

前端默认应优先展示：

- 最新且未过期的 run

如果没有未过期 run，后端会回退返回最近一次 run，哪怕它已经 `stale`。前端必须显式展示过期标识。

## 4. 鉴权与请求约定

- 所有 `/api/v1/customer-analyses/*` 接口都需要标准 Bearer Token
- 返回格式为 JSON
- 当前没有 customer-analysis 专用 SSE 推送接口，前端应使用轮询

推荐轮询方式：

1. 触发后拿到 `run_id`
2. 轮询 `GET /api/v1/customer-analyses/runs/:runId/display`
3. 当 `run.status` 变为 `completed` 或 `failed` 时停止

## 5. 推荐前端使用的接口

### 5.1 触发分析

`POST /api/v1/customer-analyses/trigger`

请求体：

```json
{
  "customer_id": 123456,
  "include_file_ids": [101, 102],
  "exclude_file_ids": [103]
}
```

字段说明：

- `customer_id`: 必填
- `include_file_ids`: 可选；如果传了，则只分析这些文件
- `exclude_file_ids`: 可选；从默认范围中排除

成功返回：

```json
{
  "message": "customer analysis accepted",
  "run_id": 88,
  "customer_id": 123456
}
```

注意：

- 这是异步接口，`202 Accepted` 不代表分析已完成
- 触发成功后需要继续轮询 run 详情

### 5.2 获取 run 历史列表

`GET /api/v1/customer-analyses/runs`

查询参数：

- `customer_id`: 可选，按客户号过滤
- `include_stale`: 可选，默认 `false`
- `limit`: 可选，默认 `20`，最大 `100`
- `offset`: 可选，默认 `0`

返回结构：

```json
{
  "total": 2,
  "items": [
    {
      "id": 88,
      "customer_id": 123456,
      "status": "completed",
      "is_stale": false,
      "stale_reason": "",
      "trigger_source": "manual",
      "selected_file_count": 12,
      "category_count": 6,
      "completed_count": 6,
      "failed_count": 0,
      "created_at": "2026-03-19T09:00:00+08:00",
      "completed_at": "2026-03-19T09:01:30+08:00"
    }
  ]
}
```

前端用途：

- 历史记录页
- 运行状态列表
- 过期 run 查看

### 5.3 获取某次 run 的稳定展示详情

`GET /api/v1/customer-analyses/runs/:runId/display`

这是**前端主用接口之一**。建议详情页、轮询页优先使用它，而不是直接使用 raw summary。

核心返回结构：

```json
{
  "run": {
    "id": 88,
    "customer_id": 123456,
    "status": "completed",
    "is_stale": false,
    "stale_reason": "",
    "trigger_source": "manual",
    "include_file_ids": [],
    "exclude_file_ids": [],
    "selected_file_ids": [101, 102, 104],
    "summary_json": {},
    "error_message": null,
    "completed_at": "2026-03-19T09:01:30+08:00",
    "created_at": "2026-03-19T09:00:00+08:00",
    "updated_at": "2026-03-19T09:01:30+08:00"
  },
  "overview": {
    "customer_id": 123456,
    "run_id": 88,
    "is_stale": false,
    "selected_file_count": 12,
    "category_count": 6,
    "completed_count": 6,
    "failed_count": 0
  },
  "resume_profile": {
    "status": "completed",
    "primary_resume_file_id": 101,
    "selected_resume_files": [],
    "profile_data": {},
    "formatted_resume_text": "......",
    "error_message": null
  },
  "items": [
    {
      "id": 1,
      "rule_code": "identity_documents_default",
      "category_key": "identity_documents",
      "display_name": "身份证明",
      "status": "completed",
      "result_status": "complete",
      "communication_text": "<身份证明完整>；目前已有身份证明：......",
      "source_file_ids": [102],
      "structured_data": {},
      "issue_count": 0,
      "error_message": null
    }
  ]
}
```

#### 字段语义

`run.status`：

- `pending`: 已创建，未开始
- `processing`: 正在跑
- `completed`: 整个 run 已完成
- `failed`: run 级失败

`item.status`：

- `pending`
- `processing`
- `completed`
- `skipped`
- `failed`

`item.result_status`：

- 这是**业务判定结果**
- 统一从各类别 `structured_data` 中抽取
- 可能值示例：
  - `complete`
  - `incomplete`
  - `sufficient`
  - `insufficient`
  - `ambiguous`
  - `no_resume_patent`
  - `no_resume_honors`

`item.issue_count`：

- 用于前端统一显示“问题数量”
- 已由后端按常见字段做归一化计数
- 前端不要自己去写每种类别的缺失项计数逻辑作为主逻辑

#### 前端展示建议

- 主页面优先展示 `overview + items`
- 每个类别卡片主读：
  - `display_name`
  - `result_status`
  - `communication_text`
  - `issue_count`
- 只有在需要展开明细时再读 `structured_data`

### 5.4 获取客户号最新稳定展示汇总

`GET /api/v1/customer-analyses/customers/:customerId/display-summary`

这是**客户号主页面推荐主接口**。

特点：

- 优先返回最新且未过期 run
- 若没有未过期 run，则返回最新一条 run
- 返回结构与 `runs/:runId/display` 相同

推荐用途：

- 客户详情页
- 材料总览页
- 页面初始化时直接拉最新结果

### 5.5 获取客户号最新简历画像

`GET /api/v1/customer-analyses/customers/:customerId/resume-profile`

用途：

- 单独查看简历画像
- 简历解析调试
- 独立简历信息面板

注意：

- 前端如果只是做客户号总览，优先用 `display-summary`
- 只有需要独立展示简历提取结果时，再额外调用该接口

### 5.6 规则校验接口

`GET /api/v1/customer-analyses/rules/validate`

用途：

- 开发联调
- 上线巡检
- 运维自检

返回核心结构：

```json
{
  "valid": true,
  "rule_count": 7,
  "items": [
    {
      "rule_code": "identity_documents_default",
      "category_key": "identity_documents",
      "stage": "category_analysis",
      "prompt_type": "CUSTOMER_ANALYSIS_IDENTITY_DOCUMENTS",
      "config_path": "config/customer_analysis_rules/identity_documents_default.yaml",
      "is_active": true,
      "valid": true,
      "issues": []
    }
  ]
}
```

当前会检查：

- 是否存在且仅存在 1 条激活的简历规则
- 同一 `category_key` 是否有重复激活规则
- 配置文件是否可读取
- prompt 是否存在
- `category_key` 与 YAML 是否一致
- `output_schema` 是否存在

建议：

- 这个接口主要给开发/测试/运维，不建议直接暴露在普通业务页

## 6. 不建议前端主用的接口

以下接口仍然可用，但更适合调试或后端排查：

- `GET /api/v1/customer-analyses/runs/:runId`
- `GET /api/v1/customer-analyses/customers/:customerId/summary`

原因：

- 这两个接口包含更原始的数据形态
- `structured_data` 更自由，字段受规则影响更大
- 前端主展示建议优先使用 `display` 版本接口

## 7. 已上线类别与展示名映射

前端如果需要自己兜底展示名称，可使用以下映射：

- `resume` -> `简历画像`
- `identity_documents` -> `身份证明`
- `educational_credentials` -> `学历证明`
- `employment_verification` -> `工作证明`
- `research_project_documentation` -> `项目证明`
- `patent_documentation` -> `专利证明`
- `honors_documentation` -> `荣誉证明`
- `academic_appointment_documentation` -> `学术兼职`

但更推荐直接使用后端返回的：

- `display_name`

## 8. 前端页面建议

### 8.1 客户材料总览页

建议流程：

1. 页面进入时调用 `GET /customers/:customerId/display-summary`
2. 如果不存在结果，显示“尚未生成分析”
3. 用户点击“开始分析”时调用 `POST /trigger`
4. 触发成功后跳转或开始轮询 `GET /runs/:runId/display`
5. 若 `run.is_stale = true`，在页面顶部展示“结果已过期，请手动重跑”

### 8.2 历史 run 页

建议流程：

1. 调用 `GET /runs?customer_id=xxx&include_stale=true`
2. 按 `created_at desc` 展示历史
3. 清楚标记：
  - `status`
  - `is_stale`
  - `stale_reason`
  - `completed_count / failed_count`

### 8.3 类别卡片

建议使用字段：

- 标题：`display_name`
- 执行态：`status`
- 业务态：`result_status`
- 风险数量：`issue_count`
- 主文案：`communication_text`
- 关联材料：`source_file_ids`

## 9. 前端需要特别注意的地方

### 9.1 不要把 `structured_data` 当成强绑定契约

`structured_data` 是**类别级自由结构**，后续随着规则与 prompt 升级可能调整。

前端应优先依赖稳定字段：

- `display_name`
- `status`
- `result_status`
- `communication_text`
- `issue_count`
- `source_file_ids`

只有做“展开详情”时，才按类别读取 `structured_data`。

### 9.2 要区分“执行状态”和“业务结果”

例如：

- `status=completed` 只说明模型执行完成
- `result_status=incomplete` 才说明业务上材料不完整

不要把二者混用。

### 9.3 要显式展示 stale

因为分类修改后旧结果不会删除，前端必须显式处理：

- `run.is_stale`
- `run.stale_reason`

推荐在总览页顶部给明显提示。

### 9.4 列表接口默认不返回 stale run

`GET /runs` 默认：

- `include_stale=false`

如果前端要做历史页，记得显式传：

- `include_stale=true`

### 9.5 `display-summary` 可能返回 stale 结果

当某客户没有任何未过期结果时，后端会回退到最新一条 run。

因此前端不能假设：

- `display-summary` 返回的一定是新鲜结果

必须检查：

- `overview.is_stale`
- `run.is_stale`

### 9.6 暂无 customer-analysis SSE

当前没有专用订阅接口，因此前端应轮询。

建议轮询策略：

- 间隔 2~5 秒
- 最长轮询 2~3 分钟后提示用户刷新
- `completed` / `failed` 即停止

## 10. 联调前置条件

前端联调前，后端环境至少需要满足：

- 已执行 migration：
  - `000079`
  - `000080`
  - `000081`
  - `000082`
- 规则配置文件已存在
- prompt 种子已写入数据库
- 文件已完成分类
- `GET /api/v1/customer-analyses/rules/validate` 返回 `valid=true`

## 11. 当前已知边界

- 著作、会议尚未接入正式规则
- `academic_appointment_documentation` 仅有展示名预留，前端不应假设已稳定上线
- 不同类别的 `structured_data` 结构不完全一致，这是设计使然
- 当前客户号分析为异步任务，前端必须接受“稍后完成”的交互方式

## 12. 给前端 AI 的实现建议

如果后续由前端 AI 自动生成页面或状态管理逻辑，建议遵守以下原则：

- 客户总览页主接口固定使用 `GET /api/v1/customer-analyses/customers/:customerId/display-summary`
- 详情页或轮询页固定使用 `GET /api/v1/customer-analyses/runs/:runId/display`
- 历史页固定使用 `GET /api/v1/customer-analyses/runs`
- 不直接基于 `structured_data` 写死 UI 主逻辑
- 所有卡片统一使用 `display_name + result_status + issue_count + communication_text`
- 对 `is_stale` 做高优先级视觉提示
- 把“重新分析”作为用户可手动触发操作，不要自动代替用户重跑

## 13. 推荐联调顺序

1. 先调通 `GET /api/v1/customer-analyses/rules/validate`
2. 再调通 `POST /api/v1/customer-analyses/trigger`
3. 接着调通 `GET /api/v1/customer-analyses/runs/:runId/display`
4. 最后接 `GET /api/v1/customer-analyses/customers/:customerId/display-summary`
5. 历史页再接 `GET /api/v1/customer-analyses/runs`

这样前端可以先完成主链路，再补历史与调试能力。
