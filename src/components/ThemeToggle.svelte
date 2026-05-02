<script lang="ts">
  import { onMount } from "svelte";
  type Theme = "light" | "dark";
  let theme: Theme = "light";
  const getInitialTheme = (): Theme => {
    if (typeof window === "undefined") return "light";

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme && ["light", "dark"].includes(savedTheme)) {
      return savedTheme as Theme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const executeThemeChange = (newTheme: Theme): void => {
    const html = document.documentElement;
    if (html.getAttribute("data-theme") === newTheme && html.classList.contains(newTheme)) return;

    html.classList.remove("light", "dark");
    html.classList.add(newTheme);
    html.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const applyTheme = (newTheme: Theme, e?: MouseEvent): void => {
    // @ts-ignore: View Transitions API
    const isAppearanceTransition = document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!isAppearanceTransition || !e) {
      executeThemeChange(newTheme);
      return;
    }

    document.documentElement.classList.add("theme-transitioning");

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      executeThemeChange(newTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: newTheme === "dark" ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: newTheme === "dark" ? "::view-transition-old(root)" : "::view-transition-new(root)",
          fill: "both",
        }
      );
    });

    transition.finished.then(() => {
      document.documentElement.classList.remove("theme-transitioning");
    });
  };

  onMount(() => {
    const initialTheme = getInitialTheme();
    theme = initialTheme;
    // The theme is already applied by the inline script in Head.astro.
    // Only call applyTheme if the DOM state is inconsistent.
    if (document.documentElement.getAttribute("data-theme") !== initialTheme) {
      applyTheme(initialTheme);
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (e: MediaQueryListEvent): void => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        theme = newTheme;
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  });

  const toggleTheme = (e: MouseEvent): void => {
    const newTheme = theme === "light" ? "dark" : "light";
    theme = newTheme;
    applyTheme(newTheme, e);
  };

  const switchToTheme = (targetTheme: Theme, e: MouseEvent): void => {
    if (theme !== targetTheme) {
      theme = targetTheme;
      applyTheme(targetTheme, e);
    }
  };
</script>

<button
  type="button"
  class="theme-toggle-container"
  on:click={toggleTheme}
  aria-label={`当前为${theme === "dark" ? "暗色" : "亮色"}模式，点击切换为${theme === "dark" ? "亮色" : "暗色"}模式`}
  aria-pressed={theme === "dark"}
>
  <span class="theme-options">
    <span
      class="nav-link light"
      aria-hidden={theme !== "light"}
      on:click|stopPropagation={(e) => switchToTheme("light", e)}
    >
      Light
    </span>

    <span aria-hidden="true">/</span>

    <span
      class="nav-link dark"
      aria-hidden={theme !== "dark"}
      on:click|stopPropagation={(e) => switchToTheme("dark", e)}
    >
      Dark
    </span>
    <span class="indicator theme-toggle-indicator" aria-hidden="true"></span>
  </span>
</button>

<style>
  .theme-toggle-container {
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
    background: none;
    font: inherit;
    color: inherit;
    cursor: pointer;
    position: relative;
  }

  .indicator.theme-toggle-indicator {
    left: 0;
    position: absolute;
    bottom: -3px;
    width: 50%;
    height: 3px;
    border-radius: 3px;
    background: var(--primary-color);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    view-transition-name: theme-indicator;
  }


  .theme-toggle-container:focus-visible {
    outline: 2px solid rgba(var(--theme-color), 0.8);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* View Transitions for Theme Toggle */
  :global(.theme-transitioning),
  :global(.theme-transitioning *:not(.theme-toggle-indicator)) {
    transition: none !important;
  }
  :global(.theme-transitioning::view-transition-group(root)),
  :global(.theme-transitioning::view-transition-image-pair(root)),
  :global(.theme-transitioning::view-transition-old(root)),
  :global(.theme-transitioning::view-transition-new(root)) {
    animation: none !important;
    mix-blend-mode: normal !important;
  }
  
  :global(.theme-transitioning::view-transition-old(root)),
  :global(.theme-transitioning::view-transition-new(root)) {
    opacity: 1 !important;
    display: block !important;
  }
  :global(.theme-transitioning::view-transition-old(root)) {
    z-index: 1;
  }
  :global(.theme-transitioning::view-transition-new(root)) {
    z-index: 9999;
  }
  :global(.theme-transitioning[data-theme="dark"]::view-transition-old(root)) {
    z-index: 9999;
  }
  :global(.theme-transitioning[data-theme="dark"]::view-transition-new(root)) {
    z-index: 1;
  }
</style>
