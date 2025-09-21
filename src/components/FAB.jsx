import { createSignal, onMount, onCleanup, createEffect } from 'solid-js';
// import styles from './FAB.css'; 
import styles from './FAB.module.css';

const FAB = (props) => {
  const [state, setState] = createSignal('default');
  const [direction, setDirection] = createSignal('');
  const [scrollPercent, setScrollPercent] = createSignal(0);
  const [position, setPosition] = createSignal({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [startPos, setStartPos] = createSignal({ x: 0, y: 0 });
  const [shift, setShift] = createSignal({ x: 0, y: 0 });
  
  let mainRef;
  let preStickyRef;
  let progressCircleRef;
  const threshold = 30;
  const circumference = 2 * Math.PI * 30; // r=30

  // 处理滚动事件
  const handleScroll = () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
    const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
    
    setScrollPercent(Math.round(percent));
    
    if (progressCircleRef) {
      const offset = circumference - (percent / 100) * circumference;
      progressCircleRef.style.strokeDashoffset = offset;
    }
  };

  // 检测边缘
  const detectEdges = (x, y) => {
    const left = x - shift().x;
    const top = y - shift().y;
    const right = window.innerWidth - left - mainRef.clientWidth;
    const bottom = window.innerHeight - top - mainRef.clientHeight;
    
    if (left < threshold) {
      setDirection("left");
      return true;
    } else if (right < threshold) {
      setDirection("right");
      return true;
    } else if (top < threshold) {
      setDirection("top");
      return true;
    } else if (bottom < threshold) {
      setDirection("bottom");
      return true;
    } else {
      setDirection("");
      return false;
    }
  };

  // 切换状态
  const toggleState = (toState) => {
    if (preStickyRef) {
      preStickyRef.style.opacity = 0;
    }
    
    switch(toState) {
      case "dragging":
        setState("dragging");
        break;
      case "active":
        setState("active");
        break;
      case "default":
        setState("default");
        const pos = position();
        switch(direction()) {
          case "top":
            setPosition({ x: pos.x, y: 0 });
            break;
          case "right":
            setPosition({ x: window.innerWidth - mainRef.clientWidth, y: pos.y });
            break;
          case "bottom":
            setPosition({ x: pos.x, y: window.innerHeight - mainRef.clientHeight });
            break;
          case "left":
            setPosition({ x: 0, y: pos.y });
            break;
        }
        break;
      case "sticky":
        setState("sticky");
        const currentPos = position();
        switch(direction()) {
          case "top":
            setPosition({ x: currentPos.x, y: -mainRef.clientHeight / 2 });
            break;
          case "right":
            setPosition({ x: window.innerWidth - mainRef.clientWidth / 2, y: currentPos.y });
            break;
          case "bottom":
            setPosition({ x: currentPos.x, y: window.innerHeight - mainRef.clientHeight / 2 });
            break;
          case "left":
            setPosition({ x: -mainRef.clientWidth / 2, y: currentPos.y });
            break;
        }
        break;
      case "pre-sticky":
        // 预吸附状态样式
        break;
    }
  };

  // 鼠标/触摸开始
  const onStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    if (state() === "default" || state() === "active") {
      setStartPos({ x: clientX, y: clientY });
      
      const rect = mainRef.getBoundingClientRect();
      setShift({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
      
      setIsDragging(true);
      
      // 添加事件监听
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchmove", onMove);
      document.addEventListener("touchend", onEnd);
    } else if (state() === "sticky") {
      toggleState("default");
    }
  };

  // 移动
  const onMove = (e) => {
    if (!isDragging()) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const moveX = clientX - startPos().x;
    const moveY = clientY - startPos().y;
    
    if (state() === "default" || state() === "active") {
      if (moveX * moveX + moveY * moveY > 10) {
        if (state() === "active") {
          toggleState("default");
        }
        toggleState("dragging");
      }
    } else if (state() === "dragging") {
      setPosition({
        x: clientX - shift().x,
        y: clientY - shift().y
      });
      
      if (detectEdges(clientX, clientY)) {
        // 预吸附状态
        if (preStickyRef) {
          preStickyRef.style.opacity = 0.5;
          switch(direction()) {
            case "top":
              preStickyRef.style.transform = "rotate(90deg) translate(0px, 30px)";
              break;
            case "right":
              preStickyRef.style.transform = "rotate(180deg) translate(30px, 0px)";
              break;
            case "bottom":
              preStickyRef.style.transform = "rotate(270deg) translate(0px, -30px)";
              break;
            case "left":
              preStickyRef.style.transform = "rotate(0deg) translate(-30px, 0px)";
              break;
          }
        }
      } else {
        if (preStickyRef) {
          preStickyRef.style.opacity = 0;
        }
      }
    }
  };

  // 结束
  const onEnd = (e) => {
    setIsDragging(false);
    
    // 移除事件监听
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onEnd);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onEnd);
    
    switch (state()) {
      case "dragging":
        if (direction()) {
          toggleState("sticky");
        } else {
          toggleState("default");
        }
        break;
      case "default":
        toggleState("active");
        break;
      default:
        toggleState("default");
    }
  };

  // 生命周期
  onMount(() => {
    window.addEventListener("scroll", handleScroll);
    
    // 初始位置
    setPosition({
      x: window.innerWidth - 80,
      y: window.innerHeight - 80
    });
  });
  
  onCleanup(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  // 应用位置样式
  createEffect(() => {
    const pos = position();
    if (mainRef) {
      mainRef.style.left = `${pos.x}px`;
      mainRef.style.top = `${pos.y}px`;
    }
  });

  return (
    <div 
      ref={mainRef}
      classList={{
        [styles.floatingActionButton]: true,
        [styles.main]: true,
        [styles.dragging]: state() === "dragging",
        [styles.active]: state() === "active",
        [styles.sticky]: state() === "sticky",
        [styles.default]: state() === "default"
      }}
      onMouseDown={onStart}
      onTouchStart={onStart}
    >
      <div class={styles.icon}>{scrollPercent()}%</div>
      <div ref={preStickyRef} class={styles.preSticky}></div>
      <svg class={styles.progressRing}>
        <circle 
          ref={progressCircleRef}
          class={styles.progressCircle}
          cx="31" 
          cy="31" 
          r="30" 
          stroke-dasharray={circumference}
          stroke-dashoffset={circumference}
        ></circle>
      </svg>
    </div>
  );
};

export default FAB;