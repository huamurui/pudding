---
title: "欢迎使用 Pudding 主题：功能展示"
date: 2025-06-10
tags: ["tech", "showcase", "theme"]
description: "全面展示 Astro Pudding 模板提供的各种丰富特性：丰富的代码块语法高亮、数学公式排版、防剧透模糊块、外链卡片预览以及双向链接等。"
pinned: true
---

欢迎使用 **Astro Pudding**！这是一款极简、优雅且功能丰富的博客主题。本文旨在为你展示本主题集成的各项扩展特性，帮助你快速上手创作。

## 1. 强大的代码块 (Expressive Code)

本主题内置了 `astro-expressive-code`，支持语法高亮、代码块标题、复制按钮以及行和文本标记。

### 1.1 带有标题的行高亮

```js title="src/utils.js" {2-4}
export function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
```

### 1.2 文本标记

也可以标记代码中的特定文本：

```rust title="main.rs" "println!"
fn main() {
    println!("Hello, Pudding!");
    println!("Goodbye!");
}
```

行号与折叠区块需要额外安装 Expressive Code 插件，模板默认没有启用。

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

也可以使用黑色遮盖形式：|||这段纯文本默认被遮盖，点击或按 Enter、空格键可以揭示|||。两种形式都用于行内纯文本，不是 Markdown 容器语法。

## 4. 链接卡片预览 (Link Preview)

遇到外部参考链接时，仅有一行干瘪的 URL 总是显得单调。本主题支持链接预览卡片（确保链接单独占一行）：

https://github.com/huamurui/pudding

## 5. 图片自适应与缩放 (Medium Zoom)

文章中的图片支持延迟加载和 `medium-zoom` 点击缩放。远程 Markdown 图片作为普通图片输出；frontmatter 封面图使用 Astro 图片管线。点击下方图片体验缩放：

![Pudding 示例图片](https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80)

*图片说明：彩色渐变。正文图片的 alt 不会自动成为 figcaption，可以像这样另写说明段落。*

## 6. 其他基础排版优化

本主题在 Markdown 基础渲染上精心打磨了排版间距、字体及响应式表现：

- **提示块 (Blockquotes)**：如上一节的提示块，表现优雅清晰。
- **文章目录 (ToC)**：只要你的屏幕够宽，右侧就会自动吸附显示平滑跟随的目录结构。
- **阅读进度**：页面顶部配置了跟随滚动的进度条（Reading Progress）。
- **评论系统**：文章底部内置了基于 Giscus 的评论区配置，随时可开启。
- **引用关系 (Backlinks)**：如果你的文章被其他文章引用了，底部会自动展示一条 “被引用的文章” 时间线！

## 7. 相对链接、预览与反向链接

阅读 [代码样例](./code-samples.md)、[数学公式](./math-and-katex.md#math-examples) 与 [Markdown 扩展](./plugins-and-extensions.md)。这些链接相对于当前 Markdown 源文件，构建时会加入部署前缀并解析自定义 slug，悬停时可以预览已发布文章。

反向链接由 `pnpm generate` 根据 Markdown 链接生成，`pnpm build` 会自动运行它。预览和首页摘要保留富文本格式，但不会执行文章脚本。

准备好了吗？用这些主题样例开始自己的创作吧！
