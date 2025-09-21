import { createSignal, createEffect } from 'solid-js';
import './SimpleFilter.css';

export default function SimpleFilter(props) {
  const [selectedTags, setSelectedTags] = createSignal(new Set());
  const [filterMode, setFilterMode] = createSignal('any'); // 'any' 或 'all'

  // 当筛选条件变化时，计算并通知父组件
  createEffect(() => {
    const posts = props.allPosts || [];
    const tags = selectedTags();
    
    if (tags.size === 0) {
      props.onFilterResult?.(posts,tags);
      return;
    }

    const filtered = posts.filter(post => {
      const postTags = new Set(post.tags);
      const mode = filterMode();

      if (mode === 'all') {
        // 必须包含所有选中的标签
        return Array.from(tags).every(tag => postTags.has(tag));
      } else {
        // 包含任意一个选中的标签即可
        return Array.from(tags).some(tag => postTags.has(tag));
      }
    });

    props.onFilterResult?.(filtered, tags);
  });

  // 切换标签选择状态
  const toggleTag = (tag) => {
    const newSelectedTags = new Set(selectedTags());
    if (newSelectedTags.has(tag)) {
      newSelectedTags.delete(tag);
    } else {
      newSelectedTags.add(tag);
    }
    setSelectedTags(newSelectedTags);
  };

  // 清除所有选中的标签
  const clearSelection = () => {
    setSelectedTags(new Set());
  };

  return (
    <div class="tag-filter">
      {/* 模式选择器 */}
      <div class="mode-selector">
        <label class="mode-option">
          <input
            type="radio"
            name="filterMode"
            value="any"
            checked={filterMode() === 'any'}
            onChange={(e) => setFilterMode(e.target.value)}
          />
          包含任意所选标签
        </label>

        <label class="mode-option">
          <input
            type="radio"
            name="filterMode"
            value="all"
            checked={filterMode() === 'all'}
            onChange={(e) => setFilterMode(e.target.value)}
          />
          包含所有所选标签
        </label>
      </div>

      {/* 标签选择器 */}
      <div class="tags-container">
        <div class="tags-header">
          <h3>选择标签 ({selectedTags().size} 个已选)</h3>
          {selectedTags().size > 0 && (
            <button onClick={clearSelection} class="clear-btn">
              清除选择
            </button>
          )}
        </div>

        <div class="tags-list">
          {props.allTags.map(tag => (
            <button
              type="button"
              class={`tag ${selectedTags().has(tag) ? 'selected' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}