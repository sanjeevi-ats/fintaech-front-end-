'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  cta1: { text: string; action: () => void };
  cta2: { text: string; action: () => void };
  background: string;
  overlayOpacity?: number;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
  autoPlayInterval?: number;
  onSlideChange?: (index: number) => void;
}

export default function HeroCarousel({ 
  slides, 
  autoPlayInterval = 5000,
  onSlideChange 
}: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollProgress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / window.innerHeight));
        setParallaxOffset(scrollProgress * 30);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay || isTransitioning) return;

    autoPlayTimerRef.current = setTimeout(() => {
      goToNextSlide();
    }, autoPlayInterval);

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [isAutoPlay, isTransitioning, currentSlide, autoPlayInterval]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    onSlideChange?.(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [isTransitioning, onSlideChange]);

  const goToNextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const goToPrevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const handleMouseEnter = () => {
    setIsAutoPlay(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlay(true);
  };

  const slide = slides[currentSlide];

  return (
    <div
      ref={containerRef}
      className="hero-carousel"
      style={{
        position: 'relative',
        width: '100%',
        height: '500px',
        overflow: 'hidden',
        borderRadius: '16px',
        marginBottom: '32px',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background with parallax */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${slide.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          transform: `translateY(${parallaxOffset}px)`,
          transition: 'transform 0.1s ease-out',
          zIndex: 0,
        }}
      />

      {/* Overlay gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, rgba(0,0,0,${slide.overlayOpacity ?? 0.6}) 0%, rgba(0,0,0,${(slide.overlayOpacity ?? 0.6) * 0.4}) 100%)`,
          zIndex: 1,
          transition: 'background 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Content container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          padding: '40px 20px',
        }}
      >
        {/* Title with staggered animation */}
        <div
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
            textAlign: 'center',
            maxWidth: '800px',
            marginBottom: '16px',
          }}
        >
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-1px',
              lineHeight: 1.1,
              textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              margin: 0,
            }}
          >
            {slide.title}
          </h1>
        </div>

        {/* Subtitle with staggered animation */}
        <div
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s',
            textAlign: 'center',
            maxWidth: '700px',
            marginBottom: '24px',
          }}
        >
          <p
            style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: 1.6,
              margin: 0,
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            {slide.subtitle}
          </p>
        </div>

        {/* Description with staggered animation */}
        <div
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s',
            textAlign: 'center',
            maxWidth: '600px',
            marginBottom: '32px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {slide.description}
          </p>
        </div>

        {/* CTA Buttons with staggered animation */}
        <div
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={slide.cta1.action}
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
              background: 'rgba(99, 102, 241, 0.9)',
              border: '2px solid rgba(99, 102, 241, 0.9)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.9)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
            }}
          >
            {slide.cta1.text} →
          </button>

          <button
            onClick={slide.cta2.action}
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
              background: 'transparent',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              backdropFilter: 'blur(10px)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {slide.cta2.text} →
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevSlide}
        disabled={isTransitioning}
        style={{
          position: 'absolute',
          left: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 3,
          background: 'rgba(255, 255, 255, 0.15)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isTransitioning ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          backdropFilter: 'blur(10px)',
          opacity: isTransitioning ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isTransitioning) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
      >
        <ChevronLeft size={24} color="white" />
      </button>

      <button
        onClick={goToNextSlide}
        disabled={isTransitioning}
        style={{
          position: 'absolute',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 3,
          background: 'rgba(255, 255, 255, 0.15)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isTransitioning ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          backdropFilter: 'blur(10px)',
          opacity: isTransitioning ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isTransitioning) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
        }}
      >
        <ChevronRight size={24} color="white" />
      </button>

      {/* Dot Indicators with smooth animation */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: 'flex',
          gap: '12px',
        }}
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            style={{
              width: index === currentSlide ? '32px' : '10px',
              height: '10px',
              borderRadius: '5px',
              background: index === currentSlide ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
              border: 'none',
              cursor: isTransitioning ? 'not-allowed' : 'pointer',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              opacity: isTransitioning && index !== currentSlide ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isTransitioning && index !== currentSlide) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== currentSlide) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
              }
            }}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 3,
          background: 'rgba(0, 0, 0, 0.4)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
}
