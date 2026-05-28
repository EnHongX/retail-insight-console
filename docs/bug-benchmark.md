# Bug Benchmark Design

## 目标

本项目用于评测多个 AI 模型修复真实业务缺陷的能力。Bug 必须满足：

- 项目可以正常启动、打开页面。
- Bug 不应是语法错误、编译错误或依赖缺失。
- Bug 集中在网页交互、前端状态、后端 API 和业务口径。
- 每个 Bug 有稳定 seed 数据、复现步骤、正确行为和验证方式。
- 每个 Bug 应能独立埋入、独立修复、独立评分。

## 评分建议

总分 10 分：

- 复现能力 2 分：能按步骤复现，并说明错误现象。
- 定位能力 2 分：能找到真实根因，不只改表象。
- 修复质量 3 分：最小改动、业务口径正确、不破坏其他功能。
- 回归测试 2 分：补充或更新有效测试。
- 工程质量 1 分：类型检查、构建、命名、可读性达标。

通用验证命令：

```bash
pnpm db:generate
pnpm test
pnpm typecheck
pnpm build
pnpm db:validate
```

`pnpm db:validate` 需要先准备 `apps/api/.env` 中的 `DATABASE_URL`。

---

## BUG-RANK-001：商品排行排序与 limit 顺序错误

**难度：P2 中等**

### 影响模块

- 后端：`GET /products/top-selling`
- 前端：商品销售排行表格

### 正常业务规则

商品排行必须先按用户选择的排序维度排序，再截取 `limit`。

- `sort=quantity`：按销量降序。
- `sort=netSales`：按销售额降序。

### 推荐埋 Bug 方式

在后端或前端制造以下错误之一：

- 后端固定按销量排序并 `limit`，忽略 `sort=netSales`。
- 后端先取销量 Top N，再由前端按销售额重排。
- 前端发送了 `sort=netSales`，但 API client 没把参数带到 `/products/top-selling`。

### 复现步骤

1. 启动 API 和 Web。
2. 打开 Dashboard。
3. 切换时间范围到 `30d`。
4. 在商品销售排行中点击 `按销售额`。
5. 对比返回结果中高销售额低销量商品是否进入榜单。

### 错误表现

榜单仍像按销量截断后的结果。高销售额但销量较低的商品可能缺失。

### 正确行为

`sort=netSales` 时，榜单应展示销售额最高的商品，且后端在 limit 前完成排序。

### 验证方式

建议增加/保留测试：

- `buildTopProducts({ sortBy: 'netSales', limit })` 应先按 `netSales` 排序。
- API 请求 `/products/top-selling?period=30d&sort=netSales&limit=5` 的结果应按 `netSales` 降序。

### 评分重点

- 是否识别 sort/limit 顺序是后端聚合问题。
- 是否避免只在前端重排已截断数据。
- 是否补测试覆盖 `quantity` 和 `netSales` 两种排序。

---

## BUG-REFUND-TIME-003：退款率使用了错误时间口径

**难度：P3 较难**

### 影响模块

- 后端：`GET /dashboard/summary`
- 后端：`GET /refunds/summary`
- 前端：KPI 退款率、退款概览

### 正常业务规则

销售指标按 `orders.placedAt` 统计。  
已完成退款金额和退款率按 `refunds.completedAt` 统计。  
未完成退款不计入已完成退款金额。

### 推荐埋 Bug 方式

制造以下错误之一：

- `getSummary()` 查询退款时使用 `requestedAt` 而不是 `completedAt`。
- `getRefundSummary()` 用 `completedAt`，但 `getSummary()` 用 `requestedAt`，导致两个区域口径不一致。
- 对 `COMPLETED` 退款没有排除 `completedAt = null` 的异常数据。

### 复现步骤

1. 使用 seed 数据。
2. 找到一笔 `requestedAt` 和 `completedAt` 不在同一天的退款。
3. 切换 `period=today` 或点击跨日附近日期。
4. 对比 KPI 退款率和退款概览的完成退款金额。

### 错误表现

同一筛选下，KPI 中的退款率/退款金额和退款概览不一致。  
或者某天包含了“当天申请但次日完成”的退款。

### 正确行为

完成退款金额只看 `COMPLETED` 且 `completedAt` 落在窗口内的退款。

### 验证方式

建议测试：

- 同一笔退款 `requestedAt=2026-05-27`、`completedAt=2026-05-28`。
- 查询 `2026-05-27` 不应计入该完成退款。
- 查询 `2026-05-28` 应计入该完成退款。

### 评分重点

- 是否阅读并遵守业务口径。
- 是否同时修复 summary 和 refund summary。
- 是否用 seed 边界数据复现，而不是凭感觉改字段。

---

## BUG-REFUND-FLOW-005：退款终态仍可被非法流转

**难度：P2-P3 中高**

### 影响模块

- 后端：`PATCH /refunds/:id/status`
- 前端：退款处理工作台按钮状态

### 正常业务规则

合法状态流转：

- `REQUESTED -> APPROVED`
- `REQUESTED -> REJECTED`
- `APPROVED -> COMPLETED`
- `APPROVED -> REJECTED`

终态：

- `REJECTED`
- `COMPLETED`

终态不可继续流转。

### 推荐埋 Bug 方式

制造以下错误之一：

- 后端 `PATCH /refunds/:id/status` 只检查目标状态合法，不检查当前状态。
- 前端禁用了非法按钮，但后端 API 仍允许非法调用。
- `REQUESTED -> COMPLETED` 被允许，跳过 `APPROVED`。
- `REJECTED -> COMPLETED` 被允许，导致退款金额进入 Dashboard。

### 复现步骤

1. 找到状态为 `REJECTED` 或 `COMPLETED` 的退款。
2. 直接调用 API：

```bash
curl -X PATCH http://localhost:7102/refunds/<id>/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"COMPLETED"}'
```

3. 刷新退款工作台和 Dashboard。

### 错误表现

非法状态被写入数据库。  
Dashboard 退款金额或退款率可能随之变化。

### 正确行为

后端返回 400。数据库状态不变。

### 验证方式

已有状态机测试应覆盖：

- `REQUESTED -> APPROVED` 允许。
- `REQUESTED -> REJECTED` 允许。
- `APPROVED -> COMPLETED` 允许。
- `REJECTED -> COMPLETED` 拒绝。
- `COMPLETED -> APPROVED` 拒绝。
- `REQUESTED -> COMPLETED` 拒绝。

### 评分重点

- 是否只修前端按钮，还是后端也防御非法请求。
- 是否保留终态不可变规则。
- 是否补充 API 或状态机测试。

---

## BUG-EMPTY-CHART-007：空数据图表显示异常

**难度：P1-P2 简单到中等**

### 影响模块

- 前端：销售趋势组合图
- 前端：商品搜索、分类筛选后的 empty state

### 正常业务规则

当筛选结果为空或趋势全 0 时：

- 页面不能出现 `NaN`、`Infinity`。
- 图表不能布局错乱。
- 应展示明确空状态。
- KPI 应显示 0 或空状态，而不是旧数据。

### 推荐埋 Bug 方式

制造以下错误之一：

- 折线图在 `maxOrders = 0` 时直接计算 `point.orderCount / maxOrders`。
- 柱状图在 `maxGmv = 0` 时仍计算百分比。
- 商品搜索无结果时仍保留旧榜单。
- 空趋势数组时仍渲染 polyline，导致 SVG 坐标异常。

### 复现步骤

1. 打开 Dashboard。
2. 在商品搜索输入一个不存在的 SKU，例如 `NO-SUCH-SKU-999`。
3. 观察 KPI、趋势图、商品排行、订单明细。

### 错误表现

可能出现：

- `NaN%`
- `Infinity`
- 折线飞出图表
- 柱状图异常高度
- 商品排行仍显示旧结果
- 页面没有空状态提示

### 正确行为

空数据应稳定显示：

- KPI 为 0。
- 趋势图显示空状态或全 0 安全图。
- 商品排行显示“暂无商品排行数据”。
- 订单明细显示“暂无订单明细”。

### 验证方式

建议测试：

- `getTrendHeight(0, 0)` 返回 0。
- 空数据或全 0 趋势不会生成 `NaN` 坐标。
- 搜索不存在商品后，页面不显示旧商品排行。

### 评分重点

- 是否处理根因，而不是隐藏报错。
- 是否同时处理 KPI、图表、表格和明细。
- 是否避免旧请求/旧状态残留。

---

## 推荐执行方式

每个 Bug 单独创建一个分支：

```text
bug/rank-limit-order
bug/refund-time-basis
bug/refund-terminal-transition
bug/empty-chart-state
```

每个分支只埋一个 Bug，并保留项目可启动、可打开。  
给模型修复时，只提供对应 Bug 的复现步骤，不提供隐藏根因。

