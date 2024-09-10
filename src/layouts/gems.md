---
back: ["/", "Home"]
layout: app.html
---

**Pronunciation:** {{pronunciation}}

<p>
<img width="128" height="128" src="/img/illustrations/{{page.fileSlug}}/thumb@256x256.webp" alt="Thumbnail" loading="lazy" style="background-image: url(/img/illustrations/{{page.fileSlug}}/thumb@16x16.webp); background-repeat:no-repeat;background-size: cover;">
</p>

{% include "world.html.liquid" %}

{{ content }}
