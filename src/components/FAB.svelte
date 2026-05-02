<script lang="ts">
  import { onMount } from 'svelte'; 

  interface FABProps {
    showThreshold?: number;
    position?: {
      bottom?: string;
      right?: string;
    };
  }

  export let showThreshold: number = 300; 
  export let position: NonNullable<FABProps['position']> = {}; 
  let isVisible: boolean = false; 

  const handleScroll = (): void => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    isVisible = scrollTop > showThreshold;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  onMount(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  });

  const defaultPosition = { bottom: '32px', right: '32px' };
  const fabPosition = { ...defaultPosition, ...position };
</script>

<button
  type="button" 
  class="fab"
  class:visible={isVisible} 
  style:bottom={fabPosition.bottom} 
  style:right={fabPosition.right} 
  on:click={scrollToTop} 
  title="回到顶部"
  aria-label="回到顶部" 
>
  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 15l-6-6-6 6"/>
  </svg>
</button>

<style>
  .fab {
    position: fixed;
    width: 44px;
    height: 44px;
    border: none;
    outline: none;
    border-radius: 50%;
    /* 使用 color-mix 实现半透明毛玻璃感 */
    background-color: color-mix(in srgb, var(--primary-color) 15%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: var(--primary-color);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    z-index: 999;
    opacity: 0;
    transform: scale(0.8) translateY(20px);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: none;
  }

  .visible {
    opacity: 1;
    transform: scale(1) translateY(0);
    pointer-events: auto;
  }

  .icon {
    width: 20px;
    height: 20px;
    transition: transform 0.3s ease;
  }

  .fab:hover {
    background-color: var(--primary-color);
    color: white;
    box-shadow: 0 8px 20px color-mix(in srgb, var(--primary-color) 30%, transparent);
  }

  .fab:hover .icon {
    transform: translateY(-2px);
  }

  .fab:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    .fab {
      width: 40px;
      height: 40px;
      bottom: 24px !important;
      right: 24px !important;
    }
  }
</style>
