import { createSignal, onMount, createEffect } from 'solid-js';
export default function ThemeToggle() {
  const [theme, setTheme] = createSignal('');
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const applyTheme = (newTheme) => {
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
    const handleSystemThemeChange = (e) => {
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

  const toggleTheme = () => {
    const newTheme = theme() === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <div
      onClick={toggleTheme}
      aria-label={`切换到${theme() === 'dark' ? '亮色' : '暗色'}模式`}
      style={{ 
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <span>
        <a 
          class={theme() === 'light' ? 'nav-link is-active' : 'nav-link'}>Light</a>
        <span>/</span>
        <a class={theme() === 'dark' ? 'nav-link is-active' : 'nav-link'}>Dark</a>
        <span class="indicator" style={{
          position: 'absolute',
          bottom: '-3px',
          left: theme() === 'light' ? '0' : '50%',
          width: ['light', 'dark'].includes(theme()) ? '50%' : '0',
          height: '3px',
          'border-radius': '3px',
          background: 'var(--primary-color)',
          transition: 'all 0.3s ease',
        }}></span>
      </span>
    </div>
  );
}