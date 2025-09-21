// src/components/BlogFilterView/BlogFilterView.jsx
import { createSignal, onMount } from 'solid-js';
import SimpleFilter from './SimpleFilter';
import ExpressionFilter from './ExpressionFilter';
import PostList from '../PostList/PostList';
import './TagFilter.css';
// 这样写功能是爽了... 但是抖动...  
export default function TagFilter() {
  const [allPosts, setAllPosts] = createSignal([]);
  const [allTags, setAllTags] = createSignal([]);
  const [filteredPosts, setFilteredPosts] = createSignal([]);
  const [activeFilter, setActiveFilter] = createSignal('tag'); // 'tag' 或 'expression'
  const [isLoading, setIsLoading] = createSignal(true);
  const [selectedTags, setSelectedTags] = createSignal(new Set());

  // 加载数据
  onMount(async () => {
    try {
      const response = await fetch('/data/all-posts.json');
      const data = await response.json();
      
      // 根据API响应格式调整
      const posts = data.posts || data.body || [];
      const tags = data.tags || [];
      
      setAllPosts(posts);
      setFilteredPosts(posts);
      
      // 提取标签名称
      const tagNames = tags.map(tag => tag.name || tag);
      setAllTags(tagNames);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load posts data:', error);
      setIsLoading(false);
    }
  });

  // 处理标签筛选结果
  const handleSimpleFilterResult = (posts,tags) => {
    setFilteredPosts(posts);
    setSelectedTags(tags);
  };

  // 处理表达式筛选结果
  const handleExpressionFilterResult = (posts) => {
    setFilteredPosts(posts);
  };

  return (
    <div class="blog-filter-view">
      {isLoading() ? (
        <div class="loading">加载中...</div>
      ) : (
        <>
          {/* 筛选器切换选项卡 */}
          <div class="filter-tabs">
            <button
              class={`tab ${activeFilter() === 'tag' ? 'active' : ''}`}
              onClick={() => setActiveFilter('tag')}
            >
              标签筛选
            </button>
            <button
              class={`tab ${activeFilter() === 'expression' ? 'active' : ''}`}
              onClick={() => setActiveFilter('expression')}
            >
              表达式筛选
            </button>
          </div>

          {/* 当前激活的筛选器 */}
          <div class="filter-container">
            {activeFilter() === 'tag' ? (
              <SimpleFilter 
                allPosts={allPosts()}
                allTags={allTags()}
                onFilterResult={handleSimpleFilterResult}
              />
            ) : (
              <ExpressionFilter 
                allPosts={allPosts()}
                allTags={allTags()}
                onFilterResult={handleExpressionFilterResult}
              />
            )}
          </div>

          {/* 统一的结果展示区域 */}
          <div class="results">
            {selectedTags()}
            <h3>找到 {filteredPosts().length} 篇文章</h3>
            <PostList posts={filteredPosts} selectedTags={selectedTags} />
          </div>
        </>
      )}
    </div>
  );
}