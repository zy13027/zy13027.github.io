---
layout: default
title: lab
permalink: /lab/
description: Interactive notes on control, robotics and the Siemens motion stack.
nav: true
nav_order: 3
---

{%- comment -%}
  Each row opens a standalone page from lab/<slug>/, built from its source in
  _lab/<slug>/ by `npm run lab:build`. The list itself is _data/lab.yml.
{%- endcomment -%}

<div class="zy-lab">

  <header class="zy-page-head">
    <div class="zy-eyebrow">Lab</div>
    <h1 class="zy-h1 zy-h1-page">{{ page.description }}</h1>
    <p class="zy-lede zy-lede-page">Single-page simulators and field guides I built while learning these systems. Everything runs in your browser; nothing is stored.</p>
  </header>

  {% for g in site.data.lab.groups %}
  <section class="zy-lab-group">
    <h2 class="zy-mono zy-label">{{ g.title }}</h2>
    <div class="zy-rows">
      {% for e in g.pages %}
        <a class="zy-row" href="{{ '/lab/' | append: e.slug | append: '/' | relative_url }}">
          <div class="zy-mono zy-row-meta">
            <div class="zy-row-cat">{{ e.kind }}</div>
            {% if g.unofficial %}<div>unofficial notes</div>{% endif %}
          </div>
          <div class="zy-row-body">
            <h3 class="zy-h3">{{ e.title }}</h3>
            <p class="zy-muted">{{ e.blurb }}</p>
            <div class="zy-mono zy-row-stack">{{ e.tags | join: ' · ' }}</div>
          </div>
        </a>
      {% endfor %}
    </div>
  </section>
  {% endfor %}

  <p class="zy-faint zy-small">The Siemens pages are unofficial reading aids built from publicly available manuals — not Siemens publications — and contain no customer projects or proprietary material. Each opens as its own page; the bar at its top links back here.</p>

</div>
