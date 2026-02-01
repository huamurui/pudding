<script lang="ts">
  import Fuse, { type FuseResult, type IFuseOptions } from "fuse.js";
  import { onMount } from "svelte";
  import { t } from "@/utils/i18n";

  interface Post {
    id: string;
    title: string;
    excerpt?: string;
    url: string;
    content: string;
    description?: string;
    tags?: string[];
  }

  type SearchablePosts = readonly Post[];
  export let searchablePosts: SearchablePosts = [];

  let searchQuery = "";
  let isSearchOpen = false;
  let searchResults: FuseResult<Post>[] = [];
  let fuse: Fuse<Post>;
  let searchWorker: Worker | null = null;
  let isWorkerReady = false;
  const fuseOptions: IFuseOptions<Post> = {
    includeScore: true,
    includeMatches: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: "title", weight: 3 },
      { name: "description", weight: 2 },
      { name: "content", weight: 1 },
      { name: "tags", weight: 1 },
    ],
  };

  fuse = new Fuse(searchablePosts as Post[], fuseOptions);

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    
    try {
      // 初始化 Web Worker (使用 Vite 支持的方式，并指定为模块类型)
      searchWorker = new Worker(new URL('../workers/search-worker.ts', import.meta.url), { type: 'module' });
      
      searchWorker.onmessage = (e) => {
        const { type, payload } = e.data;
        
        switch (type) {
          case 'INITIALIZED':
            isWorkerReady = true;
            break;
          case 'SEARCH_RESULTS':
            searchResults = payload.slice(0, 5);
            break;
          case 'ERROR':
            console.error('Search Worker Error:', payload);
            // 降级到主线程搜索
            if (fuse && searchQuery) {
              searchResults = fuse.search(searchQuery).slice(0, 5);
            }
            break;
        }
      };
      
      searchWorker.onerror = (error) => {
        console.error('Search Worker Error:', error);
        isWorkerReady = false;
      };
    } catch (error) {
      console.error('Failed to create search worker:', error);
      isWorkerReady = false;
    }
    
    // 初始化 Fuse 实例（主线程备用）
    fuse = new Fuse(searchablePosts as Post[], fuseOptions);
    
    // 发送初始化消息到 Worker
    if (searchWorker) {
      // 创建可序列化的 options 副本，移除不可序列化的属性
      const serializableOptions = {
        includeScore: true,
        includeMatches: true,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
          { name: "title", weight: 3 },
          { name: "description", weight: 2 },
          { name: "content", weight: 1 },
          { name: "tags", weight: 1 },
        ],
      };
      
      // 创建可序列化的文章数据副本，只包含必要属性
      const serializablePosts = searchablePosts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        description: post.description || '',
        tags: post.tags || [],
        url: post.url
      }));
      
      // todo . 现在未使用 worker
      // searchWorker.postMessage({
      //   type: 'INIT',
      //   payload: {
      //     posts: serializablePosts,
      //     options: serializableOptions
      //   }
      // });
    }
    
    return () => {
      document.removeEventListener("click", handleClickOutside);
      if (searchWorker) {
        searchWorker.terminate();
        searchWorker = null;
      }
    };
  });

  // 高亮显示匹配的文本
  const highlightMatch = (text: string, query: string): string => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  // 生成显示摘要，包含匹配的内容
  const generateExcerpt = (post: Post, query: string): string => {
    if (!query) return post.description || post.content.slice(0, 150) + "...";
    
    const content = post.content.toLowerCase();
    const queryLower = query.toLowerCase();
    const matchIndex = content.indexOf(queryLower);
    
    if (matchIndex === -1) return post.description || post.content.slice(0, 150) + "...";
    
    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(content.length, matchIndex + query.length + 50);
    let excerpt = post.content.slice(start, end);
    
    if (start > 0) excerpt = "..." + excerpt;
    if (end < post.content.length) excerpt = excerpt + "...";
    
    return highlightMatch(excerpt, query);
  };

  const handleClickOutside = (e: MouseEvent) => {
    const searchContainer = document.querySelector(".search-container");
    if (searchContainer && !searchContainer.contains(e.target as Node)) {
      isSearchOpen = false;
      searchQuery = "";
      searchResults = [];
    }
  };

  const handleSearchInput = (e: Event) => {
    const inputValue = (e.target as HTMLInputElement).value.trim();
    searchQuery = inputValue;

    if (!inputValue) {
      searchResults = [];
      return;
    }
    
    // 使用 Web Worker 搜索，如果可用
    if (isWorkerReady && searchWorker) {
      searchWorker.postMessage({
        type: 'SEARCH',
        payload: {
          query: inputValue
        }
      });
    } else {
      // 降级到主线程搜索
      const results = fuse.search(inputValue);
      searchResults = results.slice(0, 5);
    }
  };

  const toggleSearch = () => {
    isSearchOpen = !isSearchOpen;
    if (isSearchOpen) {
      setTimeout(() => {
        const searchInput =
          document.querySelector<HTMLInputElement>(".search-input");
        searchInput?.focus();
      }, 100);
    } else {
      searchQuery = "";
      searchResults = [];
    }
  };

  const handleSearchKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      isSearchOpen = false;
      searchQuery = "";
      searchResults = [];
    }

    if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault();
      window.location.href = searchResults[0].item.url;
    }
  };
</script>

<div class="search-container" role="search" aria-label="文章搜索区域">
  <button
    class="search-toggle"
    type="button"
    aria-label={isSearchOpen ? "收起搜索框" : "打开搜索框"}
    on:click={toggleSearch}
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  </button>

  {#if isSearchOpen}
    <div class="search-dropdown">
      <input
        class="search-input"
        type="text"
        placeholder="搜索文章..."
        value={searchQuery}
        on:input={handleSearchInput}
        on:keydown={handleSearchKeydown}
        aria-label="输入关键词搜索文章"
        aria-autocomplete="list"
        aria-controls="search-results-list"
      />

      {#if searchResults.length > 0}
        <ul class="search-results" id="search-results-list">
          {#each searchResults as result}
            <li class="search-result-item">
              <a
              href={result.item.url}
              on:click={() => {
                isSearchOpen = false;
                searchQuery = "";
              }}
              aria-label={t('common.search.ariaLabel.viewArticle', { title: result.item.title })}
            >
              <h4 class="result-title">{@html highlightMatch(result.item.title, searchQuery)}</h4>
              <p class="result-excerpt">{@html generateExcerpt(result.item, searchQuery)}</p>
            </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style>
  .search-container {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
  }

  .search-toggle {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .search-toggle:hover,
  .search-toggle:focus-visible {
    /* 补充：按钮聚焦样式，提升键盘导航体验 */
    background-color: rgba(0, 0, 0, 0.05);
    outline: 2px solid rgba(var(--theme-color), 0.8);
    outline-offset: 2px;
  }

  .search-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 320px;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 0.75rem;
    z-index: 1000;
  }

  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-primary);
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
    outline: none;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
  }

  .search-input:focus {
    border-color: var(--theme-color);
  }

  .search-results {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 240px;
    overflow-y: auto;
  }

  .search-result-item {
    margin-bottom: 0.5rem;
  }

  .search-result-item:last-child {
    margin-bottom: 0;
  }

  .search-result-item a {
    text-decoration: none;
    color: var(--text-primary);
    display: block;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background-color 0.2s ease;
  }

  .search-result-item a:hover,
  .search-result-item a:focus-visible {
    /* 补充：链接聚焦样式，提升键盘导航体验 */
    background-color: rgba(0, 0, 0, 0.05);
    outline: none;
  }

  .result-title {
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0 0 0.25rem 0;
    color: var(--theme-color);
  }

  .result-excerpt {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0;
    white-space: normal;
    overflow: hidden;
  }

  mark {
    background-color: var(--theme-color-light);
    color: var(--text-primary);
    padding: 0.1em 0.2em;
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    .search-dropdown {
      width: 320px;
      right: -9rem;
    }
  }
</style>
