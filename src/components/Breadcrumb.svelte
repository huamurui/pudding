<script lang="ts">
  import { onMount } from 'svelte';
  import { buildUrl, getPostUrl } from '@/utils/helpers';
  import { t } from '@/utils/i18n';
  import { breadcrumbDirectoryPath } from '@/scripts/breadcrumb';

  interface BreadcrumbItem {
    label: string;
    href: string;
  }

  interface DirectoryItem {
    label: string;
    type: 'directory' | 'file';
    children?: Record<string, DirectoryItem>;
  }

  export let items: BreadcrumbItem[] = [];
  export let clientBuildUrl: ((paths: string[] | string) => string) | null = null;

  let directoryStructure: Record<string, DirectoryItem> = {};
  let activeDropdownIndex: number | null = null;
  let isDirectoryLoaded = false;
  let directoryError = false;
  let breadcrumb: HTMLElement;
  let activeButton: HTMLButtonElement | null = null;

  const safeBuildUrl = (paths: string[] | string): string => (clientBuildUrl || buildUrl)(paths);

  function computeChildren(
    item: BreadcrumbItem,
    structure: Record<string, DirectoryItem>,
    makeUrl: (paths: string[] | string) => string
  ): BreadcrumbItem[] {
    const path = breadcrumbDirectoryPath(item.href, makeUrl('posts'));
    const pathParts = path.split('/').filter(Boolean);
    let current: Record<string, DirectoryItem> | undefined = structure;
    for (const part of pathParts) {
      if (current?.[part]?.type !== 'directory') return [];
      current = current[part].children;
    }
    return Object.entries(current || {}).map(([key, value]) => ({
      label: value.label,
      href: makeUrl === buildUrl
        ? getPostUrl([...pathParts, key].join('/'))
        : makeUrl(['posts', ...pathParts, key])
    }));
  }

  $: childrenCache = new Map(items.map(item => [item.href, computeChildren(item, directoryStructure, clientBuildUrl || buildUrl)]));

  function toggleDropdown(index: number, event: MouseEvent) {
    activeDropdownIndex = activeDropdownIndex === index ? null : index;
    activeButton = event.currentTarget as HTMLButtonElement;
  }

  onMount(() => {
    const controller = new AbortController();
    const closeOutside = (event: MouseEvent) => {
      if (event.target instanceof Node && !breadcrumb.contains(event.target)) activeDropdownIndex = null;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeDropdownIndex !== null) {
        activeDropdownIndex = null;
        activeButton?.focus();
      }
    };
    document.addEventListener('click', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    void (async () => {
      try {
        const response = await fetch(safeBuildUrl('data/dir-data.json'), { signal: controller.signal });
        if (!response.ok) throw new Error(`Directory HTTP ${response.status}`);
        const structure = await response.json();
        if (controller.signal.aborted) return;
        directoryStructure = structure;
        isDirectoryLoaded = true;
      } catch (error) {
        if (!controller.signal.aborted) {
          directoryError = true;
          console.error('加载目录结构失败：', error);
        }
      }
    })();
    return () => {
      controller.abort();
      document.removeEventListener('click', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  });
</script>

<nav bind:this={breadcrumb} class="breadcrumb" aria-label={t('common.breadcrumb.label')}>
  <ol class="breadcrumb-list">
    {#each items as item, index (item.href)}
      <li class="breadcrumb-item">
        {#if index < items.length - 1}
          <div class="breadcrumb-item-container">
            <a href={item.href} class="breadcrumb-link" title={item.label}>{item.label}</a>
            <button
              class="breadcrumb-dropdown-btn"
              type="button"
              aria-label={t('common.breadcrumb.children', { label: item.label })}
              aria-expanded={activeDropdownIndex === index}
              aria-controls={`breadcrumb-dropdown-${index}`}
              on:click={(event) => toggleDropdown(index, event)}
            >
              <span class="breadcrumb-separator" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
            </button>
            <div class="breadcrumb-dropdown" id={`breadcrumb-dropdown-${index}`} hidden={activeDropdownIndex !== index}>
              <ul class="breadcrumb-dropdown-menu">
                {#if directoryError}
                  <li><span class="no-items">{t('common.breadcrumb.loadError')}</span></li>
                {:else if !isDirectoryLoaded}
                  <li><span class="no-items">{t('common.breadcrumb.loading')}</span></li>
                {:else if (childrenCache.get(item.href) || []).length > 0}
                  {#each childrenCache.get(item.href) || [] as child (child.href)}
                    <li><a href={child.href} title={child.label} on:click={() => activeDropdownIndex = null}>{child.label}</a></li>
                  {/each}
                {:else}
                  <li><span class="no-items">{t('common.breadcrumb.empty')}</span></li>
                {/if}
              </ul>
            </div>
          </div>
        {:else}
          <span class="breadcrumb-current" aria-current="page">{item.label}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .breadcrumb {
    margin-bottom: 2rem;
    padding: 0.4rem 0;
    width: fit-content;
  }

  .breadcrumb-list {
    display: flex;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
    flex-wrap: wrap;
    gap: 0.1rem;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
  }

  .breadcrumb-item-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .breadcrumb-link {
    color: var(--text-secondary);
    text-decoration: none;
    padding: 0.3rem 0.8rem;
    border-radius: 999px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    font-weight: 600;
  }

  .breadcrumb-link:hover {
    color: var(--primary-color);
    background-color: color-mix(in srgb, var(--primary-color) 12%, transparent);
    transform: translateY(-1px);
  }

  .breadcrumb-current {
    color: var(--text-primary);
    font-weight: 700;
    padding: 0.3rem 0.6rem;
  }

  .breadcrumb-separator {
    color: var(--text-muted);
    margin: 0 0.1rem;
    opacity: 0.6;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.3rem;
    border-radius: 50%;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .breadcrumb-dropdown-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;
    margin: 0;
    position: relative;
    border-radius: 50%;
    outline: none;
  }

  .breadcrumb-dropdown-btn:hover .breadcrumb-separator {
    color: var(--primary-color);
    background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
    opacity: 1;
    transform: scale(1.1);
  }

  .breadcrumb-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(-10px) scale(0.95);
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    min-width: 140px;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    padding: 0.4rem;
  }

  .breadcrumb-dropdown:not([hidden]) {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0) scale(1);
  }

  .breadcrumb-dropdown-menu {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .breadcrumb-dropdown-menu li {
    margin: 0;
  }

  .breadcrumb-dropdown-menu a {
    display: block;
    padding: 0.6rem 0.8rem;
    color: var(--text-secondary);
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.85rem;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  .breadcrumb-dropdown-menu a:hover {
    color: var(--primary-color);
    background-color: color-mix(in srgb, var(--primary-color) 12%, transparent);
  }

  .no-items {
    display: block;
    padding: 0.6rem 0.8rem;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-style: italic;
  }
</style>
