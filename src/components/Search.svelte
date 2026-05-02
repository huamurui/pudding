<script lang="ts">
  import Fuse from "fuse.js";
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
  let searchResults: any[] = [];
  let fuse: any;
  let searchWorker: Worker | null = null;
  let isWorkerReady = false;
  let isIndexLoading = false;
  let isIndexLoaded = false;
  const fuseOptions: any = {
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

  const loadFullIndex = async () => {
    if (isIndexLoaded || isIndexLoading) return;
    isIndexLoading = true;
    try {
      // 仅动态导入索引数据
      const res = await fetch('/search-index.json');
      const data = await res.json();
      
      searchablePosts = data;
      fuse = new Fuse(searchablePosts as any[], fuseOptions);
      isIndexLoaded = true;
    } catch (e) {
      console.error('Failed to load search index:', e);
    } finally {
      isIndexLoading = false;
    }
  };

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
      loadFullIndex(); // 点击时开始加载索引
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
        placeholder={isIndexLoading ? "正在加载索引..." : "搜索文章..."}
        value={searchQuery}
        disabled={isIndexLoading}
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
    padding: 0.4rem;
    border-radius: 50%;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .search-toggle:hover,
  .search-toggle:focus-visible {
    background-color: color-mix(in srgb, var(--primary-color) 12%, transparent);
    color: var(--primary-color);
    transform: scale(1.1);
    outline: none;
  }

  .search-dropdown {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    width: 360px;
    background-color: color-mix(in srgb, var(--bg-primary) 95%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    padding: 1rem;
    z-index: 1000;
    
    /* Pop animation */
    animation: searchPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    transform-origin: top right;
  }

  @keyframes searchPop {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .search-input {
    width: 100%;
    padding: 0.8rem 1.2rem;
    background-color: var(--bg-secondary);
    border: 2px solid transparent;
    border-radius: 10px;
    color: var(--text-primary);
    font-size: 1rem;
    margin-bottom: 1rem;
    outline: none;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-sizing: border-box;
    font-weight: 500;
  }

  .search-input:focus {
    background-color: var(--bg-primary);
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary-color) 15%, transparent);
  }

  .search-input::placeholder {
    color: var(--text-muted);
    font-weight: 400;
  }

  .search-results {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 320px;
    overflow-y: auto;
    
    /* Custom scrollbar for results */
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) transparent;
  }
  
  .search-results::-webkit-scrollbar {
    width: 6px;
  }
  .search-results::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 3px;
  }

  .search-result-item {
    margin-bottom: 0.4rem;
  }

  .search-result-item:last-child {
    margin-bottom: 0;
  }

  .search-result-item a {
    text-decoration: none;
    display: block;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid transparent;
    background-color: transparent;
  }

  .search-result-item a:hover,
  .search-result-item a:focus-visible {
    background-color: color-mix(in srgb, var(--primary-color) 8%, transparent);
    border-color: color-mix(in srgb, var(--primary-color) 20%, transparent);
    outline: none;
  }

  .result-title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0 0 0.4rem 0;
    color: var(--text-primary);
    line-height: 1.4;
    transition: color 0.2s;
  }

  .search-result-item a:hover .result-title {
    color: var(--primary-color);
  }

  .result-excerpt {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin: 0;
    white-space: normal;
    overflow: hidden;
    line-height: 1.6;
  }

  /* Stunning highlight mark */
  :global(.search-results mark) {
    background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
    padding: 0.1em 0.3em;
    border-radius: 4px;
    font-weight: 800;
    box-shadow: 0 2px 0 color-mix(in srgb, var(--primary-color) 30%, transparent);
  }

  @media (max-width: 768px) {
    .search-dropdown {
      position: fixed;
      top: 70px;
      left: 1rem;
      right: 1rem;
      width: auto;
    }
  }
</style>
