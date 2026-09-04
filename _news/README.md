# Live status — how it works

This folder is your status feed. The newest `news_limit` items (set in
`_config.yml`, currently 6) appear on the about page under **news**, newest first.

There is no backend and no database. A status update is a file, and publishing one
is a git push — which is the only mechanism that stays free, stays fast in China,
and cannot break at 2am.

## Adding a status line

Create a new file in this folder. Name does not matter; the `date` field orders them.

```markdown
---
layout: post
date: 2026-09-15 09:00:00+0800
inline: true
related_posts: false
---

One sentence. Where you are, what you are working on, what just shipped.
```

Then, from PowerShell in the repo root:

```powershell
git add _news
git commit -m "status: <what changed>"
git push
```

Both deploys rebuild automatically. The site is live in ~2 minutes.

## inline: true vs false

- `inline: true` — the text renders directly in the feed. Use for one-liners.
- `inline: false` — the item becomes a linked headline with its own page. Use when
  you want to write more than a sentence. Add a `title:` field for these.

## Keeping it honest

A status feed that has not moved in eight months reads worse than no status feed.
Either update it monthly, or set `news: false` in `_config.yml` and drop the
section. A stale "currently commissioning" line dated last year is the single
most common way these sites damage the impression they are meant to create.
