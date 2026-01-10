<!-- FAB.svelte -->
<script lang="ts">
  import { onMount } from 'svelte'; 

  interface FABProps {
    showThreshold?: number;
    position?: {
      bottom?: string;
      right?: string;
      left?: string;
      top?: string;
    };
  }

  export let showThreshold: number = 300; 
  export let position: NonNullable<FABProps['position']> = {}; 
  let scrollPercent: number = 0;
  let isVisible: boolean = false; 
  let progressCircleRef: SVGElement | null = null; 
  const circleRadius = 30;
  const circumference = 2 * Math.PI * circleRadius;

  const handleScroll = (): void => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
    
    const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
    scrollPercent = Math.round(percent);

    if (progressCircleRef) {
      const offset = circumference - (percent / 100) * circumference;
      progressCircleRef.style.strokeDashoffset = offset.toString();
    }

    isVisible = scrollTop > showThreshold;
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  onMount(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });


  const defaultPosition = {
    bottom: '20px',
    right: '20px'
  };
  const fabPosition = { ...defaultPosition, ...position };
</script>

<div
  class="floating-action-button"
  class:visible={isVisible} 
  class:hidden={!isVisible}
  style:bottom={fabPosition.bottom} 
  style:right={fabPosition.right} 
  on:click={scrollToTop} 
  title="回到顶部"
>
  <div class="icon">{scrollPercent}%</div>
  <svg class="progress-ring">
    <circle
      bind:this={progressCircleRef} 
      class="progress-circle"
      cx="31"
      cy="31"
      r={circleRadius}
      stroke-dasharray={circumference}
      stroke-dashoffset={circumference}
    ></circle>
  </svg>
</div>


<style>
.floating-action-button {
  position: fixed;
  width: 50px;
  height: 50px;
  border-radius: 50px;
  background-color: var(--primary-color);
  color: var(--bg-primary);
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  user-select: none;
  z-index: 999;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.visible {
  opacity: 1;
  transform: scale(1);
}

.hidden {
  opacity: 0;
  transform: scale(0.8);
  pointer-events: none;
}

.icon {
  z-index: 2;
  font-size: 16px;
}

.progress-ring {
  position: absolute;
  height: 62px;
  width: 62px;
  color: var(--primary-color);
  transform: rotate(-90deg);
}

.progress-circle {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 2;
  stroke-linecap: round;
}

.floating-action-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
    
</style>
