/**
 * 全局类型定义
 */

import type { CollectionEntry } from 'astro:content'

/** 文章图片 */
export interface PostImage {
  url: string;
  alt?: string;
}

/** 文章 Frontmatter */
export interface PostFrontmatter {
  title: string;
  description?: string;
  date: Date;
  tags?: string[];
  image?: PostImage;
  author?: string;
  updated?: Date;
  url?: string;
  pinned?: boolean;
}

/** 文章数据 */
export interface PostData {
  id: string;
  url: string;
  title: string;
  date: string | Date;
  tags: string[];
  description?: string;
  excerptHtml: string;
  pinned?: boolean;
}

/** 文章集合条目 */
export type PostEntry = CollectionEntry<'posts'>;

/** 结构化数据 */
export interface StructuredData {
  '@context'?: string;
  '@type'?: string;
  [key: string]: unknown;
}

/** 导航项 */
export interface NavItem {
  href: string;
  label: string;
}

/** 社交链接 */
export interface SocialLink {
  name: string;
  href: string;
  icon?: string;
}
