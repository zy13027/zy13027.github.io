# zinanyang.com

Source for my personal site — robotics and motion control engineering.

**Live:** [zy13027.github.io](https://zy13027.github.io) · [zinanyang.com](https://zinanyang.com) (China mirror, once the ICP filing clears) · [中文](https://zy13027.github.io/zh/)

## How it works

Built with [al-folio](https://github.com/alshedivat/al-folio) on Jekyll. A push to `main` builds the site once in GitHub Actions, then publishes the same artefact to two places in parallel: GitHub Pages for visitors outside mainland China, and an nginx server in Beijing for visitors inside it. Third-party libraries and fonts are vendored at build time so nothing depends on hosts that are slow or blocked in the mainland.

## Layout

| Path | What lives there |
|---|---|
| `_pages/about.md` | Front page |
| `_pages/zh.md` | 中文 version |
| `_projects/` | One file per project, shown as cards on `/projects/` |
| `_news/` | Short status lines; the newest few appear on the front page |
| `_data/cv.yml` | Structured CV rendered at `/cv/` |
| `_config.yml` | Site settings — name, description, feature switches |
| `.github/workflows/deploy.yml` | Build and both deploys |

## Adding things

A project is a Markdown file in `_projects/` with `title`, `description`, `category` and `importance` in the front matter. A status update is a file in `_news/` with a `date`. Push, and both deploys pick it up within a few minutes.

Setup and deployment notes are in [SETUP.md](SETUP.md).

## Licence

Theme under MIT, inherited from al-folio. Site content © Zinan Yang.
