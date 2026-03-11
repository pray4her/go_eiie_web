# 前端适配说明（分类改造 + 分类导出 ZIP）

本文用于指导前端（或前端 AI）完成与最新后端分类能力的对接。

## 1. 变更概览

后端已将“文件分类结果”从旧的单字段 `category` 模式扩展为：

- `folder_category`：大分类文件夹名（支持多分类，`|` 分隔）
- `classified_file_name`：分类后标准文件名（支持多命名，`|` 分隔）
- 仍保留 `file_type`：用于后端提取策略映射（前端可展示但不建议作为主显示字段）

并新增接口：

- `GET /api/v1/files/:id/export-classified-zip`
  - 按“分类文件夹/具体文件名”导出 ZIP。

## 2. 分类目录规范（前端展示用）

后端分类目录固定为以下值（字符串）：

- `0简历`
- `1身份证明`
- `2学历证明`
- `3工作证明`
- `4项目证明`
- `51论文`
- `52著作`
- `53技术报告`
- `54会议`
- `55专利`
- `56荣誉`
- `6其他`

说明：

- 可出现多分类：如 `51论文|54会议`
- 对应文件名也可能多值：如 `2024+Deep Learning|ICML`

## 3. 接口变更明细

### 3.1 子文件列表接口

接口：

- `GET /api/v1/files/:id/children`

新增返回字段（每个子文件）：

- `folder_category: string`
- `classified_file_name: string`

示例：

```json
[
  {
    "file_id": 101,
    "original_file_name": "xxx.pdf",
    "file_type": "Research Paper Proof|Conference Documentation",
    "folder_category": "51论文|54会议",
    "classified_file_name": "2024+Deep Learning|ICML",
    "upload_status": "uploaded",
    "processing_status": "classified",
    "has_classification_result": true,
    "classification_result": {
      "analysis_trace": "...",
      "folder_category": "51论文|54会议",
      "file_name": "2024+Deep Learning|ICML"
    }
  }
]
```

### 3.2 新增：分类 ZIP 导出接口

接口：

- `GET /api/v1/files/:id/export-classified-zip`

鉴权：

- 与 `files` 组一致，Bearer Token。

行为：

- 导出当前父文件下所有子文件。
- ZIP 内按目录组织：`<folder_category>/<classified_file_name>.<ext>`
- 多分类文件会复制到多个目录。

返回：

- 成功：`application/zip`
- 失败：
  - `404` 父文件不存在或无权限
  - `409` 仍有子文件未完成分类（`queued/pending/preprocessing/classifying`）

## 4. 前端展示与交互建议

### 4.1 分类展示优先级

建议 UI 使用优先级：

1. `folder_category`
2. `classified_file_name`
3. `processing_status`
4. （可选）`file_type` 仅用于高级调试信息

### 4.2 多分类渲染

- 按 `|` 拆分 `folder_category` 渲染多个标签。
- 按 `|` 拆分 `classified_file_name` 渲染多个命名项。
- 若两边数量不一致：
  - 使用第一个文件名作为兜底显示。

### 4.3 按钮启用条件（导出分类 ZIP）

建议当且仅当满足以下条件启用按钮：

- 已有子文件列表；
- 没有子文件处于：
  - `queued`
  - `pending`
  - `preprocessing`
  - `classifying`

否则按钮置灰并提示“分类尚未完成”。

## 5. 兼容旧数据策略（重要）

历史数据可能没有 `folder_category` / `classified_file_name`。

前端兜底建议：

1. `folder_category` 为空时，显示 `file_type` 或“未分类”。
2. `classified_file_name` 为空时，回退 `original_file_name`（去扩展名）。
3. `classification_result` 可能是旧格式（只有 `category`），不要强依赖其字段形状。

## 6. 类型定义建议（TypeScript）

```ts
export interface ChildFileItem {
  file_id: number;
  original_file_name: string;
  file_type: string;
  folder_category?: string;
  classified_file_name?: string;
  upload_status: string;
  processing_status: string;
  has_classification_result: boolean;
  classification_result?: {
    analysis_trace?: string;
    category?: string; // 旧字段
    folder_category?: string; // 新字段
    file_name?: string; // 新字段
    [k: string]: unknown;
  };
}
```

## 7. 前端改造 Checklist

1. 更新 `children` 接口类型，接收 `folder_category`、`classified_file_name`。
2. 更新列表页分类展示逻辑，改为显示“分类文件夹 + 标准文件名”。
3. 新增“导出分类 ZIP”按钮并接入 `GET /files/:id/export-classified-zip`。
4. 增加按钮状态控制（未分类完成时禁用）。
5. 增加旧数据兜底逻辑（字段为空时回退）。
6. 若页面有分类编辑能力，确保提交后刷新 `children` 列表并按新字段渲染。

## 8. 备注

- 后端会对 `classified_file_name` 做文件名安全清洗（去除非法字符）。
- 分类结果保留多值语义（`|`），前端不应自行替换或丢弃分隔。
