import { createSignal, createEffect, For, Show, onMount } from 'solid-js';
import { evaluateExpression } from './Expression'
import './Search.css'
import PostList from '../PostList/PostList';
// 主组件
const Search = () => {
  // 状态管理
  const [data, setData] = createSignal({ posts: [], tags: [] });
  const [searchMode, setSearchMode] = createSignal('all');
  const [searchInput, setSearchInput] = createSignal('');
  const [suggestions, setSuggestions] = createSignal<string[]>([]);
  const [showSuggestions, setShowSuggestions] = createSignal(false);
  const [filteredPosts, setFilteredPosts] = createSignal([]);
  const [errorMessage, setErrorMessage] = createSignal('');

  // 从JSON文件获取数据
  onMount(async () => {
    try {
      const response = await fetch('/data/all-posts.json');
      const fetchedData = await response.json();
      setData(fetchedData);
      setFilteredPosts(fetchedData.posts || []);
    } catch (error) {
      console.error('获取数据失败:', error);
      setErrorMessage('获取数据失败，请刷新页面重试');
    }
  });

  // 提取所有标签名称
  const allTagNames = () => data().tags.map((tag: any) => tag.name);

  // 处理输入变化
  const handleInputChange = (e: Event) => {
    const input = (e.target as HTMLInputElement).value;
    setSearchInput(input);
    setErrorMessage('');

    // 根据当前模式生成不同的建议
    if (searchMode() === 'expression') {
      // 表达式模式下的建议逻辑
      const lastToken = input.split(/[\s&|!()]/).filter(t => t).pop() || '';
      if (lastToken) {
        const filtered = allTagNames().filter(tag =>
          tag.toLowerCase().includes(lastToken.toLowerCase()) &&
          !input.toLowerCase().includes(tag.toLowerCase())
        );
        setSuggestions(filtered);
      } else {
        setSuggestions(allTagNames());
      }
    } else {
      // 普通模式下的建议逻辑
      const currentTags = input.split(',').map(t => t.trim()).filter(t => t);
      const lastTag = currentTags[currentTags.length - 1] || '';

      const filtered = allTagNames()
        .filter(tag => !currentTags.includes(tag) &&
          tag.toLowerCase().includes(lastTag.toLowerCase())
        );

      setSuggestions(filtered);
    }

    setShowSuggestions(true);
  };

  // 处理模式变化
  const handleModeChange = (e: Event) => {
    const mode = (e.target as HTMLSelectElement).value;
    setSearchMode(mode);
    setSearchInput('');
    setFilteredPosts(data().posts || []);
    setErrorMessage('');
  };

  // 处理建议选择
  const handleSuggestionSelect = (tag: string) => {
    if (searchMode() === 'expression') {
      // 表达式模式下插入标签
      const input = searchInput();
      const lastToken = input.split(/[\s&|!()]/).filter(t => t).pop() || '';
      const newInput = lastToken
        ? input.replace(new RegExp(lastToken + '$'), tag)
        : input + tag;
      setSearchInput(newInput);
    } else {
      // 普通模式下添加标签
      const currentTags = searchInput().split(',').map(t => t.trim()).filter(t => t);
      const newTags = [...currentTags, tag];
      setSearchInput(newTags.join(', '));
    }
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchInput('');
    setFilteredPosts(data().posts || []);
    setErrorMessage('');
  };

  // 过滤帖子
  createEffect(() => {
    const input = searchInput().trim();
    const mode = searchMode();
    const posts = data().posts || [];

    if (!input || posts.length === 0) {
      setFilteredPosts(posts);
      return;
    }

    try {
      let result = [...posts];

      if (mode === 'expression') {
        // 表达式模式
        result = result.filter((post: any) =>
          evaluateExpression(input, post.tags, allTagNames())
        );
      } else {
        // 提取标签
        const searchTags = input.split(',').map(t => t.trim()).filter(t => t);
        if (searchTags.length === 0) {
          setFilteredPosts(posts);
          return;
        }

        // 全部包含或任一包含模式
        result = result.filter((post: any) => {
          const postTags = new Set(post.tags);
          if (mode === 'all') {
            return searchTags.every(tag => postTags.has(tag));
          } else { // 'any'
            return searchTags.some(tag => postTags.has(tag));
          }
        });
      }

      setFilteredPosts(result);
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('搜索出错，请检查输入');
      }
    }
  });

  // 点击外部关闭建议
  createEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const container = document.getElementById('tag-search-container');
      if (container && !container.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  // 键盘导航
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      return;
    }
  };

  return (
    <div class="tag-search-wrapper">


      <div id="tag-search-container">
        {/* 模式选择下拉框 */}
        <select
          value={searchMode()}
          onInput={handleModeChange}
        >
          <option value="all">全部包含</option>
          <option value="any">任一包含</option>
          <option value="expression">表达式</option>
        </select>

        {/* 搜索输入框 */}
        <div class="search-input-container">
          <input
            type="text"
            value={searchInput()}
            onInput={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              searchMode() === 'expression'
                ? "使用表达式搜索 (例如: web & (astro | 物理模拟))"
                : "输入标签，用逗号分隔..."
            }
          />

          {/* 清除按钮 */}
          <button
            onClick={clearSearch}
            classList={{
              'clear-button': true,
              'hidden': searchInput().length === 0
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* 建议下拉框 */}
          <Show when={showSuggestions() && suggestions().length > 0}>
            <div class="suggestions-dropdown">
              <For each={suggestions()}>
                {(tag) => (
                  <div
                    onClick={() => handleSuggestionSelect(tag)}
                    class="suggestion-item"
                  >
                    <span>{tag}</span>
                    <span class="suggestion-count">
                      {data().tags.find((t: any) => t.name === tag)?.count || 0}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>

      {/* 错误消息 */}
      <Show when={errorMessage()}>
        <div class="error-message">{errorMessage()}</div>
      </Show>

      {/* 搜索结果计数 */}
      <div style={{
        "max-width": "800px",
        margin: "auto"
      }} class="result-count">
        找到 {filteredPosts().length} 篇文章
      </div>

      <div style={{
        "max-width": "800px",
        margin: "auto"
      }}>
        <PostList
          posts={filteredPosts}
        ></PostList>
      </div>
    </div>
  );
};


export default Search