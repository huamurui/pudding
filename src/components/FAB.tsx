import { createSignal, onMount, onCleanup } from 'solid-js';
import './FAB.css'
interface FABProps {
  showThreshold?: number;
  position?: {
    bottom?: string;
    right?: string;
    left?: string;
    top?: string;
  };
}

const FAB = (props: FABProps) => {
  const [scrollPercent, setScrollPercent] = createSignal<number>(0);
  const [isVisible, setIsVisible] = createSignal<boolean>(false);

  let progressCircleRef: SVGElement | undefined;
  const circumference = 2 * Math.PI * 30; // 圆环半径为30
  const showThreshold = props.showThreshold || 300; // 默认滚动300px后显示

  const handleScroll = (): void => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
    const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;

    setScrollPercent(Math.round(percent));

    if (progressCircleRef) {
      const offset = circumference - (percent / 100) * circumference;
      progressCircleRef.style.strokeDashoffset = offset.toString();
    }

    setIsVisible(scrollTop > showThreshold);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  onMount(() => {
    window.addEventListener("scroll", handleScroll);
    handleScroll();
  });

  onCleanup(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  const defaultPosition = {
    bottom: '20px',
    right: '20px'
  };

  const fabPosition = { ...defaultPosition, ...props.position };

  return (
    <div
      class={
        isVisible() ? "floating-action-button visible" : "floating-action-button hidden"
      }
      style={fabPosition}
      onClick={scrollToTop}
      title="回到顶部"
    >
      <div class="icon">{scrollPercent()}%</div>
      <svg class="progress-ring">
        <circle
          ref={el => progressCircleRef = el}
          class="progress-circle"
          cx="31"
          cy="31"
          r="30"
          stroke-dasharray={circumference.toString()}
          stroke-dashoffset={circumference.toString()}
        ></circle>
      </svg>
    </div>
  );
};

export default FAB;
