<script lang="ts">
  import { onMount } from 'svelte'
  import { siteConfig } from '@/config/site.config'
  import { mountGiscus } from '@/scripts/giscus'
  import { buildUrl } from '@/utils/helpers'
  import { t } from '@/utils/i18n'

  const { giscus } = siteConfig
  let container: HTMLDivElement
  let status: 'loading' | 'ready' | 'error' = 'loading'
  let retry: () => void

  function themeFor(scheme: 'light' | 'dark'): string {
    const customTheme = giscus?.theme?.[scheme]
    if (!customTheme || location.protocol !== 'https:') return scheme
    try {
      const url = new URL(buildUrl(customTheme), location.origin)
      if (url.protocol === 'https:') return url.href
    } catch { /* Invalid stylesheet paths fall back to the built-in theme. */ }
    return scheme
  }

  onMount(() => {
    if (!giscus?.enabled) return
    const widget = mountGiscus(container, giscus, themeFor, t('common.comments.title'), state => { status = state })
    retry = widget.retry
    return widget.destroy
  })
</script>

{#if giscus?.enabled}
  <section id="giscus-container" class="comments-section" aria-label={t('common.comments.title')}>
    <div role="status">
      {#if status === 'loading'}
        <p>{t('common.comments.loading')}</p>
      {:else if status === 'error'}
        <p>{t('common.comments.error')}</p>
      {/if}
    </div>
    {#if status === 'error'}
      <button type="button" on:click={retry}>{t('common.comments.retry')}</button>
      <a href={`https://github.com/${giscus.repo}/discussions`}>{t('common.comments.discussions')}</a>
    {/if}
    <div bind:this={container} class="comments-embed" class:ready={status === 'ready'}></div>
  </section>
{/if}

<style>
  .comments-section {
    margin: 6rem auto 0;
    padding-top: 2rem;
    border-top: 1px solid var(--border-color);
    max-width: 800px;
  }

  p {
    margin: 0 0 0.75rem;
    color: var(--text-secondary);
  }

  button {
    margin-inline-end: 0.75rem;
    padding: 0.35rem 0.7rem;
    color: var(--text-primary);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font: inherit;
    cursor: pointer;
  }

  a {
    color: var(--theme-color);
  }

  .comments-embed {
    min-height: 1px;
  }

  .comments-embed :global(iframe) {
    display: block;
    width: 100%;
    height: 150px;
    border: 0;
    visibility: hidden;
  }

  .comments-embed.ready :global(iframe) {
    visibility: visible;
  }
</style>
