<script lang="ts">
  import Fuse, { type FuseResult, type IFuseOptions } from "fuse.js";
  import { onMount } from "svelte";

  interface Post {
    id: string;
    title: string;
    excerpt: string;
    url: string;
  }

  type SearchablePosts = readonly Post[];
  export let searchablePosts: SearchablePosts = [];

  let searchQuery = "";
  let isSearchOpen = false;
  let searchResults: FuseResult<Post>[] = [];
  let fuse: Fuse<Post>;
  const fuseOptions: IFuseOptions<Post> = {
    includeScore: true,
    threshold: 0.3,
    keys: [
      { name: "title", weight: 2 },
      { name: "excerpt", weight: 1 },
    ],
  };

  fuse = new Fuse(searchablePosts as Post[], fuseOptions);

  onMount(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });

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
    const results = fuse.search(inputValue);
    searchResults = results.slice(0, 5);
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
                aria-label={`查看文章：${result.item.title}`}
              >
                <h4 class="result-title">{result.item.title}</h4>
                {#if result.item.excerpt}
                  <p class="result-excerpt">
                    {result.item.excerpt.slice(0, 80)}...
                  </p>
                {/if}
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @media (max-width: 768px) {
    .search-dropdown {
      width: 280px;
      right: -9rem;
    }
  }
</style>
