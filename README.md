# retail-insight-console

电商运营数据后台工程骨架。当前阶段包含前端、后端、PostgreSQL 连接基础设施，以及第一版商品、订单、订单明细、退款数据模型。

## 技术栈

- 前端：React + Vite + TypeScript，开发端口 `7100`
- 后端：NestJS + TypeScript，开发端口 `7102`
- 数据库访问：PostgreSQL + Prisma
- 工作区：pnpm workspace

## 目录

```text
apps/
  api/    NestJS 服务与 Prisma 配置
  web/    React 空应用入口
```

## 本地启动

准备 Node.js `>=20.19.0` 与 pnpm，然后安装依赖：

```bash
pnpm install
```

本项目不提供 Docker 配置。请使用本机或可访问的 PostgreSQL 实例，创建数据库后配置 API 环境变量：

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm db:generate
pnpm db:validate
```

应用数据库迁移并写入样例数据：

```bash
pnpm --filter @retail-insight/api prisma migrate dev
pnpm db:seed
```

启动前后端：

```bash
pnpm dev:api
pnpm dev:web
```

API 健康检查地址为 `http://localhost:7102/health`。由于后端在启动时验证数据库连接，数据库不可达时 API 会直接启动失败。

## 业务口径

第一版运营指标口径见 `docs/product/metrics.md`。当前锁定的最小指标包括 GMV、订单数、退款率、客单价和商品销售排行。

## 数据模型

当前 Prisma 模型包含：

- `Product`：商品 SKU、分类、品牌、价格、成本、状态。
- `Order`：订单号、平台、下单时间、订单状态、成交金额、优惠金额、净销售额。
- `OrderItem`：订单商品明细，记录数量、单价、优惠、行金额。
- `Refund`：退款单，关联订单/明细/商品，记录原因、状态、申请时间、完成时间和金额。

## API

第一版 Dashboard API：

- `GET /dashboard/summary?period=7d`
- `GET /dashboard/sales-trend?period=7d`
- `GET /products/top-selling?period=7d&limit=5`
- `GET /refunds/summary?period=7d`

`period` 支持 `today`、`7d`、`30d`，无效值默认按 `7d` 处理。

## 校验

```bash
pnpm typecheck
pnpm build
pnpm test
pnpm validate:domain
```

`.gitignore` 已屏蔽 `node_modules/`、所有 `.env` 及常见构建输出；仅 `.env.example` 会被提交作为配置模板。
