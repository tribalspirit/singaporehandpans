import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
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

  // Set once the visitor has deliberately stopped the rotation, so the
  // visibility/intersection handlers below never restart it behind their back.
  const userStoppedRef = useRef(false);

  const autoplayPlugin = useMemo(() => {
    if (prefersReducedMotion) return null;
    return Autoplay({
      delay: AUTOPLAY_DELAY,
      // Both of these were previously forced to false, which removed every way
      // to stop the rotation. The plugin's defaults are what satisfy WCAG
      // 2.2.2: pointer interaction stops it, and stopOnFocusIn (also default
      // true) stops it for keyboard users the moment a dot takes focus.
      stopOnInteraction: true,
      stopOnFocusIn: true,
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

    // A stop the visitor asked for outranks these automatic resumes — without
    // this guard, tabbing away or scrolling the hero out of view and back would
    // silently restart rotation the visitor had deliberately stopped.
    const resumeAutoplay = () => {
      if (prefersReducedMotion || userStoppedRef.current) return;
      autoplayPlugin.play();
    };

    // Any deliberate contact with the carousel — dragging it, or tabbing into
    // the pagination — stops the rotation and is recorded, so the resume guard
    // above will not undo it later. These are plain DOM listeners on the root
    // rather than Embla events on purpose: the plugin only subscribes to
    // pointerDown when the carousel is draggable, and its stopOnFocusIn hangs
    // off slideFocusStart, which never fires here because the slides hold only
    // images and the dots sit outside the container. Listening on the root
    // covers both gestures without depending on that plumbing.
    const stopForUser = () => {
      userStoppedRef.current = true;
      autoplayPlugin.stop();
    };

    const rootNode = emblaApi.rootNode();
    rootNode?.addEventListener('pointerdown', stopForUser);
    rootNode?.addEventListener('focusin', stopForUser);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        autoplayPlugin.stop();
      } else {
        resumeAutoplay();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            resumeAutoplay();
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
      rootNode?.removeEventListener('pointerdown', stopForUser);
      rootNode?.removeEventListener('focusin', stopForUser);
    };
  }, [emblaApi, autoplayPlugin, prefersReducedMotion]);

  // Choosing a slide is an explicit "I'll take it from here": stop the
  // rotation outright rather than only jumping. This is the pagination's
  // WCAG 2.2.2 stop mechanism, so it must not depend on the plugin's own
  // pointer heuristics — keyboard activation never fires pointerDown.
  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      userStoppedRef.current = true;
      autoplayPlugin?.stop();
      emblaApi.scrollTo(index);
    },
    [emblaApi, autoplayPlugin]
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
