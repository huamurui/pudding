import { getCollection, type CollectionEntry } from 'astro:content'
import { getPostUrl } from './helpers'

export interface DirectoryNode {
  type: 'file' | 'directory';
  label: string;
  children?: DirectoryStructure;
}

export type DirectoryStructure = Record<string, DirectoryNode>;

/** 获取应公开展示的文章，避免草稿进入页面、索引和订阅源。 */
export async function getPublishedPosts(): Promise<CollectionEntry<'posts'>[]> {
  return getCollection('posts', ({ data }) => !data.draft)
}

/**
 * 生成目录结构数据（基于文件目录）
 */
export async function generateDirectoryStructure() {
  const posts = await getPublishedPosts()
  return buildDirectoryStructure(posts.map(post => post.id))
}

export function buildDirectoryStructure(postIds: string[]): DirectoryStructure {
  // Content paths such as "constructor" and "__proto__" are ordinary directory names.
  const structure: DirectoryStructure = Object.create(null)
  for (const postId of postIds) {
    const pathParts = postId.split('/').filter(Boolean)
    let current = structure

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const isLast = i === pathParts.length - 1

      if (!current[part]) {
        current[part] = isLast
          ? { type: 'file', label: part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }
          : { type: 'directory', label: part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), children: Object.create(null) }
      }

      if (!isLast) {
        // A file and a containing directory can share the same path. Keep its children
        // available in the menu; the article route takes precedence at that URL.
        current[part].type = 'directory'
        current[part].children ||= Object.create(null)
        current = current[part].children!
      }
    }
  }
  return structure
}

/** Group articles under every containing directory, including nested directories. */
export function groupPostsByDirectory(posts: CollectionEntry<'posts'>[]): Map<string, CollectionEntry<'posts'>[]> {
  const directories = new Map<string, CollectionEntry<'posts'>[]>()
  const postIds = new Set(posts.map(post => post.id))
  for (const post of posts) {
    const parts = post.id.split('/').filter(Boolean)
    for (let i = 1; i < parts.length; i++) {
      const directory = parts.slice(0, i).join('/')
      if (postIds.has(directory)) continue
      if (!directories.has(directory)) directories.set(directory, [])
      directories.get(directory)!.push(post)
    }
  }
  return directories
}

/**
 * 获取指定路径的子项
 */
export async function getPathChildren(path: string) {
  const structure = await generateDirectoryStructure()
  const pathParts = path.split('/').filter(Boolean)
  let current = structure

  for (const part of pathParts) {
    if (current[part] && current[part].type === 'directory') {
      current = current[part].children!
    } else {
      return []
    }
  }

  return Object.entries(current).map(([key, value]) => ({
    label: value.label,
    href: getPostUrl([...pathParts, key].join('/')),
    type: value.type
  }))
}
