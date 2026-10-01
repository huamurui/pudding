---
title: "Markdown Basics — Example"
date: 2025-06-01
tags: ["tech","markdown","example"]
description: "A simple Markdown file demonstrating headings, lists, links and images."
pinned: true
---

# Markdown Basics

This is a short article to test basic Markdown rendering in the theme.

## Headings

Use multiple heading levels to verify styles:

### H3 example

#### H4 example

## Lists

- Unordered item one
- Unordered item two
  - Nested item

1. Ordered item one
2. Ordered item two

## Links and images

Here is a link to the [theme repository](https://github.com/huamurui/pudding), kept inline as an ordinary link.

Read the [feature showcase](./theme-showcase.md) and [code samples](./code-samples.md). These links resolve from the Markdown source directory and work when the site is hosted under `/pudding`.

<!-- more -->

## Excerpts

The `<!-- more -->` marker above ends the rich home-page excerpt. Without a marker, the theme uses the first paragraph or list. A frontmatter description is used for metadata and RSS.

## Tables and quotes

| Feature | Example |
| --- | --- |
| Emphasis | **bold** and *italic* |
| Inline code | `pnpm build` |

> A regular blockquote needs no custom plugin. Admonition container syntax is not configured by this theme.

End of basics.
