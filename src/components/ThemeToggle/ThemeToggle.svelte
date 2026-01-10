<!-- ThemeToggle.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  type Theme = 'light' | 'dark' | '';

  let theme: Theme = '';

  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      return savedTheme as Theme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (newTheme: Theme): void => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  onMount(() => {
    const initialTheme = getInitialTheme();
    theme = initialTheme;
    applyTheme(initialTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        theme = newTheme; 
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  });

  const toggleTheme = (): void => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    theme = newTheme; 
    applyTheme(newTheme);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  };
</script>

<div
  role="button"
  tabindex={0}
  on:click={toggleTheme}
  on:keydown={handleKeyDown}
  aria-label={`切换到${theme === 'dark' ? '亮色' : '暗色'}模式`}
  aria-pressed={theme === 'dark'}
  style="cursor: pointer; position: relative;"
>
  <span>
    <a
      class="nav-link"
      class:is-active={theme === 'light'}
      aria-pressed={theme === 'light'}
      on:click={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (theme !== 'light') toggleTheme();
      }}
    >
      Light
    </a>

    <span aria-hidden="true">/</span>

    <a
      class="nav-link"
      class:is-active={theme === 'dark'}
      aria-pressed={theme === 'dark'}
      on:click={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (theme !== 'dark') toggleTheme();
      }}
    >
      Dark
    </a>

    <span class="indicator theme-toggle" aria-hidden="true"></span>
  </span>
</div>
