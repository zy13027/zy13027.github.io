# Personal site — build and deploy runbook

Target: an al-folio academic-style homepage, served fast **both** inside and
outside mainland China, updated by `git push`.

---

## Architecture

```
                    your repo (main branch)
                            |
                   GitHub Actions builds Jekyll once
                            |
              +-------------+-------------+
              |                           |
      GitHub Pages artefact        deploy-cn branch
              |                           |
      GitHub Pages CDN            EdgeOne Pages (国内版)
              |                           |
      yourdomain.com                yourdomain.com
      (境外 DNS line)                (境内 DNS line)
```

One domain, one build, two edges. DNS decides which edge a visitor reaches based
on where they are.

**Why the split.** EdgeOne Pages has **no Ruby runtime** and cannot build Jekyll.
It can serve static files perfectly well, so GitHub Actions does the build and
pushes the finished `_site` to a `deploy-cn` branch that EdgeOne serves verbatim.
This is the standard pattern for Jekyll on EdgeOne — do not waste an evening
trying to get EdgeOne to run `bundle exec jekyll build`.

---

## Phase 0 — Get the repo (30 minutes)

1. Fork **https://github.com/alshedivat/al-folio** on GitHub.
2. Rename the fork to `<your-github-username>.github.io`.
3. Clone it:

```powershell
git clone https://github.com/<your-github-username>/<your-github-username>.github.io.git
cd <your-github-username>.github.io
```

4. Copy the files from this bundle over the fork, replacing what is there:

```powershell
# adjust the source path to wherever you saved this bundle
$src = "<path-to>\personal-site"
Copy-Item "$src\_config.yml"            -Destination . -Force
Copy-Item "$src\_pages\*"               -Destination .\_pages\ -Force
Copy-Item "$src\_projects\*"            -Destination .\_projects\ -Force
Copy-Item "$src\_news\*"                -Destination .\_news\ -Force
Copy-Item "$src\.github\workflows\deploy.yml" -Destination .\.github\workflows\ -Force
```

5. Delete al-folio's demo content so it does not ship as yours:

```powershell
Remove-Item .\_projects\1_project.md, .\_projects\2_project.md -ErrorAction SilentlyContinue
Remove-Item .\_posts\* -Recurse -ErrorAction SilentlyContinue
Remove-Item .\_bibliography\papers.bib -ErrorAction SilentlyContinue
```

6. Add your photo as `assets/img/prof_pic.jpg` (square, ≥ 800 px).

7. Work through `_config.yml` and `_pages/about.md` replacing every
   `<ANGLE BRACKET>` placeholder. Search for `<` to find them all.

---

## Phase 1 — Preview locally (1 hour, once)

You need Ruby. On Windows:

1. Install **Ruby+Devkit 3.3.x (x64)** from https://rubyinstaller.org/downloads/
   — take the version *with* Devkit, and let the installer run `ridk install`
   (choose option 3, MSYS2 and MINGW development toolchain).
2. Restart PowerShell, then:

```powershell
ruby -v          # expect 3.3.x
gem install bundler
bundle install   # first run takes several minutes
bundle exec jekyll serve --livereload
```

Open http://localhost:4000. Edits rebuild on save.

**If `bundle install` fails behind a corporate proxy or is slow in China:**

```powershell
bundle config mirror.https://rubygems.org https://gems.ruby-china.com
bundle install
```

**If you would rather not install Ruby at all:** skip this phase. Push to a
branch, let GitHub Actions build it, and review the result on the GitHub Pages
URL. Slower feedback loop, zero local setup.

---

## Phase 2 — GitHub Pages (live the same day)

1. Push:

```powershell
git add -A
git commit -m "Initial site"
git push origin main
```

2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Settings → Actions → General → Workflow permissions:** set to
   **Read and write permissions**. The workflow needs this to push `deploy-cn`.
4. Watch the **Actions** tab. First run takes ~3–5 minutes.

Live at `https://<your-github-username>.github.io`.

That is your overseas link and it works now. Everything below is about making it
fast inside China.

---

## Phase 3 — Domain and 备案 (start today, takes 2–4 weeks)

This is the long pole. Start it the same day you start Phase 1 — the paperwork
runs in parallel with everything else.

### 3.1 Buy the domain

Register through **腾讯云 (DNSPod)** or **阿里云万网**. Registering through the
same provider you will host with removes a lot of friction later.

⚠️ **The TLD must be MIIT-approved or 备案 is impossible.** Safe: `.com`, `.cn`,
`.net`, `.com.cn`, `.top`, `.xyz`. Not approved (do not buy): `.io`, `.dev`,
`.me`, `.ai`, and most new gTLDs. Check the current approved list before paying —
this list changes and getting it wrong means buying a second domain.

Complete **域名实名认证** immediately after purchase. 备案 cannot begin until
real-name verification has passed, which itself takes 1–3 days.

Cost: roughly ¥30–90/year for `.com` or `.cn`.

### 3.2 Buy a qualifying resource

备案 itself is free, but the 管局 requires you to hold a qualifying mainland
hosting resource with the provider handling your filing. The cheapest reliable
route is **轻量应用服务器, 3-month minimum** (~¥100–300). You will not actually
run the site on it — it exists to satisfy the filing requirement and to issue
your **备案服务码**.

Check at the time of purchase whether your EdgeOne plan issues a 备案服务码
directly; if it does, you can skip the 轻量服务器. This changes periodically.

### 3.3 Submit 备案

In the 腾讯云/阿里云 备案 console (both have a mobile app that makes this much
easier):

**You will need:** 身份证 front and back · face verification in the app ·
mainland mobile number · a mainland address · 域名证书 (auto-attached) ·
备案服务码 · 网站名称 · 电子核验单 (signed in-app)

**Timeline:** 1–3 days provider review → 7–20 working days 管局 review. Some
provinces are faster. You will get an SMS when it passes.

**⚠️ 网站名称 is where personal filings get rejected.** Most 管局 reject site
names that are a personal name, and reject anything implying a company, media
outlet, or organisation. Names containing 科技/网络/传媒/工作室 are usually
rejected for a 个人 filing. Something neutral and descriptive like
`自动化技术笔记` or `工业控制学习笔记` passes. Do not describe the site as a
portfolio or CV — that reads as commercial to some reviewers.

**⚠️ Content rules.** A 个人备案 site may not carry commercial content, paid
services, or anything that looks like a company presence. A personal technical
site with projects and notes is fine. A page saying "hire me for consulting,
contact for rates" is not.

### 3.4 公安联网备案

Within **30 days** of the site going live, file at https://beian.mps.gov.cn.
Separate from the MIIT filing and easy to forget — miss it and the site can be
taken down. Both filing numbers must be displayed in the site footer with a link
back to the respective portals. Add them to `footer_text` in `_config.yml`:

```yaml
footer_text: >
  <a href="https://beian.miit.gov.cn/" target="_blank">京ICP备XXXXXXXX号-1</a> ·
  <a href="https://beian.mps.gov.cn/" target="_blank">京公网安备 XXXXXXXXXXXX号</a>
```

---

## Phase 4 — EdgeOne Pages (30 minutes, after 备案 passes)

1. Go to the **EdgeOne Pages** console (国内版, `edgeone.cloud.tencent.com`).
2. **Create project → Import from GitHub**, authorise, select your repo.
3. Configure:
   - **Production branch:** `deploy-cn`  ← not `main`
   - **Framework preset:** None / Static
   - **Build command:** *(leave empty)*
   - **Output directory:** `.` (a single dot)
   - **Root directory:** *(leave empty)*
4. Deploy. It should finish in seconds — it is only copying files.
5. **Custom domain → Add**, enter your 备案-passed domain, and follow the CNAME
   instructions. EdgeOne issues a free TLS certificate automatically.

### 4.1 Split DNS — one domain, both edges

In DNSPod, create two CNAME records on the same hostname with different lines:

| Host | Type | Line (线路) | Value |
|---|---|---|---|
| `@` or `www` | CNAME | 境内 / 默认 | *(the EdgeOne CNAME target)* |
| `@` or `www` | CNAME | 境外 | `<your-github-username>.github.io` |

Mainland visitors resolve to EdgeOne; everyone else resolves to GitHub Pages.
Same content, because both are built from the same commit.

The free DNSPod plan supports 默认/境内/境外 lines. If you would rather not
bother, point the domain entirely at EdgeOne — overseas performance from EdgeOne
is acceptable, just not as good as GitHub Pages is for overseas.

---

## China-specific gotchas already handled in this bundle

| Gotcha | Where it is handled |
|---|---|
| Google Fonts blocked in mainland — hangs page load ~10 s | `enable_google_fonts: false` in `_config.yml` |
| Absolute `url:` hard-codes one domain into canonical links and breaks the dual deploy | `url:` and `baseurl:` left empty |
| EdgeOne cannot build Jekyll | Workflow builds it and pushes `deploy-cn` |
| Google Analytics unreliable domestically | Left blank; use Baidu 统计 or Umami if you want numbers |
| Gitee Pages discontinued for individuals (2024) | Not used — do not plan around it |

Two more to watch that this bundle cannot fix for you:

- **MathJax, Font Awesome and other CDN assets.** al-folio pulls several from
  jsDelivr and unpkg. jsDelivr's mainland performance has been unreliable since
  its China licence lapsed. If the site loads slowly from a domestic network,
  this is the first thing to check in DevTools → Network. The fix is to vendor
  those assets into `assets/` and serve them from your own domain.
- **Images.** Photographs straight off a phone are 3–8 MB each and will dominate
  load time. Resize to ≤ 1600 px and export as WebP before committing.

---

## Daily use

Adding a project:

```powershell
# create _projects/4_something.md, copy the front matter from an existing one
git add _projects
git commit -m "Add <project> project"
git push
```

Adding a status line: see `_news/README.md`.

Both deploys rebuild automatically on every push to `main`. Live in ~2–3 minutes.

---

## Before you publish — confidentiality check

You work on customer machines. Before each push, confirm the diff contains none
of:

- Customer or end-user company names, site locations, or machine designations
- TIA Portal project files, `.ap20`/`.ap1x` exports, VCI trees, or SCL source
- HMI screenshots, runtime screen captures, or panel photographs
- Fault logs, trace exports, or V-ASSISTANT captures identifiable to a site
- Recognisable machine photographs from a customer's factory floor

Describe the **problem class**, your **approach**, and the **outcome in
numbers**. That is what demonstrates competence, and none of it is anyone's
confidential information. Where you are unsure whether something is covered by
an NDA, assume it is — a site is public forever and screenshots outlive
employment.

If your contract has an outside-activities or publication clause, read it before
the first push rather than after.

---

## Realistic timeline

| Day | What |
|---|---|
| 0 | Fork, customise, push. Live on GitHub Pages. Buy domain, start 实名认证. |
| 1–3 | 实名认证 passes. Buy 轻量服务器. Submit 备案. |
| 3–6 | Provider review. Meanwhile: write your real project entries. |
| 10–25 | 管局 review. SMS on approval. |
| +1 day | EdgeOne project, custom domain, split DNS. Both links live. |
| +30 days | 公安联网备案 filed. Footer updated. Done. |

---

## Sources

- [阿里云 ICP备案流程概述](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/icp-filing-application-overview)
- [阿里云 个人网站ICP备案](https://help.aliyun.com/zh/icp-filing/basic-icp-service/getting-started/quick-start-for-icp-filing-for-personal-websites)
- [阿里云 备案所需资料](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/required-materials)
- [EdgeOne Pages 快速构建和部署](https://edgeone.cloud.tencent.com/pages/document/162936669376004096)
- [使用 GitHub Action 部署 Jekyll 静态站点到 EdgeOne](https://www.2f0.cn/01-edgeone-jekyll-deploy/)
- [al-folio](https://github.com/alshedivat/al-folio)
- [Gitee Pages 下线说明](https://blog.csdn.net/coco2d_x2014/article/details/141095868)
