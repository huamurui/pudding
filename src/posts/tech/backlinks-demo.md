---
title: "双向链接与引用关系演示 (Backlinks)"
date: 2025-06-11
tags: ["tech", "backlinks", "showcase"]
description: "这篇文章演示了 Astro Pudding 主题强大的反向链接功能。"
---

在这篇文章中，我们会放置一个链接指向主打演示文章：[欢迎使用 Pudding 主题：功能展示](./theme-showcase.md)。

运行 `pnpm build` 后，通过上面的链接跳转到展示文章并滚动到底部，可以看到自动生成的 **时间线引用区域**，其中包含当前这篇文章的卡片。引用数量取决于有多少篇已发布文章指向它。

**原理解析：**
Astro Pudding 的构建脚本会自动扫描所有 Markdown 文章中的本地链接，并将它们组织成图谱结构。当文章 B 引用了文章 A，文章 A 的底部就会自动显示来自文章 B 的“反向链接”（Backlinks）。这非常适合用来构建类似于个人数字花园（Digital Garden）或维基（Wiki）的知识库。

也支持 [引用式链接][extensions]。这个目标文件设置了自定义 slug，链接仍使用源 Markdown 路径，无需手动维护生成后的 URL。草稿、自引用和外部链接不会产生反向链接。

[extensions]: ./plugins-and-extensions.md#article-links
