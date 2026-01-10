<script>
  import { onMount } from 'svelte';
  let theme = '';

  const getInitialTheme = () => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (t) => {
    document.documentElement.classList.remove('light','dark');
    document.documentElement.classList.add(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    theme = t;
  };

  onMount(() => {
    const initial = getInitialTheme();
    applyTheme(initial);
    const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (mq && mq.addEventListener) {
      mq.addEventListener('change', (ev) => {
        if (!localStorage.getItem('theme')) {
          applyTheme(ev.matches ? 'dark' : 'light');
        }
      });
    }
  });

  const toggle = () => {
    applyTheme(theme === 'light' ? 'dark' : 'light');
  }
</script>

<div role="button" tabindex="0" class="theme-toggle-wrapper" on:click={toggle} on:keydown={(e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); toggle(); } }} aria-pressed={theme==='dark'}>
  <a class:active={theme==='light'}>Light</a>
  <span>/</span>
  <a class:active={theme==='dark'}>Dark</a>
</div>

<style>
  .theme-toggle-wrapper { cursor:pointer; }
  .theme-toggle-wrapper a.active { font-weight:700; }
</style>
