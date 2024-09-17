---
title: Home
toc: false
suggestions: false
canonical: https://www.gemmms.com/en
eleventyExcludeFromCollections:
  - {{ locale }}
---

Welcome to Gemmms! Explore and discover content that speaks to you. Dive in, explore, and find what resonates. Enjoy your stay!

## Directory
{%- assign suggestions = collections.gems | alphabetic -%}
{% for page in suggestions %}
  * [{{ page.data.title }}]({{ page | toUrl }})
{%- endfor %}

## Astrology
{%- assign suggestions = collections.astrology | alphabetic -%}
{% for page in suggestions %}
  * [{{ page.data.title }}]({{ page | toUrl }})
{%- endfor %}
