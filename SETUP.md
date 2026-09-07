# Setup and deployment

How this site is built, where it runs, and how to work on it. Nothing in this
file is secret; credentials live in GitHub Actions secrets and on the machines
that need them, never in the repo.

---

## Architecture

```
push to main
    │
    ▼
GitHub Actions ── build (Ruby + Node/Tailwind + Python) ── one _site artefact
    │
    ├──► GitHub Pages            https://zy13027.github.io      (境外 visitors)
    │
    └──► rsync over SSH ──► nginx on an 阿里云 ECS in 北京        (境内 visitors)
                                 served at zinanyang.com once ICP 备案 clears
```

One build, two edges. DNS decides which edge a visitor reaches. The China half
exists because GitHub Pages is slow and unreliable from the mainland, and a
mainland server needs an ICP 备案 — which needs a domain, a qualifying 阿里云
resource, and a filing with the 北京管局.

---

## The theme

[al-folio](https://github.com/alshedivat/al-folio) **v1.x**. This matters: v1
is a thin starter whose layouts and includes ship as Ruby gems (`al_folio_core`
and friends), not as files in this repo. Consequences:

- `_config.yml` is al-folio's own, lightly patched. Don't replace it wholesale;
  the gems expect its full key set.
- There is no `_layouts/` or `_includes/` to edit. Theme changes go through
  config switches or gem overrides.
- The build needs Node (Tailwind runs at build time) and Python (`nbconvert`
  for the Jupyter plugin) as well as Ruby. The workflow installs all three.
- `third_party_libraries.download: true` vendors every CDN library and Google
  Fonts into the build, so the site loads without touching jsDelivr or
  fonts.googleapis.com — both unreliable or blocked in the mainland.

Pulling theme updates later: `git fetch upstream && git merge upstream/main`
(the `upstream` remote points at alshedivat/al-folio). Expect conflicts in
`_config.yml`; keep your values.

---

## Working locally

Ruby 3.3 with Devkit, Node 20, Python 3 — or skip all of it and let CI build.

```powershell
bundle install
npm ci
bundle exec jekyll serve --livereload
```

http://localhost:4000. Behind a slow connection to rubygems.org:
`bundle config mirror.https://rubygems.org https://gems.ruby-china.com`.

---

## Content

| Want to… | Do this |
|---|---|
| Change the front page | edit `_pages/about.md` |
| Change the Chinese page | edit `_pages/zh.md` |
| Add a project | new file in `_projects/`, copy an existing one's front matter |
| Post a status line | new file in `_news/` with a `date` — newest few show on the front page |
| Update the CV | edit `_data/cv.yml` |
| Change the photo | replace `assets/img/prof_pic.jpg` (square, ≥800 px, EXIF stripped) |
| Add social links | `_data/socials.yml` |

Push to `main` and both deploys run. Live in three to five minutes.

---

## Deployment

### GitHub Pages

Repository → Settings → Pages → Source: **GitHub Actions**. Nothing else.
The `deploy` job uploads the built artefact through `actions/deploy-pages`.

### 阿里云 ECS

The `deploy-ecs` job downloads the same artefact and rsyncs it to
`/var/www/zinanyang/` on the server as an unprivileged `deploy` user, then
checks the server answers HTTP 200.

It needs three repository secrets (Settings → Secrets and variables → Actions):

| Secret | Value |
|---|---|
| `ECS_HOST` | the server's public IP |
| `ECS_USER` | `deploy` |
| `ECS_SSH_KEY` | the private half of a key whose public half is in the server's `/home/deploy/.ssh/authorized_keys` |

Set them from the CLI so the key never crosses a clipboard or a chat window:

```powershell
Get-Content "$HOME\.ssh\deploy_zinanyang" -Raw | gh secret set ECS_SSH_KEY -R zy13027/zy13027.github.io
```

Server-side, one-time (already done):

- Alibaba Cloud Linux 3, nginx serving `/var/www/zinanyang`, config in
  `/etc/nginx/conf.d/zinanyang.conf`
- The marketplace image's Docker stack (Harbor, nginx-proxy-manager, Portainer)
  stopped and disabled — it was holding ports 80/443 and exposing admin UIs
- `deploy` user, key-only login, owns the web root
- The image's umask is 027, so the workflow forces `--chmod=D755,F644` on rsync;
  without it nginx can't read the files and every page 404s
- Security group: inbound TCP 22, 80, 443

Rotate the deploy key without a console visit — install the new public key
using the old private one, verify, then delete the old files:

```powershell
ssh-keygen -t ed25519 -f "$HOME\.ssh\deploy_new" -C "github-actions-deploy"
Get-Content "$HOME\.ssh\deploy_new.pub" | ssh -i "$HOME\.ssh\deploy_zinanyang" deploy@<host> "cat > ~/.ssh/authorized_keys"
ssh -i "$HOME\.ssh\deploy_new" deploy@<host> 'echo ok'
```

### 阿里云 API access (optional)

A RAM user `agent-site-ops` with a custom policy — read on ECS/VPC/DNS/billing,
start/stop/reboot on the one instance, DNS record edits on zinanyang.com only —
drives the `alibaba-cloud-ops` MCP server from Claude Desktop. Never use a root
AccessKey or `PowerUserAccess`; if the scoped key leaks, the worst case is a
rebooted server and a broken DNS record.

---

## ICP 备案

Filed through 阿里云 as 无主体新增服务 under an existing 主体 (there was already
a 京ICP备 number registered to the same person). Key facts for anyone
maintaining this:

- **The filing is tied to the ECS instance.** If the instance is released or
  lapses, the 备案 can be 注销. Auto-renew is on; keep it on.
- **网站名称** is an administrative label with rules that vary by 管局. Beijing
  rejects 空间, 资讯, 网络, 博客 and industry words; personal names are fine.
- **公安联网备案** is a second, separate filing due within 30 days of going
  live. 阿里云 was authorised to push the data automatically after approval.
- Once the ICP number is issued, add it and the 公安 number to `footer_text` in
  `_config.yml`, linked to beian.miit.gov.cn and beian.mps.gov.cn respectively.
- 网站语言 was filed as 中文简体 only. The site is English-primary with `/zh/`;
  a 变更备案 to add 英文 is the tidy fix, and can be done after approval.

DNS goes live only after approval: an A record for `zinanyang.com` on the
境内 line pointing at the ECS, a CNAME on the 境外 line pointing at
`zy13027.github.io`. Add the custom domain in GitHub Pages settings at the
same time so it serves the right certificate.

---

## Things learned the hard way

- Read the theme's own `_config.yml` and `deploy.yml` before replacing them.
- `git add -A` in a folder that also receives browser downloads will commit
  whatever the browser dropped there. Stage by path. `.gitignore` now blocks
  阿里云 console exports, which contain AccessKeys.
- Anything labelled PRIVATE or SECRET never goes into a chat window, a
  screenshot, or a terminal on the wrong machine. `.pub` files, key IDs,
  instance IDs and IPs are fine.
- GitHub over HTTPS from mainland China resets constantly. SSH works.
- Phone photos carry GPS in EXIF. Strip it before committing.
