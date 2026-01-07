/**
 * 常量定义
 */

/** 阅读速度（每分钟字数） */
export const READING_SPEED = 200;

/** 滚动阈值（像素） */
export const SCROLL_THRESHOLD = 50;

/** 响应式断点 */
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 968,
  wide: 1200,
} as const;

/** 动画持续时间 */
export const ANIMATION_DURATION = {
  fast: "0.15s",
  normal: "0.3s",
  slow: "0.45s",
} as const;

/** 缓动函数 */
export const EASING = {
  default: "ease",
  smooth: "cubic-bezier(.2,.8,.2,1)",
} as const;
