---
title: "双向链接与引用关系演示 (Backlinks)"
date: 2025-06-11
tags: ["tech", "backlinks", "showcase"]
description: "这篇文章演示了 Astro Pudding 主题强大的反向链接功能。"
---

在这篇文章中，我们会故意放置一个链接指向我们的主打演示文章：[欢迎使用 Pudding 主题：功能展示](./theme-showcase)。

当你通过上面的链接跳转到那篇展示文章，并滚动到底部时，你会发现一个自动生成的 **时间线引用区域**，上面会显示“1 篇文章引用”，并附带当前这篇《双向链接与引用关系演示》文章的卡片！

**原理解析：**
Astro Pudding 的构建脚本会自动扫描所有 Markdown 文章中的本地链接，并将它们组织成图谱结构。当文章 B 引用了文章 A，文章 A 的底部就会自动显示来自文章 B 的“反向链接”（Backlinks）。这非常适合用来构建类似于个人数字花园（Digital Garden）或维基（Wiki）的知识库。
