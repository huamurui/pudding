import { createSignal, onMount } from 'solid-js';

type Theme = 'light' | 'dark' | '';

export default function ThemeToggle() {
  const [theme, setTheme] = createSignal<Theme>('');
  
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
    setTheme(initialTheme);
    applyTheme(initialTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  });

  const toggleTheme = (): void => {
    const newTheme = theme() === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggleTheme}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      }}
      aria-label={`切换到${theme() === 'dark' ? '亮色' : '暗色'}模式`}
      aria-pressed={theme() === 'dark'}
      style={{ 
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <span>
        <a
          class={theme() === 'light' ? 'nav-link is-active' : 'nav-link'}
          aria-pressed={theme() === 'light'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (theme() !== 'light') toggleTheme();
          }}
        >
          Light
        </a>
        <span aria-hidden="true">/</span>
        <a
          class={theme() === 'dark' ? 'nav-link is-active' : 'nav-link'}
          aria-pressed={theme() === 'dark'}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (theme() !== 'dark') toggleTheme();
          }}
        >
          Dark
        </a>
        <span class="indicator theme-toggle" aria-hidden="true"></span>
      </span>
    </div>
  );
}