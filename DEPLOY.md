# 拾色卡片 · 部署指南

域名：`color.lihzh0124.xyz`
构建命令：`npm run build`
输出目录：`dist`

---

## 一、Cloudflare Pages（推荐）

纯前端项目，最适合 Cloudflare Pages 静态部署，免费、全球 CDN、手机访问快。

### 步骤

1. 把项目推到 GitHub 仓库。

2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → Create → Pages → Connect to Git。

3. 选择仓库，配置：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: 在 Environment Variables 中添加 `NODE_VERSION=20`

4. 点 Save and Deploy。首次构建约 1–2 分钟。

5. 部署成功后会得到一个 `xxx.pages.dev` 地址，可直接访问。

### 绑定自定义域名

1. Cloudflare Pages 项目 → Custom domains → Add custom domain。
2. 输入 `color.lihzh0124.xyz`。
3. 如果域名已经在 Cloudflare 管理，会自动添加 CNAME 记录。
4. 如果域名不在 Cloudflare，需要去域名注册商添加：
   ```
   类型: CNAME
   名称: color
   值: <your-project>.pages.dev
   TTL: Auto
   ```
5. 等待 DNS 生效（通常几分钟），HTTPS 自动配置。

### 自动部署

每次 push 到 main 分支会自动触发构建和部署。PR 会生成预览地址。

---

## 二、Vercel

### 步骤

1. 把项目推到 GitHub。

2. 登录 [vercel.com](https://vercel.com) → New Project → Import Git Repository。

3. 配置：
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Deploy。

### 绑定域名

1. Vercel 项目 → Settings → Domains → Add `color.lihzh0124.xyz`。
2. 按提示添加 CNAME 记录：
   ```
   类型: CNAME
   名称: color
   值: cname.vercel-dns.com
   ```
3. HTTPS 自动配置。

---

## 三、NAS 静态站点（Docker）

适合有 NAS（群晖、威联通等）的用户，内网或配合公网 IP / 反向代理使用。

### 方案 A：Nginx

```bash
# 构建
npm run build

# 用 docker-compose 启动（见项目根目录 docker-compose.yml）
docker-compose up -d
```

默认监听 8080 端口，访问 `http://<NAS-IP>:8080`。

### 方案 B：Caddy（自动 HTTPS）

如果有公网 IP 或已做内网穿透，Caddy 可以自动申请 Let's Encrypt 证书：

```bash
# 把 Caddyfile 和 dist 放到 NAS 上
docker-compose -f docker-compose-caddy.yml up -d
```

### docker-compose.yml 使用说明

1. 先在本地或 NAS 上执行 `npm run build` 生成 `dist` 目录。
2. 把 `dist` 目录和 `docker-compose.yml` 放到同一目录。
3. 运行 `docker-compose up -d`。
4. 用 `http://<NAS-IP>:8080` 访问。

---

## 四、子域名绑定总结

| 平台 | DNS 记录 | 值 |
|------|---------|---|
| Cloudflare Pages | CNAME | `<project>.pages.dev` |
| Vercel | CNAME | `cname.vercel-dns.com` |
| NAS（自有服务器） | A | NAS 公网 IP |

在域名注册商或 Cloudflare DNS 中添加以上记录即可。

---

## 五、注意事项

- `npm run dev` 仅用于开发调试，不要用于正式部署。
- 生产环境使用 `npm run build` 生成的 `dist` 静态文件。
- 项目是纯前端，不需要后端服务器或数据库。
- EXIF 读取在浏览器本地完成，不涉及隐私上传。
- Google Fonts 通过 CSS @import 加载，如果国内访问慢可替换为国内 CDN。
