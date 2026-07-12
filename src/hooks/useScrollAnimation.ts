/**
 * useScrollAnimation Hook
 * Professional scroll-triggered animations with parallax support
 * Optimized for performance with throttling and cleanup
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { throttle, calculateScrollProgress, calculateViewportParallax } from '@/lib/animations';

interface UseScrollAnimationOptions {
  threshold?: number;
  parallaxIntensity?: number;
  triggerOnce?: boolean;
}

interface ScrollAnimationState {
  isVisible: boolean;
  progress: number;
  parallaxOffset: number;
}

/**
 * Hook for scroll-triggered animations
 * @param options - Animation options
 * @returns Animation state and ref
 */
export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
) {
  const {
    threshold = 0.1,
    parallaxIntensity = 0.3,
    triggerOnce = false,
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScrollAnimationState>({
    isVisible: false,
    progress: 0,
    parallaxOffset: 0,
  });
  const [hasTriggered, setHasTriggered] = useState(false);

  const handleScroll = useCallback(
    throttle(() => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const progress = calculateScrollProgress(rect);
      const isVisible = progress > threshold;

      // If triggerOnce and already triggered, don't update
      if (triggerOnce && hasTriggered && isVisible) {
        return;
      }

      const parallaxOffset = calculateViewportParallax(rect, parallaxIntensity);

      setState({
        isVisible,
        progress,
        parallaxOffset,
      });

      if (isVisible && triggerOnce) {
        setHasTriggered(true);
      }
    }, 16), // ~60fps
    [threshold, parallaxIntensity, triggerOnce, hasTriggered]
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    elementRef,
    ...state,
  };
}

/**
 * Hook for parallax scroll effect
 * @param intensity - Parallax intensity (0-1)
 * @returns Parallax offset and ref
 */
export function useParallaxScroll(intensity: number = 0.3) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  const handleScroll = useCallback(
    throttle(() => {
      if (!elementRef.current) return;
      const rect = elementRef.current.getBoundingClientRect();
      const offset = calculateViewportParallax(rect, intensity);
      setParallaxOffset(offset);
    }, 16),
    [intensity]
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return {
    elementRef,
    parallaxOffset,
  };
}

/**
 * Hook for staggered animations
 * @param itemCount - Number of items to animate
 * @param baseDelay - Base delay in ms
 * @param increment - Delay increment in ms
 * @returns Array of delays
 */
export function useStaggerAnimation(
  itemCount: number,
  baseDelay: number = 0,
  increment: number = 50
) {
  return Array.from(
    { length: itemCount },
    (_, i) => baseDelay + i * increment
  );
}

/**
 * Hook for fade-in-up animation on scroll
 * @param options - Animation options
 * @returns Animation state and ref
 */
export function useFadeInUpAnimation(
  options: UseScrollAnimationOptions = {}
) {
  const animation = useScrollAnimation({
    threshold: 0.1,
    parallaxIntensity: 0,
    triggerOnce: true,
    ...options,
  });

  return {
    ...animation,
    style: {
      opacity: animation.isVisible ? 1 : 0,
      transform: animation.isVisible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  };
}

/**
 * Hook for scale animation on scroll
 * @param options - Animation options
 * @returns Animation state and ref
 */
export function useScaleAnimation(
  options: UseScrollAnimationOptions = {}
) {
  const animation = useScrollAnimation({
    threshold: 0.1,
    parallaxIntensity: 0,
    triggerOnce: true,
    ...options,
  });

  return {
    ...animation,
    style: {
      opacity: animation.isVisible ? 1 : 0,
      transform: animation.isVisible ? 'scale(1)' : 'scale(0.95)',
      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  };
}

/**
 * Hook for hover animations
 * @returns Hover state and handlers
 */
export function useHoverAnimation() {
  const [isHovered, setIsHovered] = useState(false);

  return {
    isHovered,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    style: {
      transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
      boxShadow: isHovered
        ? '0 12px 24px rgba(0, 0, 0, 0.15)'
        : '0 2px 8px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  };
}

export default {
  useScrollAnimation,
  useParallaxScroll,
  useStaggerAnimation,
  useFadeInUpAnimation,
  useScaleAnimation,
  useHoverAnimation,
};
