# FetchXML Builder Web — 完整技术栈 & 任务清单

---

## 一、技术栈清单

### 前端 (Phase 1 - 当前)

| 分类 | 技术 | 版本 | 用途 |
|---|---|---|---|
| **运行时** | Node.js | 24.x LTS | 开发环境 |
| **包管理** | pnpm | 10.x | 依赖管理、monorepo |
| **框架** | React | 19.x | UI 框架 |
| **语言** | TypeScript | 5.9.x | 类型安全 |
| **构建** | Vite | 8.x | 构建工具、HMR |
| **UI 组件库** | Ant Design | 6.x | 通用组件 |
| **样式** | Tailwind CSS | 4.x | 原子化 CSS |
| **状态管理** | Zustand | 5.x | 全局状态 |
| **国际化** | react-i18next + i18next | 17/26.x | 多语言 (zh/en) |
| **语言检测** | i18next-browser-languagedetector | 8.x | 自动检测浏览器语言 |
| **XML 处理** | fast-xml-parser | 5.x | XML ↔ AST 转换 |
| **代码编辑器** | @monaco-editor/react | 4.x | XML/代码编辑 |
| **认证 (占位)** | @azure/msal-browser + msal-react | 5.x | OAuth2/AAD (Phase 2 启用) |
| **测试框架** | Vitest | 4.x | 单元/集成测试 |
| **测试工具** | @testing-library/react | 16.x | 组件测试 |
| **测试环境** | jsdom | 29.x | DOM 模拟 |

### 后端 (Phase 2 - 待实现)

| 分类 | 技术 | 版本 | 用途 |
|---|---|---|---|
| **框架** | ASP.NET Core Web API | 9.0 | REST API 主框架 |
| **语言** | C# | 13 | 后端语言 |
| **ORM/SDK** | Microsoft.PowerPlatform.Dataverse.Client | 最新 | Dataverse 连接 |
| **认证** | Microsoft.Identity.Web | 3.x | AAD / MSAL 服务端 |
| **API 文档** | Swashbuckle (Swagger/OpenAPI 3.1) | 7.x | 接口文档 |
| **缓存** | IMemoryCache + StackExchange.Redis | — | 元数据缓存 |
| **日志** | Serilog | 4.x | 结构化日志 |
| **健康检查** | ASP.NET Core HealthChecks | — | 服务监控 |
| **容器化** | Docker + docker-compose | — | 本地 & 生产部署 |

### 部署 & DevOps

| 分类 | 技术 | 用途 |
|---|---|---|
| **CI/CD** | GitHub Actions | 自动化测试、构建、部署 |
| **前端托管** | Azure Static Web Apps | 前端静态部署 |
| **后端托管** | Azure App Service / Container Apps | API 部署 |
| **认证代理** | Azure Static Web Apps built-in auth | 简化 AAD 集成 |
| **CDN** | Azure CDN / Cloudflare | 静态资源加速 |

---

## 二、项目目录结构

```
FetchXMLBuilder/
├── web/                          # 前端 React 应用 (Phase 1)
│   ├── src/
│   │   ├── core/
│   │   │   ├── ast/              # FetchXML AST 类型 & 操作
│   │   │   ├── parser/           # XML ↔ AST 双向转换
│   │   │   ├── validator/        # 验证规则 (移植自 Validations.cs)
│   │   │   └── codegen/          # 代码生成器 (FetchXML/OData/C#/JS/SQL)
│   │   ├── components/
│   │   │   ├── Layout/           # AppShell, Header, Sidebar
│   │   │   ├── TreeBuilder/      # FetchXML 可视化树
│   │   │   ├── NodeForms/        # 各节点属性表单
│   │   │   ├── XmlEditor/        # Monaco XML 编辑器
│   │   │   ├── CodeOutput/       # 代码生成输出
│   │   │   ├── ResultGrid/       # 查询结果网格
│   │   │   └── common/           # 共享组件
│   │   ├── services/
│   │   │   ├── mock/             # Mock 数据 (Phase 1)
│   │   │   ├── dataverse/        # Dataverse Web API 调用 (Phase 2)
│   │   │   ├── metadata/         # 元数据缓存服务
│   │   │   └── auth/             # MSAL 认证服务
│   │   ├── store/                # Zustand stores
│   │   ├── i18n/                 # 国际化 (zh/en)
│   │   │   └── locales/
│   │   ├── hooks/                # 自定义 React hooks
│   │   ├── test/                 # 测试工具 & setup
│   │   └── App.tsx
│   ├── vite.config.ts
│   ├── package.json
│   └── pnpm-lock.yaml
│
├── api/                          # 后端 ASP.NET Core Web API (Phase 2)
│   ├── FetchXmlBuilder.Api/
│   │   ├── Controllers/
│   │   │   ├── MetadataController.cs
│   │   │   ├── QueryController.cs
│   │   │   └── AuthController.cs
│   │   ├── Services/
│   │   │   ├── DataverseService.cs
│   │   │   ├── MetadataCacheService.cs
│   │   │   └── FetchXmlExecutor.cs
│   │   ├── Models/
│   │   └── Program.cs
│   └── FetchXmlBuilder.Api.Tests/
│
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml       # 前端 lint + test + build
│       └── backend-ci.yml        # 后端 build + test (Phase 2)
└── PLAN.md                       # 本文档
```

---

## 三、任务清单

### Phase 1 — 前端 (当前)

#### 1.1 基础架构 ✅
- [x] Vite 8 + React 19 + TypeScript 5.9 脚手架
- [x] pnpm 10 包管理
- [x] Tailwind CSS 4 + Ant Design 6
- [x] 路径别名 `@/` → `src/`
- [x] Vitest + jsdom + Testing Library 测试环境

#### 1.2 核心引擎 ✅
- [x] FetchXML AST 类型系统 (`core/ast/types.ts`)
- [x] AST 操作 (create/update/delete/move/clone) (`core/ast/operations.ts`)
- [x] 节点能力约束 (移植自 FetchNodeCapabilities.cs) (`core/ast/capabilities.ts`)
- [x] XML ↔ AST 双向转换 (`core/parser/xmlParser.ts`)
- [x] 验证规则 (移植自 Validations.cs) (`core/validator/validator.ts`)
- [x] 代码生成器: FetchXML / OData / C# / JavaScript / Power Fx / SQL (`core/codegen/generators.ts`)

#### 1.3 国际化 ✅
- [x] i18next + react-i18next 初始化
- [x] 中文 (zh) 翻译
- [x] 英文 (en) 翻译
- [x] 浏览器语言自动检测

#### 1.4 状态管理 ✅
- [x] Zustand 5 store (AST / UI / 历史 / 设置)
- [x] 持久化 (localStorage)

#### 1.5 Mock 数据服务 ✅
- [x] Mock 实体列表 (account, contact, opportunity 等 10+ 实体)
- [x] Mock 属性列表 (每个实体 15+ 属性)
- [x] Mock 关系列表
- [x] Mock 查询结果 (分页数据)
- [x] Mock 认证状态

#### 1.6 UI 组件 ✅
- [x] **AppShell**: 3 列布局 (树 260px | 主内容 flex | XML 面板 360px)
- [x] **Header**: Logo + 导航 Tab + 语言切换 + 主题切换 + 认证状态
- [x] **TreeBuilder**: 节点树、右键菜单 (添加/删除/移动/复制/注释)
- [x] **NodeForm/FetchForm**: version/top/count/distinct/aggregate/datasource
- [x] **NodeForm/EntityForm**: 实体名称下拉 (元数据驱动)
- [x] **NodeForm/LinkEntityForm**: name/from/to/alias/link-type/intersect
- [x] **NodeForm/AttributeForm**: name/alias/aggregate/groupby/dategrouping
- [x] **NodeForm/FilterForm**: type (and/or)
- [x] **NodeForm/ConditionForm**: attribute/operator/value/entityname
- [x] **NodeForm/OrderForm**: attribute/alias/descending
- [x] **NodeForm/ValueForm**: text 值输入
- [x] **NodeForm/CommentForm**: 注释文本编辑
- [x] **XmlEditor**: Monaco 编辑器双向同步
- [x] **CodeOutput**: 6 语言标签页 + 复制按钮
- [x] **ResultGrid**: AntD Table + 分页 + CSV/JSON 导出
- [x] **HistoryPanel**: 历史列表 + 恢复 + 清空
- [x] **SettingsPanel**: 主题/语言/显示选项 + Mock/Real API 开关
- [x] **ValidationBadge**: 节点错误/警告徽章

#### 1.7 功能串联 ✅
- [x] 树 ↔ XML 编辑器双向同步
- [x] 节点选中 → 属性面板联动
- [x] 元数据驱动下拉 (基于 Mock 数据)
- [x] 执行查询 (Mock 结果 / 真实 API)
- [x] 历史自动保存

#### 1.8 测试 ✅
- [x] AST 操作单元测试
- [x] XML 解析/序列化单元测试
- [x] 验证规则单元测试
- [x] 代码生成器单元测试

#### 1.9 CI ✅
- [x] GitHub Actions: lint + typecheck + test + build

---

### Phase 2 — 后端 ASP.NET Core Web API (待做)

- [x] `dotnet new webapi` 创建 `api/FetchXmlBuilder.Api` 项目
- [x] `MetadataController` → 返回 Dataverse 实体/属性/关系列表
- [x] `QueryController` → 执行 FetchXML 查询并返回分页结果
- [x] `AuthController` → ADFS token 验证 / BEContext 前端使用
- [x] `DataverseService` → 封装 Dataverse SDK 调用 (DataverseSdkService)
- [x] `MetadataCacheService` → IMemoryCache (TTL 1h) 内置于 DataverseWebApiService
- [x] Swagger/OpenAPI 文档
- [x] CORS 配置 (允许前端开发域)
- [x] ADFS OAuth2 认证 (client_credentials + ROPC，无 MSAL/AAD 依赖)
- [x] 前端切换为真实 API 调用 (Settings → "Use Mock Data" 开关)
- [x] 前端 Phase 2 API 服务层 (`services/auth/`, `services/dataverse/`, `services/metadata/`)
- [x] Docker & docker-compose 配置
- [x] 后端测试项目 (`api/FetchXmlBuilder.Api.Tests/`, 13 个测试全部通过)
- [x] 后端 CI: build + test + publish (`.github/workflows/backend-ci.yml`)

---

### Phase 3 — 高级功能 (规划中)

- [ ] AI 辅助 (Azure OpenAI → 自然语言转 FetchXML)
- [ ] URL 分享 (Base64 序列化查询)
- [ ] 暗色主题完善
- [ ] 拖拽排序节点
- [ ] 键盘快捷键
- [ ] PWA 支持
- [ ] 自定义域名 + Azure Static Web Apps 部署
