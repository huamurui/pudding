import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { globSync } from 'glob'
import { remark } from 'remark'
import { visit } from 'unist-util-visit'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 路径配置
const POSTS_DIR = path.resolve(__dirname, '../src/posts')
const CACHE_DIR = path.resolve(__dirname, '../.cache')
const OUTPUT_FILE = path.join(CACHE_DIR, 'backlinks.json')

// 确保缓存目录存在
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
}

async function buildBacklinks() {
  console.log('🚀 Starting backlink scan...')

  const files = globSync('**/*.{md,mdx}', { cwd: POSTS_DIR })
  const backlinks = {} // TargetID -> Array of SourceIDs

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    // 获取当前文件的 ID (例如: diary/notes)
    const sourceId = file.replace(/\.(md|mdx)$/, '')

    // 使用 remark 解析 Markdown
    const tree = remark.parse(content)

    visit(tree, 'link', (node) => {
      const url = node.url

      // 忽略外部链接
      if (url.startsWith('http') || url.startsWith('mailto')) return

      try {
        // 解析链接指向的物理路径
        let targetPath
        if (url.startsWith('/')) {
          // 绝对路径，相对于 posts 目录
          targetPath = path.resolve(POSTS_DIR, url.replace(/^\//, ''))
        } else {
          // 相对路径，相对于当前文件所在目录
          targetPath = path.resolve(path.dirname(filePath), url)
        }

        // 去掉 hash 和扩展名进行匹配
        const cleanTargetPath = targetPath.split('#')[0].replace(/\.(md|mdx)$/, '')

        // 检查这个路径是否在我们的 posts 目录下
        if (cleanTargetPath.startsWith(POSTS_DIR)) {
          const targetId = path.relative(POSTS_DIR, cleanTargetPath)

          // 自己引用自己通常不计入反向链接
          if (targetId === sourceId) return

          if (!backlinks[targetId]) {
            backlinks[targetId] = []
          }

          // 避免重复记录
          if (!backlinks[targetId].includes(sourceId)) {
            backlinks[targetId].push(sourceId)
            console.log(`🔗 Found: [${sourceId}] -> [${targetId}]`)
          }
        }
      } catch (e) {
        // 解析失败通常说明链接写法有问题，或者是普通的非文章资源
      }
    })
  }

  // 写入 JSON 文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(backlinks, null, 2))
  console.log(`✅ Scan complete! Data saved to ${OUTPUT_FILE}`)
}

buildBacklinks().catch(console.error)
