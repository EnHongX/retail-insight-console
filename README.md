# retail-insight-console

电商运营数据后台工程骨架。当前阶段只包含前端、后端与 PostgreSQL 连接基础设施，不包含 Dashboard、订单、商品或退款业务实现。

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

启动前后端：

```bash
pnpm dev:api
pnpm dev:web
```

API 健康检查地址为 `http://localhost:7102/health`。由于后端在启动时验证数据库连接，数据库不可达时 API 会直接启动失败。

## 校验

```bash
pnpm typecheck
pnpm build
```

`.gitignore` 已屏蔽 `node_modules/`、所有 `.env` 及常见构建输出；仅 `.env.example` 会被提交作为配置模板。
