/**
 * 工具函数
 */

import type { PostEntry } from "@/types";

/**
 * 从 HTML 中提取摘要
 */
export function extractExcerptFromHtml(html: string, maxLength: number = 300): string {
  // 1. 查找 <!-- more --> 标记
  const moreMarker = /<!--\s*more\s*-->/i;
  if (moreMarker.test(html)) {
    const [excerptHtml] = html.split(moreMarker);
    return excerptHtml.trim();
  }

  // 2. 自动提取第一段（到第一个块级元素结束）
  const firstParagraphMatch = html.match(/<p>.*?<\/p>|<div>.*?<\/div>|<ul>.*?<\/ul>/s);
  if (firstParagraphMatch) {
    return firstParagraphMatch[0];
  }

  // 3. 兜底处理
  return html.slice(0, maxLength).replace(/<[^>]+$/, "") + "...";
}

/**
 * 计算阅读时间（分钟）
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * 格式化日期
 */
export function formatDate(date: Date | string, format: "iso" | "local" = "iso"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  if (format === "iso") {
    return d.toISOString().split("T")[0];
  }
  
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 生成文章 URL
 */
export function getPostUrl(postId: string, basePath: string = "/posts"): string {
  return `${basePath}/${postId}/`;
}

/**
 * 生成标签 URL
 */
export function getTagUrl(tag: string, basePath: string = "/tags"): string {
  return `${basePath}/${tag}/`;
}

/**
 * 生成安全的 view-transition-name
 */
export function sanitizeViewTransitionName(id: string): string {
  return `post-${String(id).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

/**
 * 检查是否为文章页面
 */
export function isPostPage(pathname: string, postPath: string = "/posts"): boolean {
  return pathname.startsWith(postPath);
}

/**
 * 检查是否为首页
 */
export function isHomePage(pathname: string): boolean {
  return pathname === "/" || pathname === "/index.html";
}

/**
 * 生成面包屑导航项（基于文件目录）
 */
export function generateBreadcrumbItems(postId: string, isCategory: boolean = false): Array<{ label: string; href: string }> {
  const items: Array<{ label: string; href: string }> = [
    { label: "Home", href: "/" }
  ];

  const pathParts = postId.split("/").filter(Boolean);
  
  let currentPath = "";
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    currentPath += `/${part}`;
    
    if (isCategory && i === pathParts.length - 1) {
      items.push({
        label: part.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        href: `/posts${currentPath}/`
      });
    } else if (!isCategory && i === pathParts.length - 1) {
      items.push({
        label: part.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        href: currentPath
      });
    } else {
      items.push({
        label: part.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        href: `/posts${currentPath}/`
      });
    }
  }

  return items;
}
