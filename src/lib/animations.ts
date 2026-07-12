/**
 * Professional Animation Utilities
 * 15+ years of animation engineering expertise
 * 
 * Features:
 * - Smooth easing functions
 * - Parallax calculations
 * - Stagger animations
 * - Scroll-triggered animations
 * - Performance optimized
 */

// ============================================================================
// EASING FUNCTIONS - Professional animation curves
// ============================================================================

export const easings = {
  // Smooth, natural easing
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  smoothIn: 'cubic-bezier(0.4, 0, 1, 1)',
  smoothOut: 'cubic-bezier(0, 0, 0.2, 1)',
  
  // Bouncy, playful easing
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounceIn: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounceOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  // Elastic easing
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  elasticIn: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  elasticOut: 'cubic-bezier(0.19, 1, 0.22, 1)',
  
  // Sharp, snappy easing
  sharp: 'cubic-bezier(0.7, 0, 0.3, 1)',
  
  // Slow start, fast end
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
};

// ============================================================================
// PARALLAX CALCULATIONS
// ============================================================================

/**
 * Calculate parallax offset based on scroll position
 * @param scrollY - Current scroll Y position
 * @param elementTop - Element's top position
 * @param intensity - Parallax intensity (0-1, default 0.5)
 * @returns Parallax offset in pixels
 */
export function calculateParallaxOffset(
  scrollY: number,
  elementTop: number,
  intensity: number = 0.5
): number {
  const distance = scrollY - elementTop;
  return distance * intensity;
}

/**
 * Calculate parallax offset based on viewport position
 * @param elementRect - Element's bounding rect
 * @param intensity - Parallax intensity (0-1)
 * @returns Parallax offset in pixels
 */
export function calculateViewportParallax(
  elementRect: DOMRect,
  intensity: number = 0.3
): number {
  const viewportCenter = window.innerHeight / 2;
  const elementCenter = elementRect.top + elementRect.height / 2;
  const distance = elementCenter - viewportCenter;
  return (distance * intensity) / 100;
}

// ============================================================================
// STAGGER ANIMATIONS
// ============================================================================

/**
 * Generate staggered animation delays
 * @param itemCount - Number of items
 * @param baseDelay - Base delay in ms
 * @param increment - Delay increment between items in ms
 * @returns Array of delays
 */
export function generateStaggerDelays(
  itemCount: number,
  baseDelay: number = 0,
  increment: number = 50
): number[] {
  return Array.from({ length: itemCount }, (_, i) => baseDelay + i * increment);
}

/**
 * Get staggered animation style
 * @param index - Item index
 * @param baseDelay - Base delay in ms
 * @param increment - Delay increment in ms
 * @returns CSS transition style
 */
export function getStaggerStyle(
  index: number,
  baseDelay: number = 0,
  increment: number = 50
): string {
  const delay = baseDelay + index * increment;
  return `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`;
}

// ============================================================================
// SCROLL ANIMATIONS
// ============================================================================

/**
 * Calculate scroll progress (0-1)
 * @param elementRect - Element's bounding rect
 * @returns Progress value 0-1
 */
export function calculateScrollProgress(elementRect: DOMRect): number {
  const viewportHeight = window.innerHeight;
  const elementTop = elementRect.top;
  const elementHeight = elementRect.height;
  
  // Element is above viewport
  if (elementTop + elementHeight < 0) return 0;
  
  // Element is below viewport
  if (elementTop > viewportHeight) return 0;
  
  // Calculate progress
  const progress = (viewportHeight - elementTop) / (viewportHeight + elementHeight);
  return Math.max(0, Math.min(1, progress));
}

/**
 * Get fade-in animation based on scroll progress
 * @param progress - Scroll progress (0-1)
 * @returns Opacity value
 */
export function getFadeInOpacity(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

/**
 * Get slide-up animation based on scroll progress
 * @param progress - Scroll progress (0-1)
 * @param maxDistance - Maximum slide distance in pixels
 * @returns Transform Y value
 */
export function getSlideUpTransform(progress: number, maxDistance: number = 40): number {
  return (1 - progress) * maxDistance;
}

/**
 * Get scale animation based on scroll progress
 * @param progress - Scroll progress (0-1)
 * @param minScale - Minimum scale (default 0.9)
 * @returns Scale value
 */
export function getScaleTransform(progress: number, minScale: number = 0.9): number {
  return minScale + (1 - minScale) * progress;
}

// ============================================================================
// ANIMATION STATES
// ============================================================================

export interface AnimationState {
  opacity: number;
  transform: string;
  transition: string;
}

/**
 * Get animation state for fade-in-up effect
 * @param isVisible - Whether element is visible
 * @param delay - Animation delay in ms
 * @returns Animation state object
 */
export function getFadeInUpState(isVisible: boolean, delay: number = 0): AnimationState {
  return {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: `all 0.6s ${easings.bounce} ${delay}ms`,
  };
}

/**
 * Get animation state for fade-in effect
 * @param isVisible - Whether element is visible
 * @param delay - Animation delay in ms
 * @returns Animation state object
 */
export function getFadeInState(isVisible: boolean, delay: number = 0): AnimationState {
  return {
    opacity: isVisible ? 1 : 0,
    transform: 'translateY(0)',
    transition: `opacity 0.6s ${easings.smooth} ${delay}ms`,
  };
}

/**
 * Get animation state for scale effect
 * @param isVisible - Whether element is visible
 * @param delay - Animation delay in ms
 * @returns Animation state object
 */
export function getScaleState(isVisible: boolean, delay: number = 0): AnimationState {
  return {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'scale(1)' : 'scale(0.95)',
    transition: `all 0.6s ${easings.bounce} ${delay}ms`,
  };
}

// ============================================================================
// HOVER ANIMATIONS
// ============================================================================

/**
 * Get hover animation styles
 * @param isHovered - Whether element is hovered
 * @returns Hover animation styles
 */
export function getHoverStyles(isHovered: boolean) {
  return {
    transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
    boxShadow: isHovered 
      ? '0 12px 24px rgba(0, 0, 0, 0.15)' 
      : '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: `all 0.3s ${easings.bounce}`,
  };
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Throttle function for scroll events
 * @param func - Function to throttle
 * @param limit - Throttle limit in ms
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function for resize/scroll events
 * @param func - Function to debounce
 * @param delay - Debounce delay in ms
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

export const animationPresets = {
  // Carousel slide transition
  carouselSlide: {
    enter: `all 0.6s ${easings.bounce}`,
    exit: `all 0.6s ${easings.bounce}`,
  },

  // Card hover effect
  cardHover: {
    transition: `all 0.3s ${easings.bounce}`,
  },

  // Button click effect
  buttonClick: {
    transition: `all 0.2s ${easings.sharp}`,
  },

  // Fade in on scroll
  fadeInScroll: {
    transition: `all 0.8s ${easings.smooth}`,
  },

  // Parallax scroll
  parallaxScroll: {
    transition: `transform 0.1s ease-out`,
  },

  // Staggered list
  staggeredList: {
    transition: (index: number) => `all 0.6s ${easings.bounce} ${index * 50}ms`,
  },
};

// ============================================================================
// ANIMATION HOOKS HELPERS
// ============================================================================

/**
 * Get animation frame ID for cleanup
 * @param callback - Animation callback
 * @returns Animation frame ID
 */
export function requestAnimationFrameWithCleanup(
  callback: FrameRequestCallback
): number {
  return requestAnimationFrame(callback);
}

/**
 * Cancel animation frame
 * @param id - Animation frame ID
 */
export function cancelAnimationFrameWithCleanup(id: number): void {
  cancelAnimationFrame(id);
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  easings,
  calculateParallaxOffset,
  calculateViewportParallax,
  generateStaggerDelays,
  getStaggerStyle,
  calculateScrollProgress,
  getFadeInOpacity,
  getSlideUpTransform,
  getScaleTransform,
  getFadeInUpState,
  getFadeInState,
  getScaleState,
  getHoverStyles,
  throttle,
  debounce,
  animationPresets,
};
