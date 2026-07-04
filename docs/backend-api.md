# 后端 API 设计

当前后端 MVP 使用 Node.js 原生 HTTP 服务实现，不依赖外部包。数据暂存为 `backend/data/db.json`，接口形状按后续数据库版设计。写入时使用临时文件替换，避免保存过程中损坏数据文件。

## 启动

```bash
npm start
```

默认访问：

```text
http://localhost:5173
```

## 测试

```bash
npm test
```

当前测试覆盖：

- 资源 CRUD
- 项目级联删除
- 入库数量不能超过采购数量
- 出库数量不能超过当前库存
- 系统仪表盘接口
- 查询参数校验
- `PUT /api/state` 关闭时返回 `403`

## 环境变量

| 变量 | 默认值 | 用途 |
|---|---|---|
| `PORT` | `5173` | 服务端口 |
| `DATA_DIR` | `backend/data` | 数据文件目录 |
| `BACKUP_DIR` | `DATA_DIR/backups` | 数据备份目录 |
| `BACKUP_ON_WRITE` | `true` | 设为 `false` 可关闭写入前备份 |
| `MAX_BACKUPS` | `30` | 最多保留备份数量 |
| `ALLOW_STATE_WRITE` | `true` | 设为 `false` 可关闭 `PUT /api/state` 完整覆盖保存 |

## 错误响应格式

后端统一返回结构：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "当前可出库库存为 1"
  }
}
```

常见错误码：

| 错误码 | 含义 |
|---|---|
| `BAD_REQUEST` | 请求格式或参数错误 |
| `INVALID_QUERY` | 查询参数非法 |
| `VALIDATION_ERROR` | 业务数据校验失败 |
| `STATE_WRITE_DISABLED` | 完整状态覆盖保存已关闭 |
| `FORBIDDEN` | 禁止访问 |
| `NOT_FOUND` | 资源不存在 |
| `METHOD_NOT_ALLOWED` | HTTP 方法不支持 |
| `SERVER_ERROR` | 服务端异常 |

## 通用接口

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api` | 查看 API 状态和资源清单 |
| GET | `/api/state` | 获取完整业务数据 |
| PUT | `/api/state` | 覆盖保存完整业务数据 |
| GET | `/api/settings` | 获取系统字典 |
| PUT | `/api/settings` | 更新系统字典 |
| GET | `/api/dashboard` | 获取系统首页统计仪表盘 |
| GET | `/api/dashboard?asOf=YYYY-MM-DD` | 按指定日期计算系统首页统计 |
| GET | `/api/inventory` | 获取全部库存汇总 |
| GET | `/api/inventory?projectId={id}` | 获取某个项目库存汇总 |
| GET | `/api/projects/{id}/dashboard` | 获取某个项目统计概览 |
| GET | `/api/projects/{id}/detail` | 获取项目详情聚合数据，含任务、BOM、采购、入库、出库 |

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

列表接口支持常用查询参数：

| 参数 | 用途 |
|---|---|
| `projectId` | 按所属项目筛选，支持采购明细、入库、出库按项目反查 |
| `purchaseId` | 按采购记录筛选 |
| `materialId` | 按 BOM 项筛选 |
| `purchaseItemId` | 按采购明细筛选 |
| `status` | 按状态筛选 |
| `supplier` | 按供应商筛选 |
| `type` | 按类型筛选 |
| `q` | 全字段模糊搜索 |
| `sort` | 排序字段，前缀 `-` 表示倒序，例如 `sort=-expectedDelivery` |
| `limit` | 限制返回条数 |

非法查询参数会返回 `400 INVALID_QUERY`。例如：

- `limit` 必须是 `1` 到 `500` 的整数。
- `sort` 只能使用当前资源支持的字段。
- `asOf` 必须是合法日期。

删除项目、BOM 项、采购记录、采购明细时，后端会级联清理关联任务、采购明细、入库记录、出库记录，避免留下孤立数据。

## 后端校验

当前后端 MVP 已包含基础校验：

- 必填字段校验
- 项目、采购记录、BOM 项、采购明细等关联对象存在性校验
- 数量、金额字段必须是非负数字
- 任务计划日期、实际日期不能倒挂
- 入库数量不能超过采购明细数量
- 出库数量不能超过当前库存
- 入库状态只保留 `部分入库`、`已入库`
- 出库状态只保留 `部分出库`、`已出库`
- `PUT /api/state` 覆盖保存完整数据时也会执行同一套关联和数量校验
- 当 `ALLOW_STATE_WRITE=false` 时，`PUT /api/state` 返回 `403 STATE_WRITE_DISABLED`
- 不存在的数据更新或删除会返回 `404`

## 关键业务关系

- 出入库记录不直接挂在物料名称上，而是挂在采购明细 `purchaseItemId` 上。
- 采购明细再关联采购记录 `purchaseId`。
- 采购记录关联项目 `projectId`。
- 采购明细可选关联项目 BOM 项 `materialId`。

这样同一个物料出现在多个项目时，不同项目的库存不会串账。
