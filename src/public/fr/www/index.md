---
title: Bienvenue sur Mon Blog
---

## Articles
{%- assign suggestions = collections[locale] | alphabetic -%}
{% for page in suggestions %}
  * [{{ page.data.title }}]({{ page | toUrl }})
{%- endfor %}
