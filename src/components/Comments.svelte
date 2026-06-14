<script lang="ts">
  import { onMount } from 'svelte';
  import { siteConfig } from '@/config/site.config';
  const { giscus } = siteConfig;

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
    return `${window.location.origin}/${themeFile}`;
  }

  function updateGiscusTheme() {
    const theme = getThemeUrl();
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (!iframe) return;
    iframe.contentWindow?.postMessage(
      { giscus: { setConfig: { theme } } },
      'https://giscus.app'
    );
  }

  onMount(() => {
    if (!giscusParams || !giscus?.enabled) return;
    const script = document.createElement('script');
    const theme = getThemeUrl();
    
    Object.entries({
      ...giscusParams,
      theme,
      crossorigin: "anonymous",
      async: "true"
    }).forEach(([key, value]) => {
      script.setAttribute(`data-${key}`, value);
    });

    script.src = "https://giscus.app/client.js";
    const container = document.getElementById('giscus-container');
    if (container) container.appendChild(script);

    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateGiscusTheme();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  });
</script>

{#if giscusParams && giscus?.enabled}
  <div class="comments-section">
    <div id="giscus-container"></div>
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
