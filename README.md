# 道路微病害主动养护平台

> 非机动车道微病害众包感知、风险评估与主动养护平台

面向路政、校园后勤与道路养护部门的 **非机动车道微病害管理平台**，覆盖「众包感知 → 风险评估 → 精准巡检 → 闭环维修」全流程。前端纯演示项目，业务数据由本地 Mock 数据驱动，不依赖真实后端服务。

## 项目简介

平台围绕「骑行众包感知」构建主动养护闭环：

- 接入智能手机 / 车载传感器采集的骑行轨迹（CSV / GeoJSON / JSON），解析三轴加速度并提取颠簸冲击事件；
- 通过 **五维风险评估模型**（危害程度、暴露程度、场景脆弱性、变化趋势、后果严重性）对候选病害自动打分定级；
- 结合「固定设施硬负样本」与「风险场景缓冲区」过滤误报，生成病害台账；
- 派发巡检任务进行现场核验，确认后生成维修工单，维修完成复核通过后闭环销项；
- 以 GIS 一张图（Leaflet）+ ECharts 图表提供全局总览与轨迹 / 波形溯源。

试点区域：**闵行区·永德路地铁站周边试点区（1.8km²）**。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | [Vue 3](https://vuejs.org/)（Composition API + `<script setup>`） |
| 构建工具 | [Vite 6](https://vitejs.dev/) |
| 语言 | TypeScript |
| 状态管理 | [Pinia](https://pinia.vuejs.org/) |
| 路由 | [Vue Router 4](https://router.vuejs.org/) |
| UI 组件库 | [Element Plus](https://element-plus.org/) + [Tailwind CSS 4](https://tailwindcss.com/) |
| 可视化 | [ECharts 6](https://echarts.apache.org/) |
| 地图 | [Leaflet 1.9](https://leafletjs.com/) |
| 工具库 | [dayjs](https://dayjs.dev/) |

> 说明：`@google/genai`、`express`、`dotenv`、`tsx` 等依赖已随工程预装，供后续接入 Gemini API 或服务端能力使用（见 `metadata.json` 声明的 `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`），当前前端代码尚未调用。

## 快速开始

```bash
# 安装依赖（支持 npm / bun）
npm install

# 启动开发服务器（默认 http://localhost:3000）
npm run dev

# 生产构建
npm run build

# 本地预览构建产物
npm run preview

# 类型检查
npm run lint   # 即 tsc --noEmit
```

## 目录结构

```
front_demo/
├── index.html                # 入口 HTML（含 Leaflet CDN 样式）
├── vite.config.ts            # Vite 配置（@ 别名、Tailwind、HMR 开关）
├── tsconfig.json
├── metadata.json             # Google AI Studio 应用元数据
├── .env.example              # 环境变量模板（GEMINI_API_KEY / APP_URL）
└── src/
    ├── main.ts               # 应用入口（Pinia / Router / Element Plus）
    ├── App.vue
    ├── env.d.ts
    ├── index.css             # 全局样式（Tailwind）
    ├── types/index.ts        # 领域模型类型定义
    ├── mock/seedData.ts      # 全量 Mock 业务数据
    ├── stores/appStore.ts    # Pinia 全局状态与业务逻辑
    ├── router/index.ts       # 路由表（含页面标题）
    ├── components/           # 通用组件
    │   ├── AppLayout.vue     # 主框架（侧边栏 / 顶栏 / 通知）
    │   ├── GisMap.vue        # Leaflet 地图（多层叠加与图层控制）
    │   ├── EChartsWrapper.vue# ECharts 封装
    │   ├── ConfidenceCard.vue  # 置信度卡片
    │   ├── DamageDrawer.vue    # 病害详情抽屉
    │   ├── RiskFormulaBar.vue  # 风险评估公式展示
    │   ├── RiskScoreRadar.vue  # 风险五维雷达图
    │   └── StatusTag.vue       # 状态标签
    └── views/                # 页面视图
        ├── LoginView.vue
        ├── DashboardView.vue          # 综合看板
        ├── GisMasterMapView.vue       # 地图看板
        ├── DamageListView.vue         # 病害台账
        ├── DamageDetailView.vue       # 病害详情
        ├── DataImportView.vue         # 数据导入
        ├── TrackDetailView.vue        # 轨迹回放
        ├── InspectionCenterView.vue   # 巡检核验
        ├── WorkOrderCenterView.vue    # 维修工单
        ├── SpatialAssetView.vue       # 空间资产
        ├── ReportCenterView.vue       # 统计报表
        └── SystemSettingView.vue      # 系统设置
```

## 功能模块

| 菜单 | 路由 | 说明 |
| --- | --- | --- |
| 综合看板 | `/dashboard` | 里程 / 轨迹 / 病害等核心指标，风险、类型、状态分布与高风险 TOP10 |
| 地图看板 | `/gis-map` | Leaflet 一张图，叠加路网、病害、固定设施、风险场景、轨迹图层 |
| 病害台账 | `/damages` | 微病害资产台账，支持筛选、风险五维因子与置信度查看 |
| 数据导入 | `/import` | 传感器轨迹文件上传、质量校验、冲击事件提取与候选病害聚合 |
| 轨迹回放 | `/tracks` | 轨迹地图回放 + 三轴加速度波形，冲击事件溯源 |
| 巡检核验 | `/inspections` | 巡检任务派发、现场核验（确认病害 / 固定设施 / 误报） |
| 维修工单 | `/work-orders` | 工单派工、完工上报、复核销项 |
| 空间资产 | `/spatial-assets` | 路网、固定设施、风险场景图层与底座资产维护 |
| 统计报表 | `/reports` | 养护成效评估与多维统计分析 |
| 系统设置 | `/settings` | 风险权重与阈值、置信度阈值、冲击阈值等运行参数 |

## 领域模型与业务规则

所有类型定义见 [src/types/index.ts](src/types/index.ts)，Mock 数据见 [src/mock/seedData.ts](src/mock/seedData.ts)，核心业务逻辑集中在 [src/stores/appStore.ts](src/stores/appStore.ts)。

- **道路 RoadItem**：非机动车道线要素（长度、面层类型、单双向、几何轨迹）。
- **固定设施 FacilityItem**：井盖 / 雨水篦子 / 减速带等「硬负样本」，用于过滤冲击误报。
- **风险场景 RiskScenarioItem**：学校 / 地铁口 / 公交站等，按 `risk_weight`（10–40）与缓冲区（`buffer_m`）放大周边病害风险。
- **冲击事件 ImpactEventItem**：骑行三轴加速度中的颠簸冲击，含垂向峰值（`peak_acc`）、RMS、事件分类与置信概率。
- **骑行轨迹 RideTrackItem**：一次众包骑行记录（里程、时长、事件数、轨迹坐标、原始采样）。
- **病害 DamageItem**：平台核心资产，包含 `risk_score`（0–100）、`risk_level`（高/中/低）、`confidence` 及置信度因子。

### 风险评估公式

```text
风险分 = 危害程度 × 0.30
       + 暴露程度 × 0.20
       + 场景脆弱性 × 0.20
       + 变化趋势 × 0.15
       + 后果严重性 × 0.15
```

风险等级阈值（可在「系统设置」调整）：`≥70 高风险`、`≥40 中风险`、否则 `低风险`。

### 置信度因子

采样次数、异常占比、多设备 / 多日期样本、是否含照片、是否经现场核验（`inspection_verified`）。巡检核验通过后置信度自动提升。

### 业务状态流转

```text
感知导入 → 冲击事件 → 病害台账(待确认)
   → 巡检核验(确认/误报/固定设施) → 已确认
   → 创建维修工单(待派工→已派工→处理中→待复核)
   → 复核通过 → 病害销项(闭环)  |  复核驳回 → 退回待维修
```

### 角色

平台预置三种可切换角色（顶栏右上角可直接切换，亦可在登录页输入账号）：

- 管理人员（`admin`）
- 巡检班组（`inspector1`）
- 维修班组（`repair1`）

## 常见问题

- **地图瓦片**：Leaflet 样式通过 `index.html` 中的 unpkg CDN 引入，离线或内网环境需自行替换为内网资源。
- **数据来源**：全部为前端 Mock 数据，刷新页面后恢复初始状态；「数据导入」页的解析与事件提取在当前版本为演示逻辑，不涉及真实后端持久化。
- **环境变量**：`.env.example` 中的 `GEMINI_API_KEY`、`APP_URL` 为 Google AI Studio 部署预留，本地运行不依赖。

## License

本项目为演示用途，未指定开源许可证。
