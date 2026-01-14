/**
 * 工具函数
 */

import { siteConfig } from "@/config/site.config";
import { getCollection } from "astro:content";
import type { PostEntry } from "@/types";

/**
 * 统一的 URL 拼接方法
 * @param path 路径，可以是字符串或数组
 * @returns 完整的 URL，包含 base 路径
 */
export function buildUrl(path: string | string[]): string {
  const base = siteConfig.base || "";
  
  let relativePath: string;
  if (Array.isArray(path)) {
    relativePath = path.filter(Boolean).join("/");
  } else {
    relativePath = path;
  }
  
  if (!relativePath) {
    return base || "/";
  }
  
  const cleanPath = relativePath.replace(/^\/+|\/+$/g, "");
  
  if (!base) {
    return `/${cleanPath}`;
  }
  
  return `${base}/${cleanPath}`.replace(/\/+/g, "/");
}

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
  return buildUrl([basePath, postId, ""]);
}

/**
 * 生成标签 URL
 */
export function getTagUrl(tag: string, basePath: string = "/tags"): string {
  return buildUrl([basePath, tag, ""]);
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
  return pathname.includes(postPath);
}

/**
 * 检查是否为首页
 */
export function isHomePage(pathname: string): boolean {
  return pathname === "/" || pathname === "/index.html";
}

/**
 * 生成目录结构数据（基于文件目录）
 */
export async function generateDirectoryStructure() {
  const posts = await getCollection("posts");
  const structure: Record<string, any> = {};

  for (const post of posts) {
    const pathParts = post.id.split("/").filter(Boolean);
    let current = structure;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;

      if (!current[part]) {
        current[part] = isLast 
          ? { type: "file", label: part.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) }
          : { type: "directory", label: part.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()), children: {} };
      }

      if (!isLast) {
        current = current[part].children;
      }
    }
  }

  return structure;
}

/**
 * 生成面包屑导航项（基于文件目录）
 */
export function generateBreadcrumbItems(postId: string, isCategory: boolean = false): Array<{ label: string; href: string }> {
  const items: Array<{ label: string; href: string }> = [
    { label: "Home", href: buildUrl("") }
  ];

  const pathParts = postId.split("/").filter(Boolean);
  
  let currentPath = "";
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    currentPath += `/${part}`;
    
    if (isCategory && i === pathParts.length - 1) {
      items.push({
        label: part.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        href: buildUrl(["posts", currentPath, ""])
      });
    } else if (!isCategory && i === pathParts.length - 1) {
      items.push({
        label: part.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        href: buildUrl(currentPath)
      });
    } else {
      items.push({
        label: part.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        href: buildUrl(["posts", currentPath, ""])
      });
    }
  }

  return items;
}

/**
 * 获取指定路径的子项
 */
export async function getPathChildren(path: string) {
  const structure = await generateDirectoryStructure();
  const pathParts = path.split("/").filter(Boolean);
  let current = structure;

  for (const part of pathParts) {
    if (current[part] && current[part].type === "directory") {
      current = current[part].children;
    } else {
      return [];
    }
  }

  return Object.entries(current).map(([key, value]) => ({
    label: value.label,
    href: value.type === "directory" 
      ? buildUrl(["posts", [...pathParts, key].join("/"), ""])
      : buildUrl([...pathParts, key].join("/")),
    type: value.type
  }));
}
