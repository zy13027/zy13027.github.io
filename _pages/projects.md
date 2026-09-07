---
layout: default
title: projects
permalink: /projects/
description: Navigation, motion control, and the tooling around them.
nav: true
nav_order: 2
---

{%- assign featured = site.projects | where: "featured", true | first -%}
{%- assign shipped = site.projects | where_exp: "p", "p.featured != true" | sort: "importance" -%}
{%- assign bl = site.data.buildlog -%}

<div class="zy-projects">

  <header class="zy-page-head">
    <div class="zy-eyebrow">Projects</div>
    <h1 class="zy-h1 zy-h1-page">{{ page.description }}</h1>
    <p class="zy-lede zy-lede-page">One project in progress, built in public. Three from four years of shipping motion control on production machines.</p>
  </header>

  {% if featured %}
  <article class="zy-card zy-featured">
    <div class="zy-featured-top">
      <div class="zy-featured-text">
        <div class="zy-meta-row">
          <span class="zy-mono zy-kicker">{{ featured.category }} · Featured</span>
          {% if featured.status %}<span class="zy-pill"><span class="zy-dot"></span>{{ featured.status }}</span>{% endif %}
        </div>
        <h2 class="zy-h2 zy-h2-featured"><a href="{{ featured.url | relative_url }}">{{ featured.title }}</a></h2>
        <p class="zy-muted">{{ featured.description }}</p>
        {% if featured.stack_line %}<div class="zy-mono zy-stackline"><span class="zy-faint">stack</span>&nbsp; {{ featured.stack_line }}</div>{% endif %}
      </div>
      <div class="zy-featured-media">
        {% if featured.img %}
          {% include figure.liquid loading="eager" path=featured.img class="zy-hero-img" sizes="(min-width: 700px) 440px, 95vw" alt=featured.title %}
        {% endif %}
      </div>
    </div>

    <div class="zy-featured-bottom">
      <div class="zy-featured-cell">
        <h3 class="zy-mono zy-label">What it demonstrates</h3>
        <ul class="zy-plain">
          {% for d in featured.demonstrates %}<li>{{ d }}</li>{% endfor %}
        </ul>
      </div>
      {% if bl %}
      <div class="zy-featured-cell zy-featured-cell-alt">
        <h3 class="zy-mono zy-label">Build log</h3>
        <ol class="zy-log zy-log-compact">
          {% for s in bl.steps %}
            <li class="zy-log-row is-{{ s.state }}">
              <span class="zy-mono zy-log-when">{{ s.when }}</span>
              <span class="zy-log-dot" aria-hidden="true"></span>
              <span class="zy-log-what">{{ s.what }}{% if s.state == 'current' or s.state == 'milestone' %} <span class="zy-mono zy-log-state-inline">{{ s.state }}</span>{% endif %}</span>
            </li>
          {% endfor %}
        </ol>
        <p class="zy-muted zy-small">My strongest robotics work dates from 2022. Rather than claim currency, I am rebuilding it in public with the current toolchain — the repository history is the evidence.</p>
      </div>
      {% endif %}
    </div>
  </article>
  {% endif %}

  <section class="zy-shipped">
    <h2 class="zy-mono zy-label">Shipped</h2>
    <div class="zy-rows">
      {% for p in shipped %}
        <a class="zy-row" href="{{ p.url | relative_url }}">
          <div class="zy-mono zy-row-meta">
            <div class="zy-row-cat">{{ p.category }}</div>
            {% if p.org %}<div>{{ p.org }}</div>{% endif %}
            {% if p.period %}<div>{{ p.period }}</div>{% endif %}
          </div>
          <div class="zy-row-body">
            <h3 class="zy-h3">{{ p.title }}</h3>
            <p class="zy-muted">{{ p.blurb | default: p.description }}</p>
            {% if p.stack_line %}<div class="zy-mono zy-row-stack">{{ p.stack_line }}</div>{% endif %}
          </div>
        </a>
      {% endfor %}
    </div>
    <p class="zy-faint zy-small">Siemens and Geely entries describe techniques only — no customer projects, source files or proprietary material.</p>
  </section>

</div>
