# 后端 API 设计

当前后端 MVP 使用 Node.js 原生 HTTP 服务实现，不依赖外部包。数据暂存为 `backend/data/db.json`，接口形状按后续数据库版设计。

## 启动

```bash
npm start
```

默认访问：

```text
http://localhost:5173
```

## 通用接口

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api` | 查看 API 状态和资源清单 |
| GET | `/api/state` | 获取完整业务数据 |
| PUT | `/api/state` | 覆盖保存完整业务数据 |
| GET | `/api/settings` | 获取系统字典 |
| PUT | `/api/settings` | 更新系统字典 |
| GET | `/api/inventory` | 获取全部库存汇总 |
| GET | `/api/inventory?projectId={id}` | 获取某个项目库存汇总 |
| GET | `/api/projects/{id}/dashboard` | 获取某个项目统计概览 |

## 业务对象接口

以下资源都支持统一 CRUD：

- `projects`：项目
- `tasks`：项目任务
- `materials`：项目 BOM 项
- `purchases`：采购记录
- `purchaseItems`：采购明细
- `receipts`：入库记录
- `outbounds`：出库记录

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/{resource}` | 列表 |
| GET | `/api/{resource}/{id}` | 详情 |
| POST | `/api/{resource}` | 新增 |
| PUT | `/api/{resource}/{id}` | 更新 |
| DELETE | `/api/{resource}/{id}` | 删除 |

删除项目、BOM 项、采购记录、采购明细时，后端会级联清理关联任务、采购明细、入库记录、出库记录，避免留下孤立数据。

## 后端校验

当前后端 MVP 已包含基础校验：

- 必填字段校验
- 项目、采购记录、BOM 项、采购明细等关联对象存在性校验
- 出库数量不能超过当前库存
- 不存在的数据更新或删除会返回 `404`

## 关键业务关系

- 出入库记录不直接挂在物料名称上，而是挂在采购明细 `purchaseItemId` 上。
- 采购明细再关联采购记录 `purchaseId`。
- 采购记录关联项目 `projectId`。
- 采购明细可选关联项目 BOM 项 `materialId`。

这样同一个物料出现在多个项目时，不同项目的库存不会串账。
