<!-- ThemeToggle.svelte -->
<script lang="ts">
  // 从 Svelte 导入生命周期函数 onMount（等价于 Solid JS 的 onMount）
  import { onMount } from 'svelte';

  // 定义主题类型，与原 Solid JS 组件完全一致
  type Theme = 'light' | 'dark' | '';

  // Svelte 原生响应式变量：替代 Solid JS 的 createSignal，直接声明即可实现响应式
  let theme: Theme = '';

  // 获取初始主题：逻辑与原组件完全一致，兼容服务端渲染（判断 window 是否存在）
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      return savedTheme as Theme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // 应用主题：操作 DOM 类名、属性和本地存储，逻辑与原组件一致
  const applyTheme = (newTheme: Theme): void => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // 组件挂载后执行：等价于 Solid JS 的 onMount，返回清理函数移除事件监听
  onMount(() => {
    // 初始化主题，赋值给响应式变量（Svelte 自动追踪更新）
    const initialTheme = getInitialTheme();
    theme = initialTheme;
    applyTheme(initialTheme);

    // 监听系统主题变化，无本地存储时跟随系统
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
      if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        theme = newTheme; // 直接赋值更新响应式变量，无需 setter 函数
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // 清理函数：组件销毁时移除事件监听，防止内存泄漏
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  });

  // 切换主题：直接操作响应式变量 theme，Svelte 自动触发模板更新
  const toggleTheme = (): void => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    theme = newTheme; // 响应式更新，无需 Solid JS 的 setTheme 信号更新函数
    applyTheme(newTheme);
  };

  // 键盘事件处理：支持 Enter 和 Space 键触发切换（无障碍支持）
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  };
</script>

<!-- 外层容器：保留所有无障碍属性、事件绑定和内联样式 -->
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
    <!-- 亮色主题按钮：动态 class 绑定，保留事件阻止逻辑 -->
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

    <!-- 暗色主题按钮：动态 class 绑定，保留事件阻止逻辑 -->
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
