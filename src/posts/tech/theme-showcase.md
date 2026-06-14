---
title: "欢迎使用 Pudding 主题：功能展示"
date: 2025-06-10
tags: ["tech", "showcase", "theme"]
description: "全面展示 Astro Pudding 模板提供的各种丰富特性：丰富的代码块语法高亮、数学公式排版、防剧透模糊块、外链卡片预览以及双向链接等。"
pinned: true
---

欢迎使用 **Astro Pudding**！这是一款极简、优雅且功能丰富的博客主题。本文旨在为你展示本主题集成的各项扩展特性，帮助你快速上手创作。

## 1. 强大的代码块 (Expressive Code)

本主题内置了 `astro-expressive-code`，不仅支持精准的语法高亮，还支持添加标题、高亮特定行甚至折叠长代码块。

### 1.1 带有标题和行号的高亮

```js {title="src/utils.js" showLineNumbers=true highlight="2-4"}
export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

### 1.2 折叠长代码块

对于一些不那么重要的冗长代码，你可以将其折叠：

```rust {title="main.rs" collapsed=true}
fn main() {
    println!("Hello, Pudding!");
    // 这是一大段可以被折叠的代码
    // ...
    // ...
    // ...
    println!("Goodbye!");
}
```

## 2. 数学公式 (KaTeX)

通过集成 `remark-math` 和 `rehype-katex`，你可以轻松编写优美的数学公式。

**行内公式：**
这里有一个行内公式：质能方程 $E = mc^2$ 以及欧拉公式 $e^{i\pi} + 1 = 0$。

**独立公式块：**
$$
f(x) = \int_{-\infty}^\infty\hat f(\xi)\,e^{2 \pi i \xi x}\,d\xi
$$

## 3. 防剧透文字模糊 (Spoiler)

利用 `remark-spoiler` 插件，你可以将剧透或敏感内容隐藏起来，只有当访客点击时才会显示。

你可以使用简单的语法：||这部分内容是被折叠的，点击查看详情||。

或者使用块级语法：

spoiler 点击查看更多详情：
||| 
在这个区块内，你可以放置多行文本。
它会默认处于模糊状态，保护访客不被剧透。
|||

## 4. 链接卡片预览 (Link Preview)

遇到外部参考链接时，仅有一行干瘪的 URL 总是显得单调。本主题支持链接预览卡片（确保链接单独占一行）：

https://github.com/huamurui/pudding

## 5. 图片自适应与缩放 (Medium Zoom)

文章中的图片默认会经过 Astro 的极致优化，并且内置了 `medium-zoom` 插件。你可以点击下方的占位图片进行缩放体验：

![Pudding 示例图片](https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80)

> 注：为了更好的视觉体验，你可以给图片加上说明文字（figcaption 会自动提取并居中显示）。

## 6. 其他基础排版优化

本主题在 Markdown 基础渲染上精心打磨了排版间距、字体及响应式表现：

- **提示块 (Blockquotes)**：如上一节的提示块，表现优雅清晰。
- **文章目录 (ToC)**：只要你的屏幕够宽，右侧就会自动吸附显示平滑跟随的目录结构。
- **阅读进度**：页面顶部配置了跟随滚动的进度条（Reading Progress）。
- **评论系统**：文章底部内置了基于 Giscus 的评论区配置，随时可开启。
- **引用关系 (Backlinks)**：如果你的文章被其他文章引用了，底部会自动展示一条 “被引用的文章” 时间线！

准备好了吗？立即开始你的创作之旅吧！
