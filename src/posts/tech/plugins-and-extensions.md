---
title: "Plugins & Extensions — Example"
date: 2025-06-05
tags: ["example", "plugins", "remark"]
description: "Demonstrates spoilers, link cards, article links, and a trusted interactive article."
slug: "tech/markdown-extensions"
---

# Plugins & Extensions

This sample has the custom slug `tech/markdown-extensions`. Other articles can still link to its source filename, `./plugins-and-extensions.md`; the theme resolves the published URL for them.

<!-- more -->

## Spoilers

Here is ||blurred plain text|| and here is |||blacked-out plain text|||. Click either, or focus it and press Enter or Space, to reveal it.

Both forms are inline text. Keep the delimiters within one text span; they do not create a block container, and nested Markdown formatting is not supported inside them.

## Link cards

The following HTTP(S) link is the only item in its paragraph, so the theme can fetch its metadata and render a card:

[Astro](https://astro.build/)

This is an ordinary inline link to the [Astro documentation](https://docs.astro.build/). A failed metadata request keeps the original link and does not stop the build.

## Article links

Read the [Markdown basics](./markdown-basics.md) or jump to the [math examples](./math-and-katex.md#math-examples). Links resolve from this Markdown file, receive the deployment base, and participate in backlinks. A link to a known draft is rendered as plain text.

Hover previews preserve article formatting while removing scripts and interactive embeds. Open the complete article to try the counter below.

## Trusted interactive content

The button is an author-controlled HTML example. Its native `data-astro-rerun` script initializes on every visit through Astro's client router and disposes its listeners before navigation.

<button type="button" data-sample-counter>Count: 0</button>

<script data-astro-rerun>
  (() => {
    const button = document.querySelector('[data-sample-counter]')
    if (!button) return
    const controller = new AbortController()
    let count = 0
    button.addEventListener('click', () => {
      button.textContent = `Count: ${++count}`
    }, { signal: controller.signal })
    document.addEventListener('astro:before-swap', () => {
      controller.abort()
    }, { once: true, signal: controller.signal })
  })()
</script>

Review scripts in Markdown before publishing material from other authors. Full articles permit trusted HTML and JavaScript; sanitized previews are not a replacement for reviewing article source.
