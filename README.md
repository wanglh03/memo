# 待办事项 · 备忘录

一个以日历为首页的私人备忘录：点某一天，就能看到那天写下的文字和图片。部署在 Cloudflare Workers，数据存在 R2。

> 线上地址：<https://memo.gtbro.vip>

## 功能

- **日历即首页**：有记录的日期为正色并带圆点，没有记录的日期显示为灰色；点击日期查看当天的全部内容
- **未来事项**：不指定日期的事项单独放在「未来事项」卡片里，不会出现在日历上；随时可以编辑补上日期，补上后自动归入对应日期
- **记录**：精确到小时的日期、可选标题、Markdown 正文（粗体 / 列表 / 引用 / 代码块 / 任务清单 / 表格）、最多 6 张图片
- **增删改**：添加、编辑、删除记录；编辑时移除的图片会同步从 R2 删除
- **PIN 保护**：添加 / 修改 / 删除前需要验证 PIN（初始 `261023`）
  - PIN 不离开浏览器：前端用 PBKDF2-SHA256（210000 次 + 服务端盐）派生 proof，服务端只保存 `HMAC(pepper, proof)` 摘要
  - 验证成功后写入 HMAC-SHA256 签名的 `HttpOnly` Cookie，10 年有效，只需输入一次
  - 同一 IP 15 分钟内失败 6 次会被限流
- **图片**：上传前在浏览器压缩（长边 ≤ 1800px，JPEG 0.86），点击可看大图，支持左右切换与手机滑动
- **移动端**：响应式布局、底部抽屉式编辑器、禁用页面缩放、适配刘海屏安全区
- **深色模式**：默认跟随系统，可手动切换并记住选择

## 技术栈

| 层 | 选型 |
| --- | --- |
| 前端 | Vite 8 + React 19 + Tailwind CSS v4 |
| 后端 | Cloudflare Worker（`worker/`）+ Static Assets |
| 存储 | Cloudflare R2（复用 `review-it` 桶，数据统一放在 `memo/` 前缀下） |
| 部署 | Wrangler，自定义域名 `memo.gtbro.vip` |

## 目录

```
worker/
  index.js          入口：/api/* 交给接口层，其余交给静态资源
  api.js            路由：登录、记录增删改查、图片上传与读取
  lib/auth.js       PBKDF2 摘要校验、HMAC 签名 Cookie、限流
  lib/http.js       JSON / Cookie / 错误响应工具
  lib/store.js      R2 数据层（单 JSON + 图片对象）
src/
  App.jsx           页面状态与流程
  components/       日历、当天视图、编辑器、PIN 弹窗、图片大图
  lib/              API 客户端、日期工具、图片压缩、主题
scripts/
  generate-secrets.mjs  生成本地 / 生产密钥
```

## 本地开发

```bash
npm install
npm run secrets     # 生成 .dev.vars（已 gitignore）
npm run worker      # Worker + R2 本地模拟，http://127.0.0.1:8787
npm run dev         # Vite 热更新，http://127.0.0.1:5173（/api 代理到 8787）
```

只想预览完整效果时，直接 `npm run build && npm run worker`，然后打开 <http://127.0.0.1:8787>。

## 自检

```bash
MEMO_BASE=https://memo.gtbro.vip MEMO_PIN=261023 node scripts/smoke-auth.mjs
```

会检查健康接口、记录数量、PIN 登录与 Cookie 属性（HttpOnly / Secure / SameSite=Lax / Max-Age）。

## 部署

```bash
# 1. 写入生产密钥（与 .dev.vars 保持一致，否则已登录的 Cookie 会失效）
npx wrangler secret bulk .secrets.json
# 2. 构建并发布（自动创建 DNS 记录与证书）
npm run deploy
```

`wrangler.toml` 中已固定：

- `name = "memo"`，静态资源 `./dist`
- R2 绑定 `BUCKET → review-it`
- 自定义域名路由 `memo.gtbro.vip`

### 更换 PIN

```bash
MEMO_PIN=新PIN node scripts/generate-secrets.mjs --force   # 本地
npx wrangler secret bulk .secrets.json                      # 生产
```

`--force` 会重签 `SESSION_SECRET`，所有设备需要重新输入 PIN。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/config` | 下发 PBKDF2 盐与迭代次数 |
| GET | `/api/auth/status` | 当前 Cookie 是否有效 |
| POST | `/api/auth` | 用 proof 换签名 Cookie |
| POST | `/api/auth/logout` | 清除 Cookie |
| GET | `/api/memos` | 全部记录（只读公开） |
| POST | `/api/memos` | 新建（需 PIN） |
| PUT | `/api/memos/:id` | 修改（需 PIN） |
| DELETE | `/api/memos/:id` | 删除（需 PIN） |
| POST | `/api/upload` | 上传图片（需 PIN，≤ 8MB） |
| GET | `/api/img/memo/images/:file` | 读取图片（长期缓存） |

## 数据与安全说明

- 记录存于 `review-it` 桶的 `memo/data.json`，图片存于 `memo/images/<uuid>.<ext>`，与同桶其他项目互不干扰
- 图片读取接口只允许 `memo/images/` 前缀，且只接受白名单图片魔数（JPG / PNG / WebP / GIF / AVIF）
- Markdown 渲染不解析原始 HTML，链接强制 `noopener noreferrer`，避免 XSS
- Cookie：`memo_pin`，`HttpOnly` + `Secure` + `SameSite=Lax`，服务端签名，浏览器无法伪造
- 本项目为纯前端 + Worker 架构，阅读无需登录；如需整站私有，可给 `GET /api/memos` 也加上 `requireSession`
