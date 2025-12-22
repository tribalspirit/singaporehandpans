import { useEffect, useCallback, useState, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import styles from './HeroBackgroundCarousel.module.scss';

const HERO_IMAGES = [
  '/images/hero/hero-placeholder-1.jpg',
  '/images/hero/hero-placeholder-2.jpg',
  '/images/hero/hero-placeholder-3.jpg',
  '/images/hero/hero-placeholder-4.jpg',
  '/images/hero/hero-placeholder-5.jpg',
];

const AUTOPLAY_DELAY = 5000;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

interface HeroBackgroundCarouselProps {
  className?: string;
}

export default function HeroBackgroundCarousel({
  className = '',
}: HeroBackgroundCarouselProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const autoplayPlugin = useMemo(() => {
    if (prefersReducedMotion) return null;
    return new Autoplay({
      delay: AUTOPLAY_DELAY,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    });
  }, [prefersReducedMotion]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: prefersReducedMotion ? 0 : 20,
    },
    autoplayPlugin ? [autoplayPlugin] : []
  );

  useEffect(() => {
    if (!emblaApi || !autoplayPlugin) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        autoplayPlugin.stop();
      } else if (!isAutoplayPaused && !prefersReducedMotion) {
        autoplayPlugin.play();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!isAutoplayPaused && !prefersReducedMotion) {
              autoplayPlugin.play();
            }
          } else {
            autoplayPlugin.stop();
          }
        });
      },
      { threshold: 0.1 }
    );

    const emblaNode = emblaApi.rootNode();
    if (emblaNode) {
      observer.observe(emblaNode);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
    };
  }, [emblaApi, autoplayPlugin, isAutoplayPaused, prefersReducedMotion]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const handlePausePlay = useCallback(() => {
    if (!autoplayPlugin) return;

    if (autoplayPlugin.isPlaying()) {
      autoplayPlugin.stop();
      setIsAutoplayPaused(true);
    } else {
      autoplayPlugin.play();
      setIsAutoplayPaused(false);
    }
  }, [autoplayPlugin]);

  return (
    <div className={`${styles.carousel} ${className}`} ref={emblaRef}>
      <div className={styles.carousel__container}>
        {HERO_IMAGES.map((image, index) => (
          <div key={image} className={styles.carousel__slide}>
            <img
              src={image}
              alt={`Hero background ${index + 1}`}
              className={styles.carousel__image}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </div>
        ))}
      </div>

      <div className={styles.carousel__controls}>
        <button
          type="button"
          className={styles.carousel__button}
          onClick={scrollPrev}
          aria-label="Previous slide"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <button
          type="button"
          className={styles.carousel__button}
          onClick={scrollNext}
          aria-label="Next slide"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className={styles.carousel__pagination} role="tablist" aria-label="Carousel pagination">
        {HERO_IMAGES.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`${styles.carousel__dot} ${
              index === selectedIndex ? styles['carousel__dot--active'] : ''
            }`}
            onClick={() => scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-selected={index === selectedIndex}
            role="tab"
          />
        ))}
      </div>

      {autoplayPlugin && (
        <button
          type="button"
          className={styles.carousel__autoplay}
          onClick={handlePausePlay}
          aria-label={autoplayPlugin.isPlaying() ? 'Pause carousel' : 'Play carousel'}
        >
          {autoplayPlugin.isPlaying() ? (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

