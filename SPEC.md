# AdWiz — Facebook Ad Campaign Shopify App

## 概述

商家在 Shopify 后台提交商品的链接 + 广告诉求 → 系统收集到数据库 → 后续由人工/系统制作 Facebook 广告视频 → 视频制作完成后，通过 App 通知商家并展示。

## 核心页面

| 路由 | 功能 |
|------|------|
| `/app` | 主框架，包含 NavMenu |
| `/app/campaigns` | 广告活动列表（主页） |
| `/app/campaigns/new` | 新建广告活动 |
| `/app/campaigns/:id` | 活动详情，含视频展示 |
| `/app/notifications` | 通知中心（视频完成提醒） |

## 数据模型

### Campaign（广告活动）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | PK，cuid |
| shop | String | 商家域名 |
| productId | String | Shopify 商品 ID |
| productTitle | String | 商品标题 |
| productImage | String? | 商品图片 URL |
| productUrl | String? | 商品原始链接 |
| targetAudience | String? | 目标受众描述 |
| sellingPoints | String | 核心卖点（逗号分隔） |
| dailyBudget | Float | 日预算，美元 |
| adStyle | String | 广告风格 |
| competitorRef | String? | 竞品参考链接 |
| status | String | pending/generating/ready/active/paused/killed |
| videoUrl | String? | 生成的视频 URL（生成完成后填充） |
| thumbnailUrl | String? | 视频封面图 URL |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### Notification（通知）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | String | PK，cuid |
| shop | String | 商家域名 |
| campaignId | String | 关联活动 ID |
| type | String | video_ready / campaign_created / error |
| title | String | 通知标题 |
| body | String? | 通知正文 |
| read | Boolean | 是否已读，默认 false |
| createdAt | DateTime | 创建时间 |

## 广告风格（AD_STYLES）

```
professional  - 专业展示
viral_funny  - 搞笑病毒
emotional    - 情感共鸣
comparison   - 对比测评
urgency      - 紧迫促销
```

## 活动状态（STATUS_MAP）

```
pending    - 待处理
generating - 生成中
ready      - 待投放
active     - 投放中
paused     - 已暂停
killed     - 已熔断
```

## Webhook 端点

### `POST /webhooks/video/ready`
视频制作系统调用，通知视频已完成。

**请求 body（JSON）：**
```json
{
  "campaign_id": "xxx",
  "video_url": "https://cdn.example.com/video.mp4",
  "thumbnail_url": "https://cdn.example.com/thumb.jpg",
  "status": "ready"
}
```

**处理逻辑：**
1. 查找 campaign，更新 `videoUrl`、`thumbnailUrl`、`status`
2. 创建一条 `Notification`（type: video_ready）
3. 返回 200 OK

**安全：** 验证 `X-Shopify-Shop-Domain` header 或 HMAC signature。

## 用户通知展示

- 顶部 NavMenu 显示未读通知数量 badge
- `/app/notifications` 页面列出所有通知
- 点击通知标记为已读

## OAuth & 认证

- 使用 `@shopify/shopify-app-react-router` 标准流程
- `AppDistribution.AppStore`（嵌入式）
- 需要 scopes：`read_products`、`write_products`

## 技术栈

- React Router v7（@react-router/fs-routes）
- Prisma + SQLite（`prisma/dev.sqlite`）
- Shopify App Bridge（`@shopify/app-bridge-react`）
- 云flare Tunnel 暴露开发环境

## 开发步骤

1. 环境和代码审查
2. 数据库扩展（Prisma migration）
3. 广告活动列表页完善
4. 广告活动详情页
5. Webhook 接收端
6. 通知机制
7. Shopify 后台配置（注册 webhook、scopes）
8. 完整流程测试