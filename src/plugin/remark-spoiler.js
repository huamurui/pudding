import { visit } from 'unist-util-visit'

/**
 * Remark 插件：将 ||模糊内容|| 转换为可点击显示的模糊文本
 * 语法：||内容|| → 模糊文本（默认 blur 模式）；|||内容||| → 黑线模式
 */
export default function remarkBlurText() {
  return (tree) => {
    // 遍历所有文本节点
    visit(tree, 'text', (node, index, parent) => {
      const text = node.value
      // 匹配两种语法：||内容||（blur）、|||内容|||（blackout）
      const blurRegex = /\|\|([^|]+)\|\|/g // 匹配 ||xxx||（不包含|）
      const blackoutRegex = /\|\|\|([^|]+)\|\|\|/g // 匹配 |||xxx|||

      // 如果没有匹配，直接返回
      if (!blurRegex.test(text) && !blackoutRegex.test(text)) return

      // 拆分文本为：普通文本 + 自定义节点
      const children = []
      let lastIndex = 0
      let match

      // 先处理 |||内容|||（黑线模式）
      while ((match = blackoutRegex.exec(text)) !== null) {
        const [fullMatch, content] = match
        const start = match.index
        const end = start + fullMatch.length

        // 添加匹配前的普通文本
        if (start > lastIndex) {
          children.push({ type: 'text', value: text.slice(lastIndex, start) })
        }

        // 添加黑线模式的 HTML 节点（精简字符串，避免换行）
        children.push({
          type: 'html',
          value: `<span class="blur-wrapper" data-mode="blackout" data-hidden="true"><span class="blur-content">${content.trim()}</span></span>`
        })

        lastIndex = end
      }

      // 再处理 ||内容||（模糊模式）
      blurRegex.lastIndex = lastIndex // 从上次结束的位置开始匹配
      while ((match = blurRegex.exec(text)) !== null) {
        const [fullMatch, content] = match
        const start = match.index
        const end = start + fullMatch.length

        if (start > lastIndex) {
          children.push({ type: 'text', value: text.slice(lastIndex, start) })
        }

        children.push({
          type: 'html',
          value: `<span class="blur-wrapper" data-mode="blur" data-hidden="true"><span class="blur-content">${content.trim()}</span></span>`
        })

        lastIndex = end
      }

      if (lastIndex < text.length) {
        children.push({ type: 'text', value: text.slice(lastIndex) })
      }

      if (parent && index !== null) {
        parent.children.splice(index, 1, ...children)
      }
    })
  }
}
