import { useState, useMemo, lazy, Suspense, useCallback } from 'react';
import { MasonryPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/masonry.css';
import { HYPHEN_TO_SPACE_REGEX } from '../../utils/tags';
import {
  storyblokImageTransform,
  buildLightboxSlide,
} from '../../lib/galleryApi';
import type { GalleryMediaItem, LightboxSlide } from '../../types/gallery';
import styles from './MediaGrid.module.scss';

const LightboxViewer = lazy(() => import('./LightboxViewer'));

interface MediaGridProps {
  items: GalleryMediaItem[];
  albumTitle: string;
}

const ALL_TAG = 'all';
const ALL_TAG_LABEL = 'All';

export default function MediaGrid({ items, albumTitle }: MediaGridProps) {
  const [selectedTag, setSelectedTag] = useState<string>(ALL_TAG);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => {
      item.tags.forEach((tag) => tagSet.add(tag));
    });
    return [ALL_TAG, ...Array.from(tagSet).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedTag === ALL_TAG) return items;
    return items.filter((item) => item.tags.includes(selectedTag));
  }, [items, selectedTag]);

  const photos = useMemo(
    () =>
      filteredItems.map((item) => ({
        src: storyblokImageTransform(item.src, 600),
        width: item.width,
        height: item.height,
        alt: item.alt,
        key: item.id,
      })),
    [filteredItems]
  );

  const lightboxSlides: LightboxSlide[] = useMemo(
    () => filteredItems.map(buildLightboxSlide),
    [filteredItems]
  );

  const handleClick = useCallback(
    ({ index }: { index: number }) => setLightboxIndex(index),
    []
  );

  const handleClose = useCallback(() => setLightboxIndex(-1), []);

  const formatTagLabel = (tag: string): string => {
    if (tag === ALL_TAG) return ALL_TAG_LABEL;
    return tag.replace(HYPHEN_TO_SPACE_REGEX, ' ');
  };

  return (
    <div className={styles.mediaGridContainer}>
      {allTags.length > 2 && (
        <div
          className={styles.filters}
          role="tablist"
          aria-label={`${albumTitle} filters`}
        >
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.filterBtn} ${selectedTag === tag ? styles.filterBtnActive : ''}`}
              onClick={() => setSelectedTag(tag)}
              role="tab"
              aria-selected={selectedTag === tag}
              aria-controls="media-grid-content"
            >
              {formatTagLabel(tag)}
            </button>
          ))}
        </div>
      )}

      <div
        id="media-grid-content"
        className={styles.gridWrapper}
        role="region"
        aria-label={`${albumTitle} media`}
      >
        {filteredItems.length === 0 ? (
          <div className={styles.empty}>
            <p>No media found for the selected filter.</p>
          </div>
        ) : (
          <MasonryPhotoAlbum
            photos={photos}
            columns={(containerWidth) => {
              if (containerWidth < 400) return 1;
              if (containerWidth < 700) return 2;
              return 3;
            }}
            spacing={12}
            onClick={handleClick}
            render={{
              extras: (_, { index }) => {
                const item = filteredItems[index];
                if (!item) return null;

                return (
                  <>
                    <div className={styles.photoOverlay}>
                      {item.mediaType === 'video' ? (
                        <div className={styles.playIcon}>
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="var(--color-primary, #8B4513)"
                          >
                            <polygon points="8,5 19,12 8,19" />
                          </svg>
                        </div>
                      ) : (
                        <span className={styles.viewIcon} aria-hidden="true">
                          🔍
                        </span>
                      )}
                    </div>
                    {item.mediaType === 'video' && item.videoDuration && (
                      <div className={styles.videoIndicator}>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                        {item.videoDuration}
                      </div>
                    )}
                  </>
                );
              },
            }}
          />
        )}
      </div>

      {lightboxIndex >= 0 && (
        <Suspense fallback={null}>
          <LightboxViewer
            open={lightboxIndex >= 0}
            index={lightboxIndex}
            slides={lightboxSlides}
            onClose={handleClose}
          />
        </Suspense>
      )}
    </div>
  );
}
