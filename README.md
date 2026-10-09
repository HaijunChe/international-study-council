# International Study Council — 网站

留学中介官网。前台英文，后台中文/英文混排均可，内容全部存服务器数据库。

---

## 给审阅的同学

谢谢帮忙看。三件事：

**1. 怎么看**

想看到真实页面，需要跑起来（这是个服务端渲染的站，不是静态 HTML，不能直接双击打开）：

```bash
cd web
npm install
npm run dev        # 打开 http://localhost:4321
```

不需要装数据库——本地会自动启一个内嵌的 Postgres，数据存在 `./.data/pg`。
后台在 `http://localhost:4321/admin`，账号见下方「本地开发」一节。

如果只想看代码，直接翻 `lib/kernel/blocks.tsx`（所有页面区块）和 `lib/kernel/bootstrap.ts`（所有页面和内容的定义）。

**2. 提问题**

请开一个 **Issue**（仓库上方 `Issues` → `New issue` → 选「反馈一个问题」），模板里会问你：在哪里、现在什么样、应该什么样、多严重。有截图直接拖进去。

**比"直接改代码"更省事**——我按 issue 统一改，避免冲突。

**3. 重点看什么**

- **首页的滚动叙事**（往下滚，左边屏幕会跟着演）—— 节奏对不对、动画是否卡顿
- **`/plan` 搭积木页** —— 拖拽和点击的手感，总价/工期算得对不对
- **手机宽度** —— 导航折叠、演示屏变单栏、表格横向滚动
- **6 种语言** —— 切到 `/ar` 看阿拉伯语，整页方向应该镜像过来
- **后台 `/admin`** —— 试着改一个积木、加一所院校，看前台有没有立刻变

已知的、**不用报**的问题：页脚的邮箱/WhatsApp/LinkedIn/Facebook 全是占位符（虚构号段），等机构给真实信息；Logo 用的是参考站的配色，品牌色还没定。

---

## 一、这套东西是怎么搭起来的

整个系统只有两个概念：**积木（Block）** 和 **集合（Collection）**。

```
数据库
├── pages      页面登记
├── blocks     页面上的一块块积木（type + 排序 + 开关 + JSON 字段）
├── entries    所有结构化内容（院校/奖学金/目的地/服务/顾问/攻略）
├── settings   站点设置（站名、Logo、社交链接、WhatsApp、主题色、SEO）
├── leads      咨询线索
├── media      媒体库
└── users / revisions / audit_logs
```

**渲染只有一条链路**（`lib/kernel/render.tsx` 的 `renderLoop`）：

```
按顺序取出页面的 blocks
  → 跳过 enabled = false 的
  → 用 type 去积木注册表里查渲染器
  → 渲染成 HTML
```

**写入只有四个接口**（`lib/kernel/content.ts`）：

| 接口 | 作用 |
|---|---|
| `listBlocks(pageId)` | 取一个页面的所有积木 |
| `getBlock(id)` | 取单个积木 |
| `saveBlock(id, patch)` | 保存积木（自动存历史版本） |
| `deleteBlock(id)` | 删除积木 |

所有后台操作都走这四个，没有别的写入口。这就是「内核极简」的含义。

### 加一个新积木要做什么

只需要在 `lib/kernel/blocks.tsx` 里加一段 `registerBlock({...})`，声明：标签、分组、说明、字段列表、默认值、渲染函数。

加完立刻就有：后台模块抽屉里多一个可拖拽的模块 + 自动生成的编辑表单。**不用改数据库，不用改后台代码。**

### 加一个新内容类型要做什么

在 `lib/kernel/collections.ts` 里加一段 `registerCollection({...})`，声明字段。

加完立刻就有：后台左侧多一个菜单项 + 列表页 + 新增/编辑表单 + （若配了 `publicPath`）前台详情页。

---

## 二、本地开发

```bash
cd web
npm install
npm run dev          # http://localhost:4321
```

本地**不需要装任何数据库**。没有设置 `DATABASE_URL` 时，内核会自动启动一个内嵌的 Postgres（PGlite，WASM 版），数据存在 `./.data/pg`。它的 SQL 和真实 Postgres 完全一致，所以本地跑通的东西上线一定跑得通。

默认管理员账号（仅首次建库时写入）：

- 邮箱：`admin@internationalstudycouncil.com`
- 密码：`changeme123`

> 上线前务必改掉。见下方「环境变量」。

后台地址：`http://localhost:4321/admin`

---

## 三、上线到服务器（Vercel + 托管 Postgres + GoDaddy 域名）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mehedi-hasan-shoton/international-study-council)

> 点上面这个按钮可以直接跳到 Vercel 的导入页面，省掉「在列表里找仓库」这一步。
> **导入时必须填好 4 个环境变量**（见第 3 步），否则网站会报错。

### 第 1 步 · 建数据库

任选一家托管 Postgres，都有免费额度：

- **Neon**（neon.tech）— 注册后新建 project，复制连接串
- **Supabase**（supabase.com）— Project Settings → Database → Connection string

连接串形如：

```
postgres://user:password@host/dbname?sslmode=require
```

> 第一次访问网站时，内核会自动建表并写入初始内容（院校、奖学金、示例页面等）。不需要手动跑任何 SQL。

### 第 2 步 · 推到 GitHub

```bash
cd web
git init && git add -A && git commit -m "International Study Council website"
git remote add origin git@github.com:<你的账号>/<仓库名>.git
git push -u origin main
```

### 第 3 步 · 导入 Vercel

1. 打开 https://vercel.com/new
2. 用 GitHub 登录 → 选择刚才的仓库 → Import
3. 框架会自动识别为 Next.js，构建命令不用改
4. **在 Environment Variables 里填这几项**（这是关键一步）：

| 变量名 | 值 | 说明 |
|---|---|---|
| `DATABASE_URL` | 第 1 步拿到的连接串 | 必须填，否则线上用的是临时数据库 |
| `AUTH_SECRET` | 32 位以上随机字符串 | 用于给登录状态签名，**必须改掉** |
| `SEED_ADMIN_EMAIL` | 同学的登录邮箱 | 首次建库时创建 |
| `SEED_ADMIN_PASSWORD` | 强密码 | 首次建库时创建 |
| `SITE_URL` | `https://internationalstudycouncil.com` | 用于生成分享预览图的绝对地址 |
| `BLOB_READ_WRITE_TOKEN` | 可选 | 填了图片上传会存到 Vercel Blob；不填则只能贴图片 URL |

生成随机密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

5. 点 Deploy。完成后会得到一个 `xxx.vercel.app` 的临时地址，**先在这个地址上验收**。

### 第 4 步 · 绑定域名（GoDaddy 侧）

1. Vercel 项目 → **Settings → Domains**
2. 添加 `internationalstudycouncil.com` 和 `www.internationalstudycouncil.com`
3. Vercel 会给出**本项目专属**的 DNS 记录值，**以它显示的为准**
4. 打开 GoDaddy → **My Products** → 找到 `internationalstudycouncil.com` → **DNS**（或 Manage DNS）
5. 在记录表里操作：

| 操作 | 类型 | 名称 | 值 |
|---|---|---|---|
| **先删除** | A | `@` | 指向 GoDaddy 停车页的默认记录 |
| **先删除** | CNAME | `www` | 默认记录 |
| 新增 | A | `@` | Vercel 面板显示的 IP（常见 `76.76.21.21`） |
| 新增 | CNAME | `www` | Vercel 面板显示的 CNAME 目标（形如 `xxxxx.vercel-dns-017.com`） |

6. TTL 设为 300 秒。等 10 分钟到 2 小时生效，Vercel 会自动签发 HTTPS 证书。

**三个坑：**

- 不要加 **AAAA（IPv6）** 记录 —— Vercel 自定义域名不支持，会让证书签发卡死
- 如果站点有 **CAA** 记录，必须允许 `letsencrypt.org`，否则 HTTPS 发不下来
- 根域名不能用 CNAME（DNS 协议限制），必须用 A 记录

### 第 5 步 · 上线后检查

- [ ] `https://internationalstudycouncil.com` 打开正常，手机端也正常
- [ ] `/admin` 能登录（用第 3 步设置的账号密码）
- [ ] 在后台改一句话，刷新前台能看到变化
- [ ] 提交一次咨询表单，后台「Enquiries」里能看到
- [ ] 后台 → 站点设置，把 WhatsApp 号码和 LinkedIn / Facebook / Instagram 换成真实的
- [ ] 把站点地图提交到 Google Search Console

---

## 四、同学日常怎么改（可以单独发给他）

| 想改什么 | 去哪里 | 怎么做 |
|---|---|---|
| 首页某段文字 | 后台 → Pages → Home | 左侧点那块积木 → 右侧改文字 → 保存，前台立刻更新 |
| 增删首页模块 | 后台 → Pages → Home | 顶部「+ Add block」加；块上 `✕` 删；`○/◉` 开关；`↑↓` 排序 |
| 换主视觉大图 | 页面编辑器 → Hero 块 | 点 Upload 传图，或直接粘贴图片网址 |
| 加一所合作院校 | 后台 → Universities → + New | 填名称、国家、城市、学费、学位层级、专业 → 勾「Show on the home page」 |
| 加一条奖学金 | 后台 → Scholarships → + New | 填提供方、金额、截止日期、适用学位与国家 |
| 改学费 / 截止日期 | Universities / Scholarships | **只改一次**，首页、列表页、详情页三处同步更新 |
| 发一篇留学攻略 | 后台 → Guides → + New | 写标题、摘要、正文（支持 `##` 标题、`**粗体**`、`- 列表`、`[链接](网址)`） |
| 改服务项目与价格 | 后台 → Services | 增删服务项；`Category` 决定它在服务页归到哪一组 |
| 改申请表的题目 | 后台 → Pages → Apply → Application form 块 | 改 `Questions` 列表：加题、改选项、改必填、改它在第几步 |
| 改申请表的步骤名 | 同上 → `Steps` 列表 | 三步的名字与说明 |
| 加/换顾问 | 后台 → Advisors | 传照片、填姓名职位履历 |
| 改社交链接 / WhatsApp 号 | 后台 → Site settings | 改一处，全站页脚、悬浮按钮、联系页同时更新 |
| 改导航菜单 | 后台 → Pages → 某页 → Page settings | 勾「Show in menu」+ 填菜单名称和排序 |
| 加一个全新页面 | 后台 → Pages → + New page | 起名 → 用积木拼内容 → 加入导航 |
| 看谁提交了咨询 | 后台 → Enquiries | 改状态、写备注、导出 CSV |
| 改主题色 / Logo 字样 | 后台 → Site settings → Colour / Identity | 改完全站生效 |

---

## 五、环境变量一览

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | 生产必填 | 托管 Postgres 连接串。留空则用内嵌数据库（仅开发用） |
| `AUTH_SECRET` | 生产必填 | 会话签名密钥，32 位以上随机字符串 |
| `SEED_ADMIN_EMAIL` | 可选 | 首次建库时创建的管理员邮箱 |
| `SEED_ADMIN_PASSWORD` | 可选 | 首次建库时创建的管理员密码 |
| `SITE_URL` | 可选 | 站点绝对地址，用于 SEO 与分享预览 |
| `BLOB_READ_WRITE_TOKEN` | 可选 | 填了图片上传走 Vercel Blob，否则存本地磁盘 |
| `PGLITE_DIR` | 可选 | 内嵌数据库的存放目录，默认 `./.data/pg` |

---

## 六、目录结构

```
web/
├── app/
│   ├── (site)/                前台
│   │   ├── page.tsx           首页
│   │   ├── [slug]/            后台新建的页面自动走这里
│   │   ├── universities/      院校库 + 院校详情
│   │   ├── scholarships/      奖学金库 + 详情
│   │   ├── destinations/      目的地指南
│   │   └── blog/              攻略列表 + 文章
│   ├── admin/                 后台（登录、页面编辑器、集合管理、线索、设置）
│   ├── api/                   接口层
│   └── globals.css            设计系统（明暗双主题）
├── components/                前台组件
│   └── admin/                 后台组件（积木编辑器、字段渲染器、媒体选择器…）
└── lib/kernel/                内核
    ├── db.ts                  数据库适配（真实 Postgres / 内嵌 Postgres）
    ├── bootstrap.ts           建表 + 首次种子内容
    ├── types.ts               积木与集合的注册表
    ├── blocks.tsx             ★ 积木库（25 个模块都在这里）
    ├── collections.ts         ★ 集合定义（6 个内容类型）
    ├── render.tsx             唯一渲染链
    ├── content.ts             四个内核接口 + 页面/集合/设置/线索
    ├── auth.ts                登录（scrypt + HMAC，零依赖）
    └── md.ts                  极简 Markdown
```

---

## 七、备份

数据库是唯一的数据源。托管服务一般自带每日备份（Neon 有 point-in-time restore，Supabase 有每日备份）。额外手动导出：

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
```

积木的每一次保存都会写一条历史记录到 `revisions` 表，改错了可以回滚。
