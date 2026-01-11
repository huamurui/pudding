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

  const applyTheme = (newTheme: Theme): void => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  onMount(() => {
    const initialTheme = getInitialTheme();
    theme = initialTheme;
    applyTheme(initialTheme);

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

  const toggleTheme = (): void => {
    const newTheme = theme === "light" ? "dark" : "light";
    theme = newTheme;
    applyTheme(newTheme);
  };

  const switchToTheme = (targetTheme: Theme): void => {
    if (theme !== targetTheme) {
      theme = targetTheme;
      applyTheme(targetTheme);
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
      class="nav-link"
      class:is-active={theme === "light"}
      aria-hidden={theme !== "light"}
      on:click|stopPropagation={(e) => switchToTheme("light")}
    >
      Light
    </span>

    <span aria-hidden="true">/</span>

    <span
      class="nav-link"
      class:is-active={theme === "dark"}
      aria-hidden={theme !== "dark"}
      on:click|stopPropagation={(e) => switchToTheme("dark")}
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

  .theme-options {
    display: inline-flex;
    align-items: center;
  }

  .nav-link {
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .nav-link.is-active {
    color: var(--theme-color);
    font-weight: 500;
    pointer-events: none;
  }

  .theme-toggle-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 100%;
    background-color: rgba(var(--theme-color), 0.1);
    border-radius: 4px;
    transition: transform 0.2s ease;
  }

  .theme-toggle-container[aria-pressed="true"] .theme-toggle-indicator {
    transform: translateX(100%);
  }

  .theme-toggle-container:focus-visible {
    outline: 2px solid rgba(var(--theme-color), 0.8);
    outline-offset: 2px;
    border-radius: 4px;
  }
</style>
