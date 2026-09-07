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
    </div>

    {%- comment -%}
      Full-width band, not a side column. The diagram is authored on a 1200px
      canvas; in a ~440px column its labels render at 4px and it reads as a grey
      smudge. Served as SVG so it stays sharp at any size, and given its own
      horizontal scroll on phones so it can be swiped at a legible scale rather
      than shrunk to nothing.
    {%- endcomment -%}
    {% if featured.diagram %}
      <figure class="zy-featured-figure">
        <div class="zy-figure-scroll">
          <img src="{{ featured.diagram | relative_url }}"
               alt="{{ featured.diagram_alt | default: featured.title }}"
               width="1200" height="960" loading="lazy" decoding="async">
        </div>
        <figcaption class="zy-mono zy-figcap">
          <span>Planned architecture<span class="zy-figcap-hint"> — swipe to pan</span></span>
          <a href="{{ featured.diagram | relative_url }}" target="_blank" rel="noopener">open full size&nbsp;↗</a>
        </figcaption>
      </figure>
    {% elsif featured.img %}
      <div class="zy-featured-figure">
        {% include figure.liquid loading="eager" path=featured.img class="zy-hero-img" sizes="(min-width: 992px) 880px, 95vw" alt=featured.title %}
      </div>
    {% endif %}

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
