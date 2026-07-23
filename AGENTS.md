# AGENTS.md — China Survival Game

给后续 AI / 协作者的项目总览。改剧情优先改 Content；改规则优先改 Engine；少动 Views。

## 项目是什么

**China Survival**：网页单机（Vue 3 + Vite + Tailwind 4）叙事生存游戏。玩家以外籍旅客身份入境中国，在有限的 **money / sanity / time / battery / locality** 下做分支决策，目标通常是抵达香港离境；也可因资源归零触发坏结局。

仓库：`maggiecycy/china-survival-game`（`main`）。  
本地：`npm run dev` / `npm run build`（静态部署即可，尚无后端）。

## 架构（必须遵守）

```
Content（剧情 JSON） → Engine（纯 JS 规则） → Store（编排） → Views（UI）
```

| 层 | 路径 | 职责 |
|----|------|------|
| Content | `src/content/` | 签证、教程、城市、景点列表、事件图、交通、结局、gameConfig |
| Engine | `src/engine/` | 条件、效果、事件图、交通花费、住宿日结、结局判定 |
| Store | `src/stores/useGameStore.js` | 单例状态 + 流程（勿在 View 里写玩法） |
| Views | `src/views/` | 按 `currentStep` 拆屏 |
| Components | `src/components/` | ChinaMap、AttractionMap、HUD、Debug 等 |

**加剧情 = 加/改 JSON**，尽量不改 `App.vue`。  
`activeEffects` / `flags` 驱动 `requires` / `blocks_if`；城市只是容器，真正玩的是 **event graph**。

## 主流程（currentStep）

```
visa-selection → arrival-loading → tutorial
  → city-map（城市景点地图）↔ city-event（景点/住宿/交通事件）
  → map-planning（中国地图）→ travel-mode →（首次离京 transit 一次）
  → city-map … → ending
```

关键状态字段：`playerState`（含 `lodging`）、`visitedCities`、`visitedAttractionKeys`、`activeEnding`。

## 核心系统速查

### Tutorial（北京新手）

- 数据：`src/content/tutorial.json`（约 6 关：SIM → 支付 → 机场进城 → 拒收酒店 → 换宿 → 第一天去哪）
- 教程选的酒店写入 `lodging`；沙发客教程当晚已用完 → 进地图前常需再安排住宿
- 教程第 6 关选中的景点会预点亮（flag → attraction 映射在 `engine/attractions.js`）

### 城市景点地图

- 列表：`src/content/attractions/{cityId}.json`
- 每个景点一个独立事件图：`graphId` → `src/content/events/*.json`
- 完成景点 = **1 天**：扣 `gameConfig.day.hours`（默认 24h）+ 当晚房费
- 当天电量仍 > 0：过夜 **+overnightBatteryRestore（默认 50）**
- 城市地图可扫 **共享充电宝**（需 `foreign_card_linked`，现金路线不可用）

### 住宿 Lodging

- 配置：`gameConfig.lodgingTypes`
- 闸门事件：`events/lodging_resolve.json`
- **不要重播教程酒店关卡**；用短 lodging 事件复用规则
- 沙发 = 临时；换城不带走沙发

### 城际交通

- `content/travel.json` + `engine/travel.js`
- 高铁/飞机/大巴/硬卧，按目的地 tier 扣钱/时/sanity/battery
- **仅首次离京**触发 `transit_first_departure`（flag: `first_intercity_survived`）

### 结局

- `content/endings.json` + `engine/ending.js`
- 坏：sanity≤0 / time≤0 / battery≤0
- 好：香港离境；locality≥80 → 中国通

### 赚钱 / Tutorial flags（示例）

常用 flag：`has_local_number` | `roaming_only` | `foreign_card_linked` | `cash_only` | 住宿相关 | `did_photo_hustle` | `did_english_tip` | `did_model_gig`  
景点内带 💰 的 choice 为赚钱支线（合照收费、英语小费、模特日结等）。

起步资金约 **2800**（`player.js` / `visas.json`）。

## 目录约定（加内容时）

1. 新城市景点：`attractions/{id}.json` + 在 `attractions/index.js` 注册  
2. 新景点事件：`events/{graphId}.json` + 在 `events/index.js` 注册  
3. choice 字段：`effect`（带正负号）、`requires` / `blocks_if` / `showIfLocked`、`addFlags`、`lodgingType`、`feedback`、`next`  
4. 无 attractions 配置的城市会 fallback 成单一「市区」针脚（graphId = cityId）

## 明确不要做的事

- 不要把玩法逻辑堆回 `App.vue`
- 不要为改一句文案去改 Engine
- 不要引入后端/数据库，除非产品明确要上线账号/排行榜（当前静态站即可）
- 不要重写已通的 tutorial 酒店流程来解决「沙发后还要住房」——用 lodging 系统

## 建议的下一步（优先级）

1. 为重庆/桂林/南京/海南等补全 `attractions/*.json` + 独立景点事件（去掉仅靠 legacy hub）  
2. 打磨数值：夜租 vs 赚钱支线 vs 充电宝的经济平衡  
3. 欢迎页/语言选择；UI 去 emoji 依赖、统一视觉  
4. 存档（localStorage）+ `saveVersion`  
5. 需要「大家一起玩」时再上 Supabase 排行榜/云存档（先别上实时联机）

## 调试

游戏下方有 Debug Panel：阶段、签证、资源、flags、已点亮景点、住宿类型。  
改 JSON 后热更新即可验证；提交前跑 `npm run build`。

## 沟通语言

用户默认希望用 **简体中文** 回复；技术专有名词可保留英文。
