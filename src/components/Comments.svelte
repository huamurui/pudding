<script lang="ts">
  import { onMount } from 'svelte';
  import { mountGiscus } from '@/scripts/giscus';
  import { buildUrl } from '@/utils/helpers';
  import { siteConfig } from '@/config/site.config';
  const { giscus } = siteConfig;
  let container: HTMLDivElement;

  // Map camelCase to giscus data attributes
  const giscusParams = giscus ? {
    repo: giscus.repo,
    "repo-id": giscus.repoId,
    category: giscus.category,
    "category-id": giscus.categoryId,
    mapping: giscus.mapping,
    strict: giscus.strict,
    "reactions-enabled": giscus.reactionsEnabled,
    "emit-metadata": giscus.emitMetadata,
    "input-position": giscus.inputPosition,
    lang: giscus.lang,
    loading: giscus.loading
  } : null;

  function getThemeUrl() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Local dev: Use built-in themes to avoid CORS errors
    if (isLocal) {
      return isDark ? 'dark' : 'light';
    }
    
    // Production: Use the dedicated jelly theme files
    const themeFile = isDark ? 'giscus-dark.css' : 'giscus-light.css';
    return new URL(buildUrl(themeFile), window.location.origin).href;
  }

  function updateGiscusTheme() {
    const theme = getThemeUrl();
    const iframe = container?.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (!iframe) return;
    iframe.contentWindow?.postMessage(
      { giscus: { setConfig: { theme } } },
      'https://giscus.app'
    );
  }

  onMount(() => {
    if (!giscusParams || !giscus?.enabled) return;
    const disposeGiscus = mountGiscus(container, { ...giscusParams, theme: getThemeUrl() });

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateGiscusTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => { observer.disconnect(); disposeGiscus(); };
  });
</script>

{#if giscusParams && giscus?.enabled}
  <div class="comments-section">
    <div bind:this={container} id="giscus-container"></div>
  </div>
{/if}

<style>
  .comments-section {
    margin: 6rem auto 0;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color);
    max-width: 800px;
  }
</style>
