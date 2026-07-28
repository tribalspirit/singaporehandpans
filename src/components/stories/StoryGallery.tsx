import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import {
  buildLightboxSlide,
  storyblokImageTransform,
} from '../../lib/galleryApi';
import type { GalleryMediaItem, LightboxSlide } from '../../types/gallery';
import styles from './StoryGallery.module.scss';

// Reuse the existing YARL wrapper; lazy-loaded so the lightbox bundle only
// downloads when a visitor actually opens a photo.
const LightboxViewer = lazy(() => import('../gallery/LightboxViewer'));

const AUTOPLAY_DELAY = 4500;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const THUMB_WIDTH = 800;

type Props = {
  items: GalleryMediaItem[];
  title?: string;
};

export default function StoryGallery({ items, title }: Props) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) =>
      setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const autoplayPlugin = useMemo(() => {
    if (prefersReducedMotion || items.length <= 1) return null;
    return Autoplay({ delay: AUTOPLAY_DELAY, stopOnInteraction: true });
  }, [prefersReducedMotion, items.length]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: items.length > 1, align: 'start', containScroll: 'trimSnaps' },
    autoplayPlugin ? [autoplayPlugin] : []
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const slides: LightboxSlide[] = useMemo(
    () => items.map(buildLightboxSlide),
    [items]
  );

  const openAt = useCallback(
    (index: number) => {
      autoplayPlugin?.stop();
      setLightboxIndex(index);
    },
    [autoplayPlugin]
  );
  const handleClose = useCallback(() => setLightboxIndex(-1), []);

  if (items.length === 0) return null;

  const label = title ? `${title} gallery` : 'Photo gallery';

  return (
    <section className={styles.gallery} aria-label={label}>
      {title && <h2 className={styles.gallery__title}>{title}</h2>}

      <div className={styles.gallery__viewport} ref={emblaRef}>
        <div className={styles.gallery__track}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={styles.gallery__slide}
              onClick={() => openAt(index)}
              aria-label={`Open image ${index + 1} of ${items.length}${
                item.alt ? `: ${item.alt}` : ''
              }`}
            >
              <img
                className={styles.gallery__image}
                src={storyblokImageTransform(item.src, THUMB_WIDTH)}
                alt={item.alt}
                width={item.width}
                height={item.height}
                loading="lazy"
                decoding="async"
              />
              <span className={styles.gallery__zoom} aria-hidden="true">
                ⤢
              </span>
            </button>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <div className={styles.gallery__controls}>
          <button
            type="button"
            className={styles.gallery__nav}
            onClick={scrollPrev}
            aria-label="Previous image"
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
            className={styles.gallery__nav}
            onClick={scrollNext}
            aria-label="Next image"
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
      )}

      {lightboxIndex >= 0 && (
        <Suspense fallback={null}>
          <LightboxViewer
            open={lightboxIndex >= 0}
            index={lightboxIndex}
            slides={slides}
            onClose={handleClose}
          />
        </Suspense>
      )}
    </section>
  );
}
