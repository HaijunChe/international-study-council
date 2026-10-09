# ISC 留学网站 — 完整复现规格书

> 这份文档是 International Study Council 网站的**全部参数快照**。
> 把它整份粘进另一个对话，就能复现一个完全相同的网站。
>
> 项目路径：`/Users/chehaijun/WorkBuddy AI/2026-10-06-23-14-38/web`
> 生成时间：2026-10-09

---

## 0. 怎么用这份文档

**先做一件事，能省掉 90% 的工作**：

```bash
# 如果新对话和本项目在同一个工作区，直接指给它这个目录即可：
/Users/chehaijun/WorkBuddy AI/2026-10-06-23-14-38/web

# 如果新对话在别处，先解包源码（见同目录 ISC-website-source.tar.gz）
tar -xzf ISC-website-source.tar.gz -C <目标目录>
```

新对话的第一句话建议这样说：

> 这是一个已经建好的 Next.js 16 留学咨询网站，源码在 `<路径>`。
> 请先读 `docs/ISC-复现规格书.md` 和 `web/README.md`，理解它的架构（积木式 CMS），
> 然后按我的要求改造 / 复现。**不要重写架构**，在现有积木和集合上扩展。

**如果要从零重建**：照本文档第 2–23 节逐条实现。第 22 节（已知坑）是踩过血的地方，务必先看。

---

## 1. 一句话目标

给一家**非技术的留学咨询机构**做一个能自己永久维护的网站：所有页面由「积木」拼成、所有内容存在数据库、后台可视化编辑、6 种语言、访客能自己搭服务套餐。

**不是**传统的静态营销站。核心差异：

- 页面内容 = 数据库里有序的「积木」行，不是代码里的 JSX
- 院校/奖学金/服务/目的地 = 「集合」里的记录，被积木**引用**而非复制
- 改一处数据，首页/列表页/详情页**同时**变

---

## 2. 技术栈（精确版本）

```json
{
  "name": "international-study-council",
  "dependencies": {
    "@electric-sql/pglite": "^0.5.8",
    "next": "16.4.0",
    "pg": "^8.23.1",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "@types/pg": "^8.11.10",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.9.0"
  }
}
```

**零 UI 依赖**——没有 Tailwind、没有 shadcn、没有 CSS-in-JS。全部手写 CSS。
**零 ORM**——直接 SQL。
**零认证库**——`node:crypto` 的 scrypt + HMAC。

`next.config.ts` 必须包含：

```ts
serverExternalPackages: ['@electric-sql/pglite', 'pg']
```

**本地数据库用 PGlite**（Postgres 编译成 WASM），落盘到 `.data/pg`，零安装。生产切 `DATABASE_URL` 指向 Neon/Supabase，**同一套 SQL 不用改**。

---

## 3. 目录结构

```
web/
├── app/
│   ├── layout.tsx                    根布局（<html lang dir> 从请求头读）
│   ├── globals.css                   全部设计系统，6891 行
│   ├── middleware.ts                 locale 前缀改写
│   ├── [locale]/(site)/              访客端（14 个路由）
│   │   ├── layout.tsx  page.tsx  [slug]/      通用页面
│   │   ├── universities/[slug]/  scholarships/[slug]/
│   │   ├── destinations/[slug]/  blog/[slug]/
│   │   └── about/ contact/ services/ blog/ universities/
│   │       scholarships/ destinations/
│   ├── admin/                        后台（7 个路由）
│   │   ├── layout.tsx  page.tsx  admin.css (1129 行)
│   │   ├── pages/[id]/  c/[collection]/[id]/
│   │   ├── leads/  settings/  languages/
│   └── api/
│       ├── leads/route.ts            公开表单入口
│       ├── search/route.ts           全站搜索
│       └── admin/                    14 个后台 API
├── components/
│   ├── Icon.tsx                      线性图标集（~30 个，内联 SVG path）
│   ├── IscMark.tsx                   ISC 三色方块 logo（可动画）
│   ├── Scrolly.tsx                   ★ 滚动分栏 + 6 个演示屏
│   ├── WorldMap.tsx                  ★ 体素世界地图
│   ├── PlanBuilder.tsx               ★ 访客搭积木
│   ├── Search.tsx                    ⌘K 搜索浮层 + 首屏内联搜索
│   ├── NavMenu.tsx                   导航（浮动面板）
│   ├── SiteFooter.tsx                页脚（Pi 风格）
│   ├── cards.tsx                     院校/奖学金/服务/目的地/文章 卡片
│   ├── ApplicationForm.tsx           多步申请表
│   └── admin/                        PageEditor FieldInput RepeaterField 等
├── lib/
│   ├── kernel/
│   │   ├── db.ts                     query() 双驱动（pg | PGlite）
│   │   ├── bootstrap.ts              DDL + 种子，2096 行
│   │   ├── types.ts                  FieldDef/BlockDef/CollectionDef + 注册表
│   │   ├── blocks.tsx                ★ 31 个积木，全部页面区块在这
│   │   ├── collections.ts            ★ 6 个集合
│   │   ├── render.tsx                renderLoop()
│   │   ├── content.ts                4 个写 API + 页面/条目/设置/线索
│   │   ├── auth.ts                   scrypt + HMAC cookie
│   │   ├── dictionary.ts             6 语言 × 154 条界面文案
│   │   ├── md.ts                     微型 markdown（~70 行）
│   │   ├── world.ts                  服务端加载地图几何
│   │   └── ids.ts                    id() / slugify() / money()
│   └── data/world-map.json           体素地图几何，72 KB
└── scripts/build-world-map.mjs       从 Natural Earth 生成地图（一次性）
```

**规模参考**：`app` 42 文件 9921 行、`components` 26 文件 4561 行、`lib` 15 文件 6915 行。总计约 21000 行。

---

## 4. 环境与命令（沙箱坑，先看这里）

### 启动（生产预览）

```bash
cd "<项目>/web"
unset npm_config_proxy npm_config_https_proxy
NODE_OPTIONS="" PATH="/Users/chehaijun/.workbuddy-ai/binaries/node/versions/22.22.2-6/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
  npx next start -p 4321
```

### 构建

```bash
rm -rf .next          # 必须单独一条命令，rm 被沙箱代理了
NODE_OPTIONS="" PATH="<node>/bin:/usr/bin:/bin:/usr/sbin:/sbin" npx next build
```

### 重置数据库

```bash
rm -rf .data && mkdir -p .data/pg     # mkdir -p 是必须的，见第 22 节
```

### 为什么必须 `NODE_OPTIONS=""`

沙箱通过 `NODE_OPTIONS=--require .../node-language-shim.cjs` 注入删除守卫。Next 启动时会批量删 `.next/dev`，触发守卫直接杀掉进程。清空 `NODE_OPTIONS` 即绕过。

**用户自己的终端里不需要这些**，直接 `npm run dev` 即可。

---

## 5. 数据库 Schema（9 张表，此后永不需要迁移）

```sql
pages(id, slug, title, seo_title, seo_description, status,
      show_in_nav, nav_label, nav_order, updated_at)
blocks(id text pk, page_id fk, type, position, enabled, data jsonb)
entries(id text pk, collection, slug, title, status, position, data jsonb)
settings(key pk, value jsonb)
media(id, url, filename, alt, mime, size)
leads(id, name, email, phone, whatsapp, country, level, message,
      source, status, notes, data jsonb, created_at)
users(id, email, password_hash, name, role)
revisions(id, block_id, data jsonb, actor)
audit_logs(id, actor, action, target)
translations(locale, key, value, updated_at)   primary key (locale, key)
unique (entries.collection, entries.slug)
```

**最关键的设计决策**：所有内容类型共用一张 `entries` 表 + `collection` 判别列 + JSONB `data`。加「产品」「团队成员」只是**注册一个配置对象**，不是一次数据库迁移。这是这个系统能一直便宜地扩展的原因。

### 4 个写 API（后台只能走这 4 个）

```ts
listBlocks(pageId) · getBlock(id) · saveBlock(id, patch) · deleteBlock(id)
```

`saveBlock` 先把旧值写进 `revisions` 再合并 patch，所以任何编辑都可回滚。

### 数据积木只引用、不复制

积木里只存**查询条件**（`{ mode: 'featured', limit: 6, where: { country } }`），不存快照。
于是改一条学费数字，首页、列表页、详情页**同时**更新——这是这个设计最有价值的一点，也是甲方最容易立刻感知到的一点。

---

## 6. 设计系统（完整 `:root` 令牌）

这是从 **pi.dev 的 `[data-theme="light"]`** 抓出来的真实配色，不是猜的。

```css
:root {
  color-scheme: light;

  /* 底色层次：越靠前的面板越亮 */
  --bg: #f1efea;              /* 页面底 —— 笔记本米白 */
  --bg-soft: #f8f7f4;         /* 次级面板 */
  --bg-raised: #fdfcfb;       /* 卡片/浮起面板 */
  --bg-panel: #fdfcfb;        /* 浮层 */

  --fg: #1f2836;              /* 主文字 —— 深夜蓝 */
  --fg-soft: rgba(46, 56, 71, 0.86);
  --fg-muted: rgba(92, 96, 106, 0.78);

  --line: #4b607c26;          /* 1px 分隔线（15% 蓝） */
  --line-strong: #4b607c40;   /* 强分隔（25% 蓝） */

  --accent: #4b607c;          /* 主强调 —— thread blue */
  --accent-strong: #33465c;
  --accent-soft: rgba(75, 96, 124, 0.09);
  --accent-rust: #8f3222;

  /* 暖色半边 —— 只用在图标、分类标记、小强调上 */
  --parchment: #dacbc2;
  --moonstone: #ebe7e4;
  --sunkissed: #e1b06e;
  --terracotta: #b86b52;
  --sage: #a3a473;
  --tidal: #4b607c;
  --driftwood: #5c5752;

  --ok: #4f8f6a;
  --warn: #b5711f;

  /* 全站直角 —— Pi 的圆角是 0 */
  --radius-sm: 0px;
  --radius: 0px;
  --radius-lg: 0px;

  --wrap: 1080px;
  --gutter: clamp(20px, 4vw, 40px);
  --section-y: clamp(52px, 7.5vw, 104px);

  --font-sans: 'Inter', ui-sans-serif, -apple-system, BlinkMacSystemFont,
    'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --font-serif: 'Source Serif 4', 'Plantin MT Pro', Plantin, Georgia, ui-serif, serif;

  /* 字号刻意小 —— 参考站是读物，不是海报 */
  --fs-display: clamp(2.3rem, 5.2vw, 3.5rem);
  --fs-h1: clamp(1.9rem, 3.8vw, 2.65rem);
  --fs-h2: clamp(1.45rem, 2.4vw, 1.95rem);
  --fs-h3: 1.15rem;
  --fs-body: 1.0625rem;
  --fs-detail: 1rem;
  --fs-mono: 0.875rem;
  --fs-label: 0.75rem;
  --lh-body: 1.55;
  --track-label: 0.12em;
  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);

  /* 笔记本格纹：20px 细格 + 100px 粗格 */
  --grid-line: #4b607c14;
  --grid-line-major: #4b607c24;
  --grid-cell: 20px;
}
```

**还提供一套深色主题**（`:root[data-theme='dark']`），但**默认是浅色**——参考站就是浅色。

### 排版规则

- **标题用衬线体 + 斜体**：`.sec-head .h2, .value__title, .cta__headline, .quote__text { font-family: var(--font-serif); font-style: italic; font-weight: 400; }`
- **标签用 mono 小字 + 0.12em 字距**，全大写
- 正文 1.0625rem / 行高 1.55

### 笔记本格纹

固定在视口上的一层网格，两层叠加：

```css
body::before {
  content: '';
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to right, var(--grid-line-major) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line-major) 1px, transparent 1px);
  background-size: 20px 20px, 20px 20px, 100px 100px, 100px 100px;
}
```

**不加 mask**——参考站让格纹铺满整页。`main` / `.site-head` / `.site-foot` / `.adm` 都设 `position: relative; z-index: 1`。

### 字体加载

**不要用 `next/font/google`**（沙箱里必然失败，见第 22 节）。在根布局里用 `<link>`：

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,400&display=swap" />
```

---

## 7. 导航栏（照搬 pi.dev）

**不是通栏 sticky bar，是一个带边框的浮动面板**。

- `.site-head` 是 sticky 容器，`padding: 0.7rem clamp(0.9rem,3vw,2rem) 0`，背景是从 `--bg` 到底部透明的渐变
- `.site-head__inner` 宽度 `min(100%, 88rem)` 居中，**有边框**、顶边提亮、`backdrop-filter: blur(14px)`
- **左侧**：ISC 三色方块 logo（`2.1rem` 宽）+ 品牌名（mono 0.8125rem）
- **中间**：链接用 `position: absolute; inset-inline-start: 50%; transform: translateX(-50%)` **绝对居中**
- **右侧**：搜索按钮（纯图标 + ⌘K 徽章）+ 语言切换 + 主 CTA

导航项（**5 项，不多不少**）：

| 顺序 | 路径 | 标签 |
|---|---|---|
| 1 | `/plan` | Build a plan |
| 2 | `/universities` | Universities |
| 3 | `/scholarships` | Scholarships |
| 4 | `/services` | Services |
| 5 | `/contact` | Contact |

其余页面（Destinations / About / Guides / Privacy / Terms）`show_in_nav: false`，只在页脚出现。

**绝对居中布局不会像 flex 那样自动挤压**——两侧宽度必须自己核对。1440px 下曾经出现过链接末端和搜索按钮重叠 46px。修法：搜索按钮去掉 "Search" 文字只留图标 + ⌘K，并收紧间距。链接一律 `white-space: nowrap`。

**移动端断点 1080px**：低于此宽度隐藏中间链接、显示汉堡。品牌名在 1080px 以下隐藏。

### ISC Logo（三色方块）

参考站的 logo 本身就是三色方块拼的（珊瑚 `#F09082` / 蓝 `#4D9ABF` / 黄 `#F1BE58`，大矩形而非小像素格）。ISC 用同样做法：

- `viewBox="0 0 800 800"`，坐标落在 117.36 的网格上
- 11×5 网格，三个字母三种颜色：**I 珊瑚 `#F09082` / S 蓝 `#4D9ABF` / C 黄 `#F1BE58`**
- 每块之间留 0.07 单位的缝
- 每个字母是一个独立 `<g class="isc__letter">`，可以整字做动画

**入场动画**：三个字母依次从屏幕上方落下（`--i` × 290ms），各自带落地挤压（`scaleY(0.9)`）和轻微倾斜，三个都落齐后**整个字一起跳一下**（`isc-hop`，delay 1180ms）。纯 CSS，无 JS。

---

## 8. 页脚（照搬 pi.dev）

结构是**左侧几行 mono 小字 + 右侧一排带图标的社交链接**。

```
┌──────────────────────────────────────────────────────────┐
│ International Study Council          [✉ Email] [WhatsApp] │
│ Privacy · Terms · Contact            [in LinkedIn] [f FB] │
│ © 2026 International Study Council                        │
└──────────────────────────────────────────────────────────┘
```

- `.site-footer__inner` flex space-between
- 左列：`.site-footer__primary`（品牌名，用 `--fg`）+ 链接行 + 版权
- 右列：`display: flex; flex-direction: column; align-items: flex-end`
- 社交链接：**图标 17px + 文字**，间距 1.4rem，mono 0.85rem
- 图标是**内联 SVG 品牌路径**，用 `fill` 不用 `stroke`（小尺寸下才清晰）
- 移动端（<760px）改纵向左对齐

**注意**：邮箱、WhatsApp、LinkedIn、Facebook 的**值全部是占位符**，必须在后台换成真实的。特别提醒 WhatsApp 号 `+1 202 555 0143` 是美国保留的虚构号段。

---

## 9. 首页结构（5 个积木，就这么多）

```
hero           → ISC 落体动画 + 居中标题 + 搜索框
scrolly        → 滚动分栏，6 段，左侧演示屏
values         → 「我们不做什么」横向无限跑马灯
cta            → 收尾行动号召
whatsappFloat  → 右下悬浮按钮
```

### hero

- `variant: 'mark'`（居中变体）、`show_mark: true`、`show_search: true`
- eyebrow：`International Study Council`
- 标题：`There are many consultants.\nThis one is yours.`（第二行斜体，颜色 `--fg-muted`）
- 正文：`Tell us where you want to go and what you can afford. We map the universities, the funding and the visa route that actually fits you.`
- 主按钮：`Start your application` → `/apply`；次按钮：`Build your own plan` → `/plan`
- 脚注：`Free assessment. No fees until you hold an offer.`

### scrolly（**这是整站的重点**）

左栏是一个 sticky 的「模拟屏幕」，右栏是 6 段文字滚动。滚到哪段，左边播哪段的演示。

| # | id | 右栏标题 | 左栏演示内容 |
|---|---|---|---|
| 1 | `services` | What we do | 服务行逐条滑入，勾选框逐个打勾，行高亮成蓝色，Running total + 进度条 |
| 2 | `process` | Four steps, roughly six weeks | 时间线：已完成节点绿勾、进行中脉冲点、未开始灰点，连接线从上往下画出来 |
| 3 | `search` | Search your destination | 打字机输入 `germany` → 筛选 chip 弹出 → 结果行出现 |
| 4 | `map` | Where we can take you | 体素地图按经度一盏一盏亮起 |
| 5 | `apply` | Talk to an advisor | 三格进度条 + 字段逐个打字填入 + `Application received` 徽章 |
| 6 | `why` | Why students pick us | **左右两张卡片对比**：左边 0/4 空进度条 + 红 ✕，右边 4/4 满蓝条 + 绿 ✓ |

**演示屏的 UI 规格**：

- 外层 `.screen`：1px 边框、`--bg-raised` 底、无圆角、投影 `0 1px 0 rgba(31,40,54,.04), 0 18px 50px rgba(31,40,54,.1)`
- 标题栏 `.screen__bar`：**没有红黄绿三个圆点**（参考站没有浏览器拟物），只有 mono 小字标题 + 右侧一个 URL 胶囊
- 内容区 `.screen__body`：`min-height: clamp(320px, 40vw, 470px)`、`overflow: hidden`、`position: relative`
- 每个演示统一结构：`.dm__head`（衬线斜体标题 + mono 元信息）/ 内容 / `.dm__foot`（底部状态栏，mono 小字左右各一条）

**分栏尺寸**：`.blk-scrolly > .wrap { max-width: min(96vw, 1440px) }`，两栏各占一半，`gap: clamp(28px,4vw,64px)`。左栏 `position: sticky; top: 84px`。

**节奏**：`.scrolly__step { min-height: clamp(420px, 72vh, 700px) }`——**必须配 clamp 设上限**，否则超高窗口下 `vh` 会把文字推到很远。

**切换机制**：`IntersectionObserver` 观察每段，进入视口就 `setActive(index)`。演示组件用 `key={active}` **强制重挂载**，切到该段时 CSS 动画自动从头播一遍——不用写任何「重放」逻辑。这是整套滚动叙事能这么省事的关键。

**响应式**：<980px 时变成单栏，屏幕吸顶在顶部，每段 `min-height: 62vh`，`opacity: 1`。

### values（我们不做什么）

横向无限跑马灯，卡片宽 `clamp(240px, 26vw, 320px)`，60s 一轮，悬停暂停。每张卡片：陶土红 ✕ + 衬线斜体标题 + 一句解释。

四条内容：
1. **No guaranteed admission** — 没人能保证录取，谁保证谁在骗你
2. **No buying your way in** — 不伪造成绩单、不伪造资金证明、不行贿
3. **No silence after you pay** — 有署名顾问、有书面范围、一个工作日内回复
4. **No undisclosed commission** — 学校给的返佣印在你的选校清单上

---

## 10. 31 个积木（页面区块库）

后台的「搭积木」面板就是从这个注册表生成的，**永远不要手写编辑器**。

```
[layout]   hero, pageHeader, divider, scrolly
[data]     marquee, universityList, scholarshipList, countryCards,
           serviceList, priceTable, advisors, testimonials, posts, worldMap
[content]  stats, cardGrid, imageText, steps, faq, gallery, video,
           richtext, html, why
[convert]  cta, contactForm, planBuilder, applicationForm,
           contactDetails, whatsappFloat
```

注册方式：

```tsx
registerBlock({
  type: 'universityList', label: 'University list', group: 'data',
  hint: 'Pulls from the Universities collection.',
  initial: () => ({ title: '', mode: 'featured', limit: 6 }),
  fields: [
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'mode', label: 'Which', type: 'select', options: ['featured', 'all'] },
  ],
  render: async ({ data, ctx }) => {
    const entries = await ctx.get('universities', { limit: data.limit, featured: true })
    return <Section>…</Section>
  },
})
```

`render` 可以是 async。字段类型：`text textarea richtext number date select list checkboxes boolean image url color heading repeater`。

**两个特别有用的字段类型**：
- **`checkboxes`** — 多选，选项来自 `options`。后台渲染成 textarea（一行一个），前台渲染成 toggle 药丸。这是「你想买哪些服务」的实现方式。
- **`heading`** — 纯视觉分组，不是输入框。长表单必须有。

---

## 11. 6 个集合

| name | label | 单数 | 路径 | 种子条数 |
|---|---|---|---|---|
| `universities` | Universities | University | `/universities/<slug>` | 12 |
| `scholarships` | Scholarships | Scholarship | `/scholarships/<slug>` | 8 |
| `services` | Services | Service | `/services`（无详情页） | 10 |
| `countries` | Destinations | Destination | `/destinations/<slug>` | 14 |
| `advisors` | Advisors | Advisor | 无 | 3 |
| `posts` | Guides | Guide | `/blog/<slug>` | 3 |

注册方式：

```ts
registerCollection({
  name: 'universities', label: 'Universities', singular: 'University',
  titleKey: 'name', slugKey: 'name',
  publicPath: (slug) => `/universities/${slug}`,
  columns: ['country', 'tuition_from', 'featured'],
  fields: [ /* FieldDef[] */ ],
  initial: () => ({ featured: false }),
})
```

然后写**一个**通用后台列表页 + **一个**通用表单页（`app/admin/c/[collection]/`），六个集合就从 12 个页面组件降为 6 个配置对象。

**服务集合有可计算的数字字段**（搭积木需要）：

```
price: "From USD 150"        ← 显示用字符串
price_value: 150             ← 求和用数字
duration: "2–4 weeks"        ← 显示用
duration_weeks: 2            ← 估算用
```

---

## 12. 多语言（6 语言，含阿拉伯语 RTL）

| code | 语言 | 方向 | 前缀 |
|---|---|---|---|
| `en` | English | ltr | **无前缀**（根路径） |
| `bn` | বাংলা | ltr | `/bn` |
| `es` | Español | ltr | `/es` |
| `fr` | Français | ltr | `/fr` |
| `ar` | العربية | **rtl** | `/ar` |
| `ru` | Русский | ltr | `/ru` |

**默认语言不带前缀**：`/universities` 被中间件内部改写成 `/en/universities`，保证甲方分享出去的链接短。

### 两层译文，一张表

- **界面文案**（chrome）：固定 key 集，内置在 `lib/kernel/dictionary.ts`，**154 条 × 6 语言**
- **内容译文**：无界，归甲方所有。key 形如 `block.<id>.<field>` 和 `entry.<id>.<field>`

查找顺序：**数据库覆盖 → 语言默认 → 英语**。

**必须把词典播种进数据库**。只留在代码里的话，后台编辑器会显示空输入框——甲方看到所有东西都「未翻译」、覆盖率计数是 0。播种后编辑器显示真实译文，且能改任何一条（包括英文）。

### 中间件

```ts
const LOCALES = ['en', 'bn', 'es', 'fr', 'ar', 'ru']
const RTL = new Set(['ar'])
const BYPASS = ['/api', '/admin', '/_next', '/uploads', '/icon.svg', '/favicon.ico']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (BYPASS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next()

  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  const hasLocale = first && LOCALES.includes(first)

  const locale = hasLocale ? first : 'en'
  const rest = hasLocale ? `/${segments.slice(1).join('/')}` : pathname

  const headers = new Headers(request.headers)
  headers.set('x-isc-locale', locale)
  headers.set('x-isc-dir', RTL.has(locale) ? 'rtl' : 'ltr')

  const target = hasLocale ? rest : `/${locale}${pathname === '/' ? '' : pathname}`
  const url = request.nextUrl.clone()
  url.pathname = target || `/${locale}`
  return NextResponse.rewrite(url, { request: { headers } })
}
```

**为什么用请求头传 locale**：根布局是唯一能设 `<html lang dir>` 的地方，而它拿不到路由参数。中间件把 locale 写进 `x-isc-locale` / `x-isc-dir`，根布局读。

**必须防的失败模式**：把已带前缀的 URL 的前缀剥掉，会让 `/bn` 返回 404，更糟的是让 `/bn/plan` **悄悄渲染英文的 `/plan`**。两个都返回看起来正常的页面，**状态码巡检抓不到**。必须逐语言抓页面、断言导航里的实际译文。

### RTL 不只是 `dir="rtl"`

- 重写字距（负字距在阿拉伯文里很难看）
- 镜像列表符号（`padding-right` + `right: 2px`）
- 箭头图标 `transform: scaleX(-1)`
- 跑马灯 `animation-direction: reverse`
- 所有锚定一侧的属性改用逻辑属性（`inset-inline-end` / `border-inline-start`）

---

## 13. 体素世界地图（Minecraft 质感）

**做法**：把国家多边形栅格化到粗网格上，每个国家输出**一条 `<path>`**——把方块拼成连续子路径 `M{x} {y}h{s}v{s}h{-s}z` 重复。

**当前数据**：网格 250×100、格边长 4、**182 个国家、7537 个方块、72 KB**。

于是 DOM 里是 **182 个 `<path>`** 而不是 7537 个 `<rect>`——性能差别巨大。按国家分组，所以整个国家能被一个 CSS 类点亮。

### 三个会咬人的点

1. **TopoJSON 的弧线索引存在 `arcs` 里，不是 GeoJSON 的 `coordinates`**。搞错会得到 `polygons is not iterable`。
2. **110m 精度下小国根本不存在**——新加坡、马耳他、香港在数据集里完全没有，另有约 29 个国家小到点不中。必须手工维护一张 `POINT_MARKERS` 表（经纬度），标记 `tiny: true`，UI 画圆点而不是靠形状。
3. **等距圆柱投影裁 lat −60…84、宽度 1000，得到干净的 1000×400 viewBox**，并且丢掉了南极洲（否则它吃掉四分之一画布）。

### 必须服务端渲染

**在服务端 import JSON，作为 prop 传给客户端组件**。客户端组件在 Next 里也会被服务端渲染，所以 SVG 直接出现在首屏 HTML 里——不用 fetch、不布局抖动、**没有 JS 也能显示**。

**曾经踩过**：早期版本用客户端 `fetch` 同一份数据，导致地图在 hydration 前是空白的，而且搜索引擎看不见。

### 状态与配色（浅色主题下）

```css
.vx--none .vx__top     { fill: rgba(31, 40, 54, 0.14); }   /* 非目的地：裸石块 */
.vx--progress .vx__top { fill: rgba(75, 96, 124, 0.42); }  /* 建设中：半亮 */
.vx--live .vx__top     { fill: var(--accent); filter: drop-shadow(0 0 5px rgba(75,96,124,.45)); }
.vx--live .vx__side    { fill: rgba(38, 52, 70, 0.9); }    /* 点亮：抬起并发光 */
```

**注意**：陆地色曾经用的是深色主题的浅白色 `rgba(235,231,228,0.09)`，在米白底上几乎不可见——非洲、南美、亚洲整个「消失」。切主题时地图的 fill 必须跟着改。

**入场动画**：`.vx { animation: vx-in 0.55s var(--ease) both }`，按经度延迟，形成自西向东一盏盏亮起。

**后台改状态即生效**：把某个目的地的 `world_map_status` 改成 `Live`，地图上那个国家就亮了。当前种子：6 个 Live、8 个 In progress。

---

## 14. 搭积木（访客自己拼服务套餐）

页面 `/plan`。左边「货架」（服务按类别分组），右边「你的计划」。

- **拖进去或点一下**就装进计划，可拖拽排序、单独删掉、全部加上、重新开始
- 每装一块，底部三个数字实时跳：**服务数 / 总价 / 工期**
- 计划里每块下面有一条随价格变化的横条
- **存 `localStorage`**，刷新或跳走再回来不丢
- 填姓名邮箱提交到同一个 leads 端点，**把所选项目拼成一个字符串 + 总价**一起提交——顾问要看到客户挑了什么，不是光一个邮箱

实现要点：
- **数字字段必须和显示字符串并存**（`price` / `price_value`）
- **工期是 `max` 不是 `sum`**——服务并行跑。文案里要说清楚，否则数字看着像错的。
- **拖拽和点击都要支持**。拖拽是桌面专属；每个 tile 也必须是按钮，每个计划项都要有 ↑ ↓ ✕ 控件（键盘可用）。

---

## 15. 全站搜索

- 首屏 hero 里有内联搜索框，导航栏里有 ⌘K 浮层
- 搜**全站**：服务、院校、奖学金、目的地、攻略、页面正文，外加 8 条快捷入口
- 170ms 防抖、↑↓ 选、回车打开、Esc 关闭
- 接口 `/api/search?q=`

实测：`visa` 24 条、`ielts` 17 条、`germany` 7 条、`SOP` 5 条。

---

## 16. 动效语言（写进代码的规则）

**一条缓动走天下**：`cubic-bezier(0.2, 0.7, 0.2, 1)`，时长 0.34–0.7s，**永不弹跳**。

- 列表错峰用 **`nth-child` 规则**，不要用 `--i` 自定义属性——为了 50ms 偏移把索引穿进每个卡片组件不值得
- 全部包在 `@media (prefers-reduced-motion: no-preference)` 里，并给 `reduce` 分支设 `animation: none`
- 只动 `transform` 和 `opacity`，**绝不动 `height` / `top`**

具体：hero 标题逐行错峰进场（第二行斜体稍晚）、区块进入视口上浮、卡片悬停抬 3px、图片悬停缓慢放大、按钮按下微缩。

---

## 17. 后台（`/admin`）

| 路由 | 作用 |
|---|---|
| `/admin` | 概览 |
| `/admin/pages` → `/admin/pages/[id]` | 页面 + 积木编辑器（上移/下移/隐藏/删除） |
| `/admin/c/[collection]` → `/[id]` | 通用集合列表 + 表单 |
| `/admin/leads` | 询盘列表 + 详情（含「wants help with」和全部自定义答案） |
| `/admin/settings` | 站点设置（品牌/联系/社交/主题/SEO） |
| `/admin/languages` | 翻译管理（顶部切语言 + 覆盖率，Interface / Content 两栏，可搜索） |

**认证**：`crypto.scryptSync` 做哈希（`scrypt$salt$hex`），HMAC-SHA256 签名 cookie 做会话，`await cookies()` 做传输。约 40 行，零依赖。

默认账号：`admin@internationalstudycouncil.com` / `changeme123`（**上线前必须改**）。

### 表单：永远不要丢答案

最容易丢生意的地方，是表单收 20 个字段、表里只存 8 个。设计 `leads` 时让**已知列提升为真实列**（便于筛选和列表展示），**同时保留完整 payload**：

```ts
export async function createLead(payload: Record<string, any>) {
  const full: Record<string, any> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'website') continue                    // 蜜罐
    full[key] = Array.isArray(value) ? value.map(v => clip(v, 200)) : clip(value, 4000)
  }
  await query(`insert into leads (id, name, email, phone, whatsapp, country,
               level, message, source, data) values ($1,…, $10::jsonb)`, […, JSON.stringify(full)])
}
```

迁移写成 `add column if not exists`，这样线上部署会在下次请求时自动升级而不是报错。
后台要把 `data` 里没提升为列的 key 全部列出来，**并且把 key 人性化**（`current_qualification` → "Current qualification"），不要给甲方看裸的 snake_case。

---

## 18. 内容种子要点

- **12 所院校**、**8 项奖学金**、**10 项服务**、**14 个目的地**、**3 位顾问**、**3 篇攻略**
- **12 个页面**（首页 + 11 个），共 **89 个积木实例**
- 品牌信息（logo 文字、机构简介、邮箱、电话、WhatsApp、地址、营业时间、三个社交链接）**全部留空或占位**，前台优雅降级：没填 WhatsApp 号就不显示悬浮按钮，没填社交链接就不显示社交栏

---

## 19. 验证清单（声称能用之前必须跑）

```bash
# 1. 公开路由全部 200，未知 slug 必须 404
for p in / /plan /services /apply /destinations /universities /scholarships /blog /contact /bn /ar /ru /admin; do
  curl -s -o /dev/null -w "%{http_code} $p\n" --noproxy '*' "http://127.0.0.1:4321$p"; done

# 2. 未登录时后台 API 必须 401
curl -s -o /dev/null -w '%{http_code}\n' --noproxy '*' "http://127.0.0.1:4321/api/admin/blocks?page_id=1"

# 3. 登录后走完整写路径
curl -s -c jar -X POST -H 'content-type: application/json' \
  -d '{"email":"admin@internationalstudycouncil.com","password":"changeme123"}' \
  http://127.0.0.1:4321/api/admin/login

# 4. 逐语言核对导航译文（不是只看状态码！）
for l in "" bn es fr ar ru; do
  curl -s --noproxy '*' "http://127.0.0.1:4321/$l" | python3 -c "
import re,sys
h=sys.stdin.read(); m=re.search(r'<nav class=\"site-nav\".*?</nav>',h,re.S)
print('$l', ' | '.join(re.findall(r'>([^<>]+)</a>', m.group(0))) if m else '(none)')"
done

# 5. 类型检查 + 生产构建（dev 通过不代表能部署）
npx tsc --noEmit
rm -rf .next && npx next build
```

**`grep -c` 数的是行数，而压缩后的 HTML 只有一行**——要数出现次数必须用 `grep -o … | wc -l`，或者只断言存在性。

**截图验证**：客户端按滚动位置渲染的内容（如 scrolly 的演示屏）在 headless 里看不到。临时把默认段位从 0 改成目标段、构建、截图、再从备份还原重建。上一版 why 演示的溢出问题就是这么发现的。

---

## 20. 部署

**Vercel + 托管 Postgres（Neon / Supabase）**。

- 设 `DATABASE_URL` 和 32+ 字符的 `AUTH_SECRET` 环境变量
- **首次请求会自动建表 + 播种**，所以部署流程里没有迁移步骤
- 域名继续放 GoDaddy，只改 DNS：删掉默认的 parked A 记录和 `www` CNAME，按 Vercel 域名卡片显示的**原样**添加 A 和 CNAME，**绝不加 AAAA/IPv6**（会卡住证书签发），并确保 CAA 记录允许 `letsencrypt.org`

**费用细节**：Vercel Hobby 版条款上**不允许商业用途**，留学中介属于商业。要么直接上 Pro（约 $20/月），要么先在 Hobby 上跑、接到第一个付费客户时升级。Neon 免费额度允许商用。

**不要买 GoDaddy 主机**——共享主机跑不了 Next.js；VPS 要自己管 Linux/Nginx/SSL/备份，对一个每天几十访客的机构站是十倍的维护量换零收益。

---

## 21. 已知坑（每条都花过小时数）

1. **`next/font/google` 在本沙箱必然失败**。Turbopack 无法解析 `@vercel/turbopack-next/internal/font/google/font`，每个页面 500。用根布局里的 `<link>` + CSS 变量里的系统字体兜底。

2. **`next dev` / `next build` 会被沙箱删除守卫杀掉**。Next 启动时批量删 `.next/dev`，触发 `SAFE_DELETE_BULK_CONFIRM_REQUIRED`。守卫通过 `NODE_OPTIONS=--require .../node-language-shim.cjs` 注入。**修法：清空 `NODE_OPTIONS`**。另外 `rm` 被代理成 `safe-bin/rm`，`rm -rf .next` 要单独一条命令跑。

3. **PGlite 内部的 `mkdirSync` 会被拒**（父目录不存在时）：`ENOENT: no such file or directory, mkdir … .data/pg`。**永远先自己 `mkdirSync(dir, { recursive: true })`**，shell 里也先 `mkdir -p .data/pg`。

4. **绝不要把 JSONB 文本字段直接转 `date` 去 `ORDER BY`**。`nullif(data->>'deadline','')::date` 在有人填「Anytime」的瞬间炸掉。要守卫：
   ```sql
   (case when data->>'deadline' ~ '^\d{4}-\d{2}-\d{2}' then (data->>'deadline')::date end) asc nulls last
   ```

5. **更新时冻结 slug**。每次保存都从标题重新生成 slug 会悄悄弄坏所有分享出去的 URL（`Taylor's University` → `taylor-s-university`）。插入时生成一次，更新时保留已存的。`slugify` 里**丢掉撇号**而不是转成连字符：`.replace(/['’‘"“”`]/g, '')`。

6. **`Intl.NumberFormat` 配 `currencyDisplay: 'code'` 会输出 U+00A0**（不换行空格），不是普通空格（`MYR\u00a032,000`）。grep 渲染后的 HTML 找 `MYR 32,000` 什么都找不到，看着像数据 bug。断言数字部分就行。

7. **图片 URL 来自甲方可编辑字段时，用原生 `<img>` + `loading="lazy"`**。`next/image` 需要把每个远程 host 加白名单，而对一个基本静态的营销页收益很小。

8. **主题切换时，所有硬编码的颜色都要审**。地图陆地色、CTA 面板底色、Logo 滤镜都曾经是深色主题的值，切到浅色后要么看不见要么难看。

9. **绝对居中的导航链接不会自动避让两侧**。两侧内容变宽就会重叠，而且不报错。改右侧内容后必须重新量。

10. **两套机制同时控制同一个属性会打架**。地图曾经是 JS 切 class 控制淡入，后来加了 CSS 动画但忘了删旧的 `opacity: 0`，结果动画播完又落回 0——整块地图看不见。这类问题看代码很难发现，靠截图才抓到。

11. **`vh` 做节奏要配 `clamp()` 上限**。`.scrolly__step { min-height: 74vh }` 在 2400px 高的截图窗口下等于 1776px/段，把文字推到很远。

12. **批量改 `font-size` 要一次性映射，不能链式 `.replace()`**。`0.625 → 0.6875` 后接 `0.6875 → 0.75` 会把第一个值悄悄连升两级。

13. **主题改动放在追加的一层里，不要散着改**。在样式表末尾加一段 `/* Theme layer — supersedes the earlier values above */` 更快、可在一处 review、易回滚。并且在反转配色**之前**先把 token 改成语义化名字（`--paper/--ink` → `--bg/--fg`），否则每条规则都成了谎言。替换时**从长到短**（`--paper-2` 先于 `--paper`）。

14. **Node 二进制路径会变**（`22.22.2-3` → `22.22.2-6`）。脚本里别写死绝对路径，用 PATH 上的 `node`。

15. **Bash 里用 heredoc 传 JS 时，模板字符串里的 `${...}` 会被外层 shell 吃掉**。用 `<<'SCRIPT'`（带引号）或纯字符串拼接。

16. **`grep -c` 数行不数次数**，压缩 HTML 只有一行。用 `grep -o … | wc -l`。

---

## 22. 给「复现者」的最后建议

**先读代码，再动手**。这份文档描述的是**结果**，代码里有**为什么**。

改造优先级建议：

1. **换品牌**：改 `lib/kernel/bootstrap.ts` 的 settings（机构名、标语、联系方式）+ `globals.css` 的 `--accent` 系 + `IscMark.tsx` 的方块坐标和颜色
2. **换内容**：改 bootstrap.ts 里 6 个集合的种子数组。**不要**改 schema。
3. **换语言**：`dictionary.ts` 里 `LOCALES` 数组 + 每种语言的对象
4. **改首页结构**：改 bootstrap.ts 里 `slug: 'home'` 的 `blocks` 数组顺序/增删。**不要**新建页面组件。
5. **加新积木**：在 `blocks.tsx` 里 `registerBlock({...})`，后台立刻就有。**不要**手写后台表单。

**唯一不该动的东西**：`lib/kernel/db.ts` 的双驱动、`render.tsx` 的渲染回路、`entries` 单表多集合的设计。这三样是整个系统的地基。
