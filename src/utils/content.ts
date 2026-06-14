import { getCollection } from 'astro:content'

/**
 * 生成目录结构数据（基于文件目录）
 */
export async function generateDirectoryStructure() {
  const posts = await getCollection('posts')
  const structure: Record<string, any> = {}
  for (const post of posts) {
    const pathParts = post.id.split('/').filter(Boolean)
    let current = structure

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      const isLast = i === pathParts.length - 1

      if (!current[part]) {
        current[part] = isLast
          ? { type: 'file', label: part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }
          : { type: 'directory', label: part.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), children: {} }
      }

      if (!isLast) {
        current = current[part].children
      }
    }
  }
  return structure
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
      current = current[part].children
    } else {
      return []
    }
  }

  // Import buildUrl locally to avoid circular dependency if helpers.ts imports this
  const { buildUrl } = await import('./helpers')

  return Object.entries(current).map(([key, value]) => ({
    label: value.label,
    href: value.type === 'directory'
      ? buildUrl(['posts', [...pathParts, key].join('/'), ''])
      : buildUrl([...pathParts, key].join('/')),
    type: value.type
  }))
}
