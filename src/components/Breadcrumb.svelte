<script lang="ts">
  import { siteConfig } from '@/config/site.config';
  import { onMount, onDestroy, tick } from 'svelte';

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
  let pathMap = new Map<string, string>();
  let activeDropdownLabel: string | null = null;
  let isDirectoryLoaded = false;
  let childrenCache = new Map<string, BreadcrumbItem[]>(); // 标签 -> 子项缓存

  const safeBuildUrl = (paths: string[] | string): string => {
    if (clientBuildUrl) {
      return clientBuildUrl(paths);
    }

    if (typeof paths === 'string') {
      return `${siteConfig.base}/${paths.replace(/^\/|\/$/g, '')}`;
    }
    return `${siteConfig.base}/${paths.filter(Boolean).join('/')}`;
  };

  const generatePathMap = () => {
    const newPathMap = new Map<string, string>();
    items.forEach((item, index) => {
      const path = items
        .slice(1, index + 1)
        .map(i => i.label.toLowerCase().replace(/\s+/g, '-'))
        .join('/');
      newPathMap.set(item.label, path);
    });
    pathMap = newPathMap;
  };

  const computeChildrenFromPath = (path: string): BreadcrumbItem[] => {
    const pathParts = path.split('/').filter(Boolean);
    let current: Record<string, DirectoryItem> | undefined = directoryStructure;

    for (const part of pathParts) {
      if (!current || !current[part] || current[part].type !== 'directory') {
        return [];
      }
      current = current[part].children;
    }

    if (!current || Object.keys(current).length === 0) {
      return [];
    }

    return Object.entries(current).map(([key, value]) => {
      const fullPath = [...pathParts, key].join('/');
      const hrefPaths = value.type === 'directory' 
        ? ['posts', fullPath, ''] 
        : ['posts', fullPath];
      
      return {
        label: value.label,
        href: safeBuildUrl(hrefPaths),
      };
    });
  };

  const computeChildrenCache = () => {
    if (!isDirectoryLoaded || pathMap.size === 0 || Object.keys(directoryStructure).length === 0) {
      return;
    }

    const newCache = new Map<string, BreadcrumbItem[]>();
    pathMap.forEach((path, label) => {
      newCache.set(label, computeChildrenFromPath(path));
    });
    childrenCache = newCache;
  };

  const toggleDropdown = (label: string, e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    activeDropdownLabel = activeDropdownLabel === label ? null : label;
  };

  const closeAllDropdowns = (e: Event) => {
    const target = e.target as HTMLElement;
    if (
      !target.closest('.breadcrumb-dropdown') &&
      !target.closest('.breadcrumb-dropdown-btn')
    ) {
      activeDropdownLabel = null;
    }
  };

  const loadDirectoryStructure = async () => {
    try {
      const response = await fetch(siteConfig.base+'/data/dir-data.json');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const structure = await response.json();
      directoryStructure = structure;
      isDirectoryLoaded = true;
      await tick();
    } catch (error) {
      console.error('加载目录结构失败：', error);
      directoryStructure = {};
      isDirectoryLoaded = false;
    }
  };

  onMount(async () => {
    generatePathMap();
    await loadDirectoryStructure();
    document.addEventListener('click', closeAllDropdowns);
  });

  // onDestroy(() => {
  //   document.removeEventListener('click', closeAllDropdowns);
  // });

  $: if (isDirectoryLoaded && pathMap.size > 0) {
    computeChildrenCache();
  }

  $: if (items.length > 0) {
    generatePathMap();
  }
</script>

<nav class="breadcrumb" aria-label="Breadcrumb" >
  <ol class="breadcrumb-list">
    {#each items as item, index}
      <li class="breadcrumb-item">
        {#if index < items.length - 1}
          <div class="breadcrumb-item-container">
            <a href={item.href} class="breadcrumb-link" title={item.label}>
              {item.label}
            </a>
            <button
              class="breadcrumb-dropdown-btn"
              type="button"
              aria-label={`查看 ${item.label} 下的子目录`}
              aria-expanded={activeDropdownLabel === item.label}
              aria-haspopup="true"
              on:click={(e) => toggleDropdown(item.label, e)}
            >
              <span class="breadcrumb-separator">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </span>
              <div class="breadcrumb-dropdown">
                <ul class="breadcrumb-dropdown-menu">
                  {#if !isDirectoryLoaded}
                    <li>
                      <span class="no-items">Loading...</span>
                    </li>
                  {:else}
                    {#if childrenCache.has(item.label) && (childrenCache.get(item.label) || []).length > 0}
                      {#each childrenCache.get(item.label) as child}
                        <li>
                          <a
                            href={child.href}
                            title={child.label}
                            on:click|stopPropagation
                          >
                            {child.label}
                          </a>
                        </li>
                      {/each}
                    {:else}
                      <li>
                        <span class="no-items">No items</span>
                      </li>
                    {/if}
                  {/if}
                </ul>
              </div>
            </button>
          </div>
        {:else}
          <span class="breadcrumb-current">{item.label}</span>
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

  .breadcrumb-dropdown-btn[aria-expanded="true"] .breadcrumb-dropdown {
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