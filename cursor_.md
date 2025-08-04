# 了解项目结构和数据库构成
_Exported on 2025/8/1 at GMT+8 17:39:23 from Cursor (1.3.4)_

---

**User**

请你先阅读相关代码，了解项目结构和数据库构成，代码功能
ENTER RESEARCH MODE

---

**Cursor**



[MODE: RESEARCH]

好的，我已经阅读了您提供的代码和文档。以下是我对该项目的结构、数据库构成和核心功能的观察和理解。

### 项目概述

这是一个 **智能文档处理与信息提取系统**。其核心功能是：
1.  用户上传各类文档（如PDF、DOCX、压缩包）。
2.  系统在后台通过异步任务队列对文档进行自动化处理。
3.  利用AI（主要是Google Gemini）对文档进行 **分类**（例如，判断是护照、简历还是工作证明）。
4.  根据分类结果，使用相应的AI指令（Prompt）从文档中 **提取结构化信息**。
5.  将提取出的信息存储在专门设计的数据库表中。
6.  提供API接口，供用户查询处理状态、查看和导出提取的数据。
7.  此外，系统还具备基于上传文档生成新内容的功能。

### 技术栈和架构

*   **后端语言**: Go
*   **Web框架**: `gin-gonic/gin` 用于构建HTTP API服务。
*   **数据库**: 从 `DATABASE.md` 的数据类型（如 `timestamptz`, `jsonb`）来看，很可能是 PostgreSQL。使用 `GORM`作为ORM。
*   **异步任务队列**: `hibiken/asynq` 配合 `Redis` 实现后台任务处理，用于执行文件分析、AI调用等耗时操作，避免API请求超时。
*   **AI集成**: 系统深度集成了AI模型（特别是Gemini）。`cmd/main.go` 中可见一个 `ManagedGeminiClient`，它通过一个复杂的API密钥管理系统 (`apikeymgr`) 来调用AI服务，该系统支持多密钥轮换、速率限制、使用统计和优先级管理。
*   **配置文件**: 通过 `config/loader.go` 加载，集中管理数据库、Redis、服务器端口和AI相关的密钥等配置。

### 项目结构分析

项目的代码组织清晰，遵循了标准的Go项目布局：

*   `cmd/main.go`: 程序的入口，负责所有服务的初始化、依赖注入和启动。
*   `api/router.go`: 定义了所有的HTTP API路由，并将它们指向相应的处理函数。
*   `internal/`: 包含项目的核心业务逻辑。
    *   `handlers`: 处理HTTP请求，解析参数，并调用`services`层。
    *   `services`: 封装核心业务逻辑，例如用户服务、文件服务、内容生成服务等。
    *   `workers`: 定义和处理后台异步任务（如文件分类、信息提取）。这是系统的核心处理引擎。
    *   `core/models`: 定义了与数据库表结构对应的Go结构体。
    *   `middleware`: 包含了JWT身份验证等中间件。
*   `pkg/`: 存放可重用的通用功能包，如数据库连接、Redis客户端、Gemini客户端、速率限制器等。
*   `documents/`: 存放项目的设计文档，其中 `DATABASE.md` 极为重要，详细描述了数据库结构。

### 数据库构成分析 (`DATABASE.md`)

数据库设计是该系统的核心，体现了其功能复杂性。主要可以分为几类：

1.  **核心表**:
    *   `users`: 存储用户信息。
    *   `files`: **中心表**，记录每个上传文件的元数据，包括上传者、存储路径、处理状态 (`processing_status`) 以及AI的分类结果 (`file_type`)。`parent_file_id` 字段表明它能处理解压后的子文件。

2.  **配置与策略表**:
    *   `prompts`: 存储调用AI时使用的指令模板，按类型（如`CLASSIFICATION`）和版本进行管理。
    *   `extraction_strategies`: **高度灵活的设计核心**。这张表将 `file_type` (文件类型) 与 `prompt_id` (AI指令)、`target_table_name` (目标数据表) 和保存逻辑关联起来。这意味着信息提取的整个流程是可以通过修改数据库配置来动态调整的，而无需修改代码。

3.  **数据存储表**:
    *   为 **每一种** 文件类型都设计了专门的数据表来存储提取出的结构化信息。例如：
        *   `passport_data`: 存储护照信息。
        *   `academic_certificate_data`: 存储学历证明信息。
        *   `work_certificate_data` 和 `work_experiences`: 存储工作证明（支持一个证明含多段经历）。
        *   `resume_data` 及相关子表: 存储从简历中提取的复杂信息。
        *   ...以及其他多种证明文件对应的表。
    *   这种设计取代了早期将所有结果存为一个JSON的方案（`extracted_data`表，已标记为待废弃），使得数据结构更清晰，查询更高效。

4.  **API密钥管理与监控表**:
    *   `api_keys`: 存储AI服务商的API密钥，包含速率限制、优先级、是否激活等详细配置。
    *   `api_key_usage_stats`, `api_call_logs`: 用于详细记录和统计每个密钥的调用情况，便于监控、调试和成本控制。

### 核心工作流程推测

1.  用户通过 `/api/v1/files/upload` 接口上传文件。
2.  `file_handler` 创建一个文件记录，并向 Asynq 任务队列中推送一个后台处理任务。
3.  后台 `worker` 接收到任务，首先进行 **文件分类**，它会从 `prompts` 表获取分类用的Prompt，调用Gemini API，然后将返回的 `file_type` 更新到 `files` 表。
4.  根据这个 `file_type`，`worker` 从 `extraction_strategies` 表中查找对应的提取策略。
5.  `worker` 使用策略中指定的 `prompt_id` 再次调用Gemini API，要求其从文件中提取结构化数据。
6.  AI返回JSON格式的数据后，`worker` 根据策略中定义的 `target_table_name` 和 `field_mappings`，将数据解析并存入相应的数据库表（如 `passport_data`）。
7.  整个过程中，文件的 `processing_status` 会被实时更新。
8.  用户可以通过 `/api/v1/files/:id/extracted-data` 接口查询最终的结构化结果。

总结完毕。这个项目架构设计良好，特别是其配置驱动的提取策略和强大的API密钥管理系统，显示了其具备高灵活性和可扩展性。

---

**User**

现在我将基于next.js开发一个简单的前端项目，用于用户使用后端的接口功能，请查看各接口输入输出的数据格式内容，了解各接口的作用和输入输出数据格式
ENTER RESEARCH MODE


---

**Cursor**



[MODE: RESEARCH]

好的，遵从您的指示。我现在将研究后端API的各个接口，以明确它们的功能、输入和输出数据格式，为接下来的前端开发做准备。

我将从 `api/router.go` 中定义的路由开始，逐个分析每个接口。

### API 接口分析

根据 `api/router.go`，API根路径为 `/api/v1`。主要分为三个部分：认证 (`/auth`)、文件处理 (`/files`) 和内容生成 (`/writing`)。

#### 1. 认证接口 (`/api/v1/auth`)

这部分接口无需身份验证。

*   **`POST /auth/register`**
    *   **作用**: 用户注册。
    *   **处理程序**: `authHandler.Register`
    *   **输入 (Request Body - JSON)**:
        ```json
        {
          "username": "someuser",
          "password": "somepassword"
        }
        ```
    *   **输出 (Response Body - JSON)**:
        *   成功:
            ```json
            {
              "message": "User registered successfully",
              "user": {
                "id": 1,
                "username": "someuser"
                // created_at, updated_at等字段也可能被包含
              }
            }
            ```
        *   失败 (例如，用户已存在): `400 Bad Request` 或 `409 Conflict`，并附带错误信息。
            ```json
            {
              "error": "Username already exists"
            }
            ```

*   **`POST /auth/login`**
    *   **作用**: 用户登录，成功后返回JWT令牌。
    *   **处理程序**: `authHandler.Login`
    *   **输入 (Request Body - JSON)**:
        ```json
        {
          "username": "someuser",
          "password": "somepassword"
        }
        ```
    *   **输出 (Response Body - JSON)**:
        *   成功:
            ```json
            {
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
            ```
            前端需要将此 `token` 保存下来（例如在 Local Storage 中），并在后续请求的 `Authorization` header 中以 `Bearer <token>` 的形式发送。
        *   失败 (例如，密码错误): `401 Unauthorized`
            ```json
            {
              "error": "Invalid credentials"
            }
            ```

#### 2. 文件处理接口 (`/api/v1/files`)

**注意**: 所有 `/files` 和 `/writing` 下的接口都需要在HTTP请求头中提供有效的JWT认证：`Authorization: Bearer <token>`。

*   **`POST /upload`**
    *   **作用**: 上传单个文件（例如，.pdf, .docx, .zip, .rar）。系统会自动将其加入后台处理队列。
    *   **处理程序**: `fileHandler.UploadFile`
    *   **输入 (Request - `multipart/form-data`)**:
        *   一个名为 `file` 的文件字段。
    *   **输出 (Response Body - JSON)**:
        *   成功: `202 Accepted` (表示请求已接受，正在后台处理)
            ```json
            {
              "message": "File uploaded and processing started",
              "file_id": 123,
              "original_file_name": "mydocument.pdf",
              "status_url": "/api/v1/files/123/status"
            }
            ```
        *   失败: `400 Bad Request` (如未上传文件) 或 `500 Internal Server Error`。

*   **`GET /`**
    *   **作用**: 列出当前用户上传的所有文件（包括父文件和子文件）。
    *   **处理程序**: `fileHandler.ListFiles`
    *   **输入**: 无。
    *   **输出 (Response Body - JSON)**:
        *   成功:
            ```json
            [
              {
                "id": 123,
                "user_id": 1,
                "original_file_name": "archive.zip",
                "storage_path": "uploads/...",
                "file_size": 102400,
                "content_type": "application/zip",
                "processing_status": "completed", // "pending", "processing", "classification_failed", "extraction_failed" 等
                "file_type": null, // 父文件通常没有类型
                "parent_file_id": null,
                "created_at": "..."
              },
              {
                "id": 124,
                "original_file_name": "passport.pdf",
                "processing_status": "completed",
                "file_type": "passport", // AI分类结果
                "parent_file_id": 123,
                "created_at": "..."
              }
            ]
            ```

*   **`GET /:id/status`**
    *   **作用**: 获取指定ID文件的当前处理状态。
    *   **处理程序**: `fileHandler.GetFileStatus`
    *   **输入 (URL参数)**: `:id` - 文件ID。
    *   **输出 (Response Body - JSON)**:
        *   成功: 返回单个文件对象，结构同上 `GET /` 列表中的条目。
        *   失败: `404 Not Found`。

*   **`GET /:id/children`**
    *   **作用**: 如果指定ID的文件是一个压缩包，此接口列出其所有子文件的状态。
    *   **处理程序**: `fileHandler.ListChildFilesStatus`
    *   **输入 (URL参数)**: `:id` - 父文件（压缩包）的ID。
    *   **输出 (Response Body - JSON)**:
        *   成功: 返回一个文件对象数组，结构同上 `GET /` 列表中的条目。
        *   失败: `404 Not Found`。

*   **`GET /:id/extracted-data`**
    *   **作用**: 获取指定ID文件提取出的结构化数据。这是展示结果的核心接口。
    *   **处理程序**: `fileHandler.GetExtractedData`
    *   **输入 (URL参数)**: `:id` - 文件ID。
    *   **输出 (Response Body - JSON)**:
        *   成功: 返回的数据结构 **取决于 `file_type`**。例如，如果 `file_type` 是 `passport`，返回的就是 `passport_data` 表的内容。
            ```json
            // 示例：护照数据
            {
              "file_type": "passport",
              "data": {
                "id": 1,
                "file_id": 124,
                "name_en": "SAN ZHANG",
                "gender": "Male",
                // ... 其他护照字段 ...
              }
            }
            ```
            如果文件处理未完成或失败，`data` 字段可能为 `null`。
        *   失败: `404 Not Found` 或 `500 Internal Server Error` (如果查询数据时出错)。

*   **`GET /:id/export`**
    *   **作用**: 导出指定文件的提取数据（可能是Excel或CSV格式）。
    *   **处理程序**: `fileHandler.ExportExtractedData`
    *   **输入 (URL参数)**: `:id` - 文件ID。
    *   **输出**:
        *   成功: 返回一个文件流，例如 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (Excel)。浏览器会触发下载。
        *   失败: `404 Not Found` 或 `500 Internal Server Error` 并返回JSON错误信息。

#### 3. 内容生成接口 (`/api/v1/writing`)

*   **`POST /generate`**
    *   **作用**: 上传一个或多个文件，并提供一个生成内容的指令（prompt），启动一个内容生成任务。
    *   **输入 (Request - `multipart/form-data`)**:
        *   `files`: 一个或多个文件字段。
        *   `prompt`: 一个包含生成指令的文本字段。
    *   **输出 (Response Body - JSON)**:
        *   成功: `202 Accepted`
            ```json
            {
                "message": "Content generation job started.",
                "job_id": "some-unique-job-id"
            }
            ```

*   **`POST /generate-with-ids`**
    *   **作用**: 基于已上传文件的ID列表和指令来生成内容。
    *   **输入 (Request Body - JSON)**:
        ```json
        {
          "file_ids": [123, 124, 125],
          "prompt": "Summarize these documents."
        }
        ```
    *   **输出 (Response Body - JSON)**:
        *   成功: `202 Accepted`，同 `/generate`。

*   **`GET /jobs`**
    *   **作用**: 列出当前用户的所有内容生成任务。
    *   **输出 (Response Body - JSON)**:
        *   成功:
            ```json
            [
              {
                "id": "some-unique-job-id",
                "user_id": 1,
                "status": "completed", // "pending", "processing", "failed"
                "prompt": "Summarize these documents.",
                "created_at": "..."
                // 可能还有结果预览字段
              }
            ]
            ```

*   **`GET /jobs/:jobId/status`**
    *   **作用**: 查询特定内容生成任务的状态和结果。
    *   **输入 (URL参数)**: `:jobId` - 任务ID。
    *   **输出 (Response Body - JSON)**:
        *   成功:
            ```json
            {
              "id": "some-unique-job-id",
              "status": "completed",
              "prompt": "...",
              "results": [
                {
                  "file_name": "result.md",
                  "content": "# Summary\nThis is the generated summary..."
                }
              ],
              "created_at": "...",
              "completed_at": "..."
            }
            ```
        *   失败: `404 Not Found`。

分析完毕。这些信息应该足够用来规划和开发前端应用了。

```json
        {
          "username": "someuser",
          "password": "somepassword"
        }
```

```json
            {
              "message": "User registered successfully",
              "user": {
                "id": 1,
                "username": "someuser"
                // created_at, updated_at等字段也可能被包含
              }
            }
```

```json
            {
              "error": "Username already exists"
            }
```

```json
        {
          "username": "someuser",
          "password": "somepassword"
        }
```

```json
            {
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
```

```json
            {
              "error": "Invalid credentials"
            }
```

```json
            {
              "message": "File uploaded and processing started",
              "file_id": 123,
              "original_file_name": "mydocument.pdf",
              "status_url": "/api/v1/files/123/status"
            }
```

```json
            [
              {
                "id": 123,
                "user_id": 1,
                "original_file_name": "archive.zip",
                "storage_path": "uploads/...",
                "file_size": 102400,
                "content_type": "application/zip",
                "processing_status": "completed", // "pending", "processing", "classification_failed", "extraction_failed" 等
                "file_type": null, // 父文件通常没有类型
                "parent_file_id": null,
                "created_at": "..."
              },
              {
                "id": 124,
                "original_file_name": "passport.pdf",
                "processing_status": "completed",
                "file_type": "passport", // AI分类结果
                "parent_file_id": 123,
                "created_at": "..."
              }
            ]
```

```json
            // 示例：护照数据
            {
              "file_type": "passport",
              "data": {
                "id": 1,
                "file_id": 124,
                "name_en": "SAN ZHANG",
                "gender": "Male",
                // ... 其他护照字段 ...
              }
            }
```

```json
            {
                "message": "Content generation job started.",
                "job_id": "some-unique-job-id"
            }
```

```json
        {
          "file_ids": [123, 124, 125],
          "prompt": "Summarize these documents."
        }
```

```json
            [
              {
                "id": "some-unique-job-id",
                "user_id": 1,
                "status": "completed", // "pending", "processing", "failed"
                "prompt": "Summarize these documents.",
                "created_at": "..."
                // 可能还有结果预览字段
              }
            ]
```

```json
            {
              "id": "some-unique-job-id",
              "status": "completed",
              "prompt": "...",
              "results": [
                {
                  "file_name": "result.md",
                  "content": "# Summary\nThis is the generated summary..."
                }
              ],
              "created_at": "...",
              "completed_at": "..."
            }
```

---

**User**

请根据你了解的信息，帮我写一份详细的开发文档，我将按照文档的步骤详细的来开发这个next.js的前端应用，该应用需要实现以下基本功能：
基础的用户注册，登陆，jwt认证，网页持久化存储，一段时间内不需要重复登录
信息提取功能，用户点击或拖拽上传压缩包，文件进入处理流程。
一个查看页面，可以查看该用户下的所有压缩包，点击后根据具体的查询接口查询该压缩包下的各个文件的处理状态，用户根据信息追踪接口，清晰的看到该压缩包下每一个文件的处理进度，是分类中，还是提取中，还是提取完成。该页面还有一个导出按钮，点击后触发export接口相关的功能，将提取的信息导出为excel表格，并且触发下载。
一个生成200字的页面，用户上传申报书文件和简历文件，点击触发生成后，如上述功能一样，可以查看到处理进度

---

**Cursor**

好的，没问题。基于您提供的需求和我们之前对后端API的分析，我为您撰写一份详细的 Next.js 前端应用开发计划文档。

这份文档将遵循您提供的 `nextjs_rules`，使用最新的 Next.js App Router、TypeScript、Shadcn UI 和 Tailwind CSS 技术栈，并采用模块化、可维护性高的代码结构。

---

### **智能文档处理系统 - 前端开发计划 (V1.0)**

#### **1. 项目初始化与基本设置**

**目标**: 创建一个结构清晰、配置完善的 Next.js 项目。

**步骤**:

1.  **创建 Next.js 应用**:
    *   使用 `create-next-app` 初始化项目，并选择 TypeScript, Tailwind CSS, App Router。
    ```bash
    npx create-next-app@latest go-eiie-frontend --typescript --tailwind --eslint --app
    ```

2.  **创建项目结构**:
    *   在项目根目录下创建 `frontend` 文件夹，并将所有 Next.js 相关的文件和目录（`src`, `public`, `next.config.mjs`, `package.json`等）移入其中，以保持与后端代码的隔离。
    *   在 `frontend` 目录内，创建 `src` 目录，并将 `app` 文件夹移入其中。
    *   在 `src` 目录下创建 `components`, `lib`, `hooks`, `contexts`, `types` 目录。
        *   `src/components`: 存放可重用UI组件 (遵循 `nextjs_rules` 的组织方式, 如 `ui`, `features`)。
        *   `src/lib`: 存放辅助函数、API客户端、utils等。
        *   `src/hooks`: 存放自定义React Hooks。
        *   `src/contexts`: 存放全局状态管理的Context。
        *   `src/types`: 存放全局共享的TypeScript类型定义。

3.  **安装核心依赖**:
    ```bash
    # 进入前端目录
    cd frontend 
    
    # UI组件库
    npx shadcn-ui@latest init
    
    # 表单处理
    npm install react-hook-form zod @hookform/resolvers
    
    # API请求
    npm install axios
    
    # 状态管理与持久化 (用于JWT)
    npm install zustand zustand/middleware
    
    # 图标
    npm install lucide-react
    
    # 文件上传交互
    npm install react-dropzone
    
    # 通知/提示
    npm install sonner
    ```
    *   **Shadcn UI 配置**: 初始化时，将 `components` 路径设置为 `src/components`。

4.  **配置环境变量**:
    *   在 `frontend` 目录下创建 `.env.local` 文件。
    *   添加后端API的基础URL：
        ```
        NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
        ```

5.  **创建 API 客户端**:
    *   在 `src/lib/api.ts` 中创建一个 `axios` 实例，用于统一处理API请求。这个实例会自动附加 `Authorization` header（如果token存在）。
    *   我们会利用 `Zustand` 来管理全局的 token 状态。

#### **2. 认证功能 (注册、登录与持久化)**

**目标**: 实现完整的用户认证流程，并利用持久化存储保持用户登录状态。

**步骤**:

1.  **创建认证状态管理 (Zustand)**:
    *   在 `src/contexts/auth-store.ts` 中，使用 `zustand` 创建一个 `store`。
    *   该 `store` 包含 `token`, `user` 信息，以及 `login`, `logout` 等 action。
    *   使用 `persist` 中间件将 `token` 和 `user` 信息存储在 `localStorage` 中，实现持久化登录。

2.  **创建认证页面组件**:
    *   在 `src/app/(auth)/login/page.tsx` 创建登录页面。
    *   在 `src/app/(auth)/register/page.tsx` 创建注册页面。
    *   使用 Shadcn UI 的 `Card`, `Input`, `Button`, `Label` 和 `Form` (结合 `react-hook-form`) 来构建表单。
    *   表单提交时调用相应的API接口 (`/auth/login`, `/auth/register`)。
    *   登录成功后，调用 `auth-store` 中的 `login` action，将返回的 `token` 保存起来，并使用 Next.js 的 `router` 跳转到主页。

3.  **创建认证高阶组件/Hook (`withAuth`)**:
    *   创建一个客户端组件或Hook，用于保护需要登录才能访问的页面。
    *   它会检查 `auth-store` 中是否存在有效的 `token`。如果不存在，则将用户重定向到登录页面。

#### **3. 信息提取功能**

**目标**: 实现文件上传、处理状态跟踪和结果导出功能。

**步骤**:

1.  **创建文件上传页面 (`/dashboard`)**:
    *   在 `src/app/dashboard/page.tsx` 创建主页面。此页面应受 `withAuth` 保护。
    *   使用 `react-dropzone` 库结合 Shadcn UI 的样式，创建一个美观的拖拽上传区域。
    *   当用户上传文件时，调用 `/files/upload` 接口。
    *   上传后，使用 `sonner` 给出成功提示，并告知用户文件已进入后台处理。

2.  **创建文件列表与状态展示组件**:
    *   在 `dashboard` 页面下方，创建一个文件列表区域。
    *   页面加载时，调用 `/files` 接口获取用户的所有文件，并使用 Shadcn UI 的 `Table` 组件展示。
    *   表格中应包含：文件名、上传时间、处理状态 (`processing_status`)。
    *   为"处理状态"字段设置不同颜色的徽章 (Badge) 以区分：`pending` (灰色), `processing`/`classification` (蓝色), `completed` (绿色), `failed` (红色)。
    *   设置一个定时器（例如每5秒），定期重新获取文件列表，以实时更新状态。

3.  **创建文件详情与子文件状态视图 (Modal/Drawer)**:
    *   在文件列表的每一行添加一个 "查看详情" 按钮。
    *   点击按钮后，使用 Shadcn UI 的 `Dialog` (模态框) 或 `Drawer` (抽屉) 展示详情。
    *   在详情视图中，调用 `/:id/children` 接口获取该压缩包下的所有子文件列表。
    *   同样使用 `Table` 来展示子文件的状态，包括：子文件名、AI分类结果 (`file_type`)、处理进度。

4.  **实现导出功能**:
    *   在文件详情视图中，或在主文件列表的行操作中，添加一个 "导出" 按钮。
    *   该按钮应在父文件处理状态为 `completed` 时才可点击。
    *   点击后，通过 `window.location.href` 或 `axios`（需要处理blob响应）调用 `/files/:id/export` 接口。这将触发浏览器下载Excel文件。

#### **4. 内容生成功能**

**目标**: 实现一个专用的页面，用于上传特定文件并生成200字的内容。

**步骤**:

1.  **创建内容生成页面**:
    *   在 `src/app/generate-text/page.tsx` 创建新页面，同样受 `withAuth` 保护。
    *   页面标题为 "200字内容生成"。

2.  **创建专用文件上传组件**:
    *   设计一个包含两个上传区域的表单，分别标明 "上传申报书" 和 "上传简历"。
    *   用户必须同时上传这两个文件。
    *   添加一个文本输入框，让用户可以输入自定义的 Prompt，或者提供一个默认的Prompt，例如："请根据上传的申报书和简历，生成一份200字左右的个人亮点介绍。"

3.  **实现生成逻辑**:
    *   点击 "开始生成" 按钮后，调用 `/writing/generate` 接口，将两个文件和 Prompt 一同提交。
    *   接口返回 `job_id` 后，将其保存，并可以跳转到一个任务状态页面，或者在当前页面显示进度。

4.  **创建任务状态查看功能**:
    *   在 `src/app/jobs/[jobId]/page.tsx` 创建一个动态路由页面，用于展示生成任务的状态。
    *   或者，可以在 `/generate-text` 页面下方创建一个任务列表。
    *   使用定时器轮询 `/writing/jobs/:jobId/status` 接口，获取任务状态 (`pending`, `processing`, `completed`, `failed`)。
    *   当状态为 `completed` 时，获取并展示 `results` 字段中的生成内容。

---

这个开发计划涵盖了从项目设置到功能实现的所有关键步骤。您可以按照这个顺序，逐一完成各个模块的开发。在每个步骤中，我们都将遵循最佳实践，确保代码的质量和可维护性。

```shellscript
    npx create-next-app@latest go-eiie-frontend --typescript --tailwind --eslint --app
```

```shellscript
    # 进入前端目录
    cd frontend 
    
    # UI组件库
    npx shadcn-ui@latest init
    
    # 表单处理
    npm install react-hook-form zod @hookform/resolvers
    
    # API请求
    npm install axios
    
    # 状态管理与持久化 (用于JWT)
    npm install zustand zustand/middleware
    
    # 图标
    npm install lucide-react
    
    # 文件上传交互
    npm install react-dropzone
    
    # 通知/提示
    npm install sonner
```

```plaintext
        NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

---

**User**

generate接口只支持上传2个文件，不支持prompt，prompt由系统自动从数据库中获取，请修改

---

**Cursor**



好的，感谢您的指正。这是非常重要的信息，它简化了前端的实现逻辑。

根据您的最新说明（`generate` 接口只支持上传2个文件，且 `prompt` 由后端自动处理），我将更新开发文档中的 **“4. 内容生成功能”** 部分。

---

### **智能文档处理系统 - 前端开发计划 (V1.0) - 已更新**

(...前面1, 2, 3节保持不变...)

#### **4. 内容生成功能 (已根据新信息修订)**

**目标**: 实现一个专用的页面，用户上传固定的两个文件（申报书、简历）后，即可触发一个后台内容生成任务。

**步骤**:

1.  **创建内容生成页面**:
    *   在 `src/app/generate-text/page.tsx` 创建新页面，并确保它受到认证保护。
    *   页面标题可以设为“个人亮点生成”或类似的描述性名称。

2.  **创建专用文件上传组件**:
    *   设计一个简洁的表单，包含 **两个独立且必需的** 文件上传区域。
    *   明确标注每个区域需要上传的文件类型，例如：
        *   上传区域一: **“请上传申报书文件”**
        *   上传区域二: **“请上传简历文件”**
    *   **注意**: 此处不再需要为用户提供 `prompt` 输入框，因为指令将由后端系统自动处理。
    *   实现逻辑，确保用户必须同时选择了两个文件后，“开始生成”按钮才变为可点击状态。

3.  **实现生成逻辑**:
    *   当用户点击“开始生成”按钮后，前端调用 `/writing/generate` 接口。
    *   请求的 `multipart/form-data` 中 **仅包含两个文件字段**，例如 `files`（或者后端期望的特定字段名，如 `declaration` 和 `resume`，这需要与后端确认，但通常一个多文件字段即可）。
    *   接口成功返回 `job_id` 后，保存此ID，并引导用户查看任务进度。

4.  **创建任务状态查看功能**:
    *   (此部分逻辑不变)
    *   可以在 `src/app/jobs/[jobId]/page.tsx` 创建一个动态路由页面来展示特定任务的状态。
    *   或者，在 `/generate-text` 页面下方动态加载一个任务列表，展示历史生成任务。
    *   通过定时轮询 `/writing/jobs/:jobId/status` 或 `/writing/jobs` 接口，实时更新任务状态 (`pending`, `processing`, `completed`, `failed`)。
    *   当任务状态变为 `completed` 时，获取并清晰地展示 `results` 字段中的生成内容。

---

这个修订后的计划更加准确地反映了后端API的实际功能，前端的开发工作也相应地简化了。

