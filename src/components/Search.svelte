<script lang="ts">
  import Fuse, { type FuseResult, type IFuseOptions } from 'fuse.js';
  import { onMount, tick } from 'svelte';
  import { t } from '@/utils/i18n';
  import { buildUrl } from '@/utils/helpers';
  import { generateExcerpt, highlightSegments, type SearchPost, type SearchWorkerMessage, type SearchWorkerResponse } from '@/scripts/search';

  export let searchablePosts: readonly SearchPost[] = [];

  let searchQuery = '';
  let isSearchOpen = false;
  let searchResults: FuseResult<SearchPost>[] = [];
  let fuse: Fuse<SearchPost> | null = null;
  let searchWorker: Worker | null = null;
  let isWorkerReady = false;
  let isIndexLoading = false;
  let isIndexLoaded = false;
  let indexError = false;
  let mounted = false;
  let requestId = 0;
  let searchContainer: HTMLDivElement;
  let searchInput: HTMLInputElement;
  let searchToggle: HTMLButtonElement;
  const indexController = new AbortController();
  const fuseOptions: IFuseOptions<SearchPost> = {
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
    keys: [
      { name: 'title', weight: 3 },
      { name: 'description', weight: 2 },
      { name: 'content', weight: 1 },
      { name: 'tags', weight: 1 }
    ]
  };

  function fallbackSearch() {
    searchResults = searchQuery ? fuse?.search(searchQuery, { limit: 5 }) || [] : [];
  }

  function disableWorker() {
    searchWorker?.terminate();
    searchWorker = null;
    isWorkerReady = false;
    fallbackSearch();
  }

  function search() {
    requestId++;
    if (!searchQuery) {
      searchResults = [];
      return;
    }
    if (isWorkerReady && searchWorker) {
      const message: SearchWorkerMessage = { type: 'SEARCH', payload: { query: searchQuery, requestId } };
      try {
        searchWorker.postMessage(message);
      } catch {
        disableWorker();
      }
    } else {
      fallbackSearch();
    }
  }

  function initializeWorker(posts: SearchPost[]) {
    try {
      searchWorker = new Worker(new URL('../workers/search-worker.ts', import.meta.url), { type: 'module' });
      searchWorker.onmessage = (event: MessageEvent<SearchWorkerResponse>) => {
        if (event.data.type === 'INITIALIZED') {
          isWorkerReady = true;
          search();
        } else if (event.data.type === 'SEARCH_RESULTS') {
          if (event.data.requestId === requestId && isSearchOpen) searchResults = event.data.payload;
        } else {
          disableWorker();
        }
      };
      searchWorker.onerror = disableWorker;
      const message: SearchWorkerMessage = { type: 'INIT', payload: { posts, options: fuseOptions } };
      searchWorker.postMessage(message);
    } catch {
      disableWorker();
    }
  }

  async function loadFullIndex() {
    if (isIndexLoaded || isIndexLoading) return;
    isIndexLoading = true;
    indexError = false;
    try {
      const response = await fetch(buildUrl('search-index.json'), { signal: indexController.signal });
      if (!response.ok) throw new Error(`Search index HTTP ${response.status}`);
      const posts: SearchPost[] = await response.json();
      if (!Array.isArray(posts)) throw new Error('Invalid search index');
      if (!mounted) return;
      fuse = new Fuse(posts, fuseOptions);
      isIndexLoaded = true;
      search();
      initializeWorker(posts);
    } catch (error) {
      if (mounted && !indexController.signal.aborted) {
        indexError = true;
        console.error('Failed to load search index:', error);
      }
    } finally {
      isIndexLoading = false;
    }
  }

  function closeSearch(restoreFocus = false) {
    isSearchOpen = false;
    searchQuery = '';
    searchResults = [];
    requestId++;
    if (restoreFocus) searchToggle?.focus();
  }

  function handleClickOutside(event: MouseEvent) {
    if (event.target instanceof Node && !searchContainer.contains(event.target)) closeSearch();
  }

  function handleSearchInput(event: Event) {
    searchQuery = (event.target as HTMLInputElement).value.trim();
    search();
  }

  async function toggleSearch() {
    if (isSearchOpen) {
      closeSearch();
      return;
    }
    isSearchOpen = true;
    void loadFullIndex();
    await tick();
    if (isSearchOpen) searchInput?.focus();
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearch(true);
    } else if (event.key === 'Enter' && !event.isComposing && searchResults.length > 0) {
      event.preventDefault();
      window.location.href = searchResults[0].item.url;
    }
  }

  onMount(() => {
    mounted = true;
    fuse = new Fuse([...searchablePosts], fuseOptions);
    document.addEventListener('click', handleClickOutside);
    return () => {
      mounted = false;
      indexController.abort();
      document.removeEventListener('click', handleClickOutside);
      searchWorker?.terminate();
      searchWorker = null;
    };
  });
</script>

<div bind:this={searchContainer} class="search-container" role="search" aria-label={t('common.search.region')}>
  <button
    bind:this={searchToggle}
    class="search-toggle"
    type="button"
    aria-label={t(isSearchOpen ? 'common.search.ariaLabel.close' : 'common.search.ariaLabel.open')}
    aria-expanded={isSearchOpen}
    aria-controls="search-dropdown"
    on:click={toggleSearch}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  </button>

  {#if isSearchOpen}
    <div class="search-dropdown" id="search-dropdown">
      <input
        bind:this={searchInput}
        class="search-input"
        type="search"
        placeholder={t(isIndexLoading ? 'common.search.loading' : 'common.search.placeholder')}
        value={searchQuery}
        on:input={handleSearchInput}
        on:keydown={handleSearchKeydown}
        aria-label={t('common.search.ariaLabel.input')}
        aria-controls="search-results-list"
        aria-busy={isIndexLoading}
      />
      <p class="search-status" role="status">
        {#if indexError}{t('common.search.loadError')}
        {:else if isIndexLoading}{t('common.search.loading')}
        {:else if searchQuery && searchResults.length === 0}{t('common.search.noResults')}
        {:else if searchQuery}{t('common.search.resultCount', { count: searchResults.length })}
        {/if}
      </p>
      <ul class="search-results" id="search-results-list">
        {#each searchResults as result (result.item.id)}
          <li class="search-result-item">
            <a href={result.item.url} on:click={() => closeSearch()} aria-label={t('common.search.ariaLabel.viewArticle', { title: result.item.title })}>
              <h4 class="result-title">{#each highlightSegments(result.item.title, searchQuery) as part, index (index)}{#if part.matched}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</h4>
              <p class="result-excerpt">{#each highlightSegments(generateExcerpt(result.item, searchQuery), searchQuery) as part, index (index)}{#if part.matched}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</p>
            </a>
          </li>
        {/each}
      </ul>
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
