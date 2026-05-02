<script lang="ts">
  import { onMount } from 'svelte';

  // Placeholder for Giscus config - User can fill this later
  const giscusConfig = {
    repo: "huamurui/huamurui.github.io",
    "repo-id": "R_kgDOHFCWEQ",
    category: "General",
    "category-id": "DIC_kwDOHFCWEc4CR0iJ",
    mapping: "pathname",
    strict: "0",
    "reactions-enabled": "1",
    "emit-metadata": "0",
    "input-position": "bottom",
    lang: "zh-CN",
    loading: "lazy"
  };

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
    const script = document.createElement('script');
    const theme = getThemeUrl();
    
    Object.entries({
      ...giscusConfig,
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

<div class="comments-section">
  <div id="giscus-container"></div>
</div>

<style>
  .comments-section {
    margin-top: 4rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color);
    max-width: 800px;
    margin: 0 auto;
  }
</style>
