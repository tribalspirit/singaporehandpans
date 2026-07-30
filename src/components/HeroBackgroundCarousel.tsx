import { useEffect, useCallback, useState, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';
import styles from './HeroBackgroundCarousel.module.scss';

const HERO_IMAGES = [
  '/images/hero/hero-placeholder-1.jpg',
  '/images/hero/hero-placeholder-2.jpg',
  '/images/hero/hero-placeholder-3.jpg',
  '/images/hero/hero-placeholder-4.jpg',
  '/images/hero/hero-placeholder-5.jpg',
];

// A background that moves every five seconds fights the calm brief
const AUTOPLAY_DELAY = 9000;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

interface HeroBackgroundCarouselProps {
  className?: string;
}

export default function HeroBackgroundCarousel({
  className = '',
}: HeroBackgroundCarouselProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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
    return Autoplay({
      delay: AUTOPLAY_DELAY,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    });
  }, [prefersReducedMotion]);

  // Cross-fade rather than slide: a photograph sliding under the headline
  // pulls the eye sideways, a dissolve does not. Fade is skipped entirely
  // under reduced motion, leaving an instant cut.
  const plugins = useMemo(() => {
    const active = [];
    if (autoplayPlugin) active.push(autoplayPlugin);
    if (!prefersReducedMotion) active.push(Fade());
    return active;
  }, [autoplayPlugin, prefersReducedMotion]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: prefersReducedMotion ? 0 : 40,
    },
    plugins
  );

  useEffect(() => {
    if (!emblaApi || !autoplayPlugin) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        autoplayPlugin.stop();
      } else if (!prefersReducedMotion) {
        autoplayPlugin.play();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!prefersReducedMotion) {
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
  }, [emblaApi, autoplayPlugin, prefersReducedMotion]);

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

      {/*
        Prev/next arrows are deliberately not rendered — they competed with the
        hero CTA. The pagination dots stay: autoplay is still running, so
        removing every control would leave no way to pause or advance
        (WCAG 2.2.2).
      */}
      <div
        className={styles.carousel__pagination}
        role="tablist"
        aria-label="Carousel pagination"
      >
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
    </div>
  );
}
