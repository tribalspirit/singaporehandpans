import { useState, useMemo } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { HYPHEN_TO_SPACE_REGEX } from '../utils/tags';
import './GalleryGrid.scss';

interface GalleryImage {
  id: string;
  title: string;
  media?: {
    filename: string;
    alt?: string;
  };
  description?: string;
  tags?: string[];
  alt_text?: string;
  photographer?: string;
  featured?: boolean;
}

interface GalleryGridProps {
  items: GalleryImage[];
}

const ALL_TAG = 'all';
const ALL_TAG_LABEL = 'All';

export default function GalleryGrid({ items }: GalleryGridProps) {
  const [selectedTag, setSelectedTag] = useState<string>(ALL_TAG);
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return [ALL_TAG, ...Array.from(tagSet).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedTag === ALL_TAG) return items;
    return items.filter(
      (item) => item.tags && Array.isArray(item.tags) && item.tags.includes(selectedTag)
    );
  }, [items, selectedTag]);

  const lightboxSlides = useMemo(() => {
    return filteredItems
      .filter((item) => item.media?.filename)
      .map((item) => ({
        src: item.media!.filename,
        alt: item.alt_text || item.media!.alt || item.title,
        title: item.title,
        description: item.description,
      }));
  }, [filteredItems]);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
  };

  const formatTagLabel = (tag: string): string => {
    if (tag === ALL_TAG) return ALL_TAG_LABEL;
    return tag.replace(HYPHEN_TO_SPACE_REGEX, ' ');
  };

  return (
    <div className="gallery-grid-container">
      <div className="gallery-filters" role="tablist" aria-label="Gallery filters">
        {allTags.map((tag) => (
          <button
            key={tag}
            className={`filter-btn ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => setSelectedTag(tag)}
            role="tab"
            aria-selected={selectedTag === tag}
            aria-controls="gallery-content"
          >
            {formatTagLabel(tag)}
          </button>
        ))}
      </div>

      <div
        id="gallery-content"
        className="gallery-grid"
        role="region"
        aria-label="Gallery images"
      >
        {filteredItems.length === 0 ? (
          <div className="gallery-empty">
            <p>No images found for the selected filter.</p>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <article
              key={item.id}
              className={`gallery-item ${item.featured ? 'featured' : ''}`}
            >
              {item.media?.filename ? (
                <button
                  className="gallery-item-image"
                  onClick={() => handleImageClick(index)}
                  aria-label={`View ${item.title} in fullscreen`}
                  type="button"
                >
                  <img
                    src={item.media.filename}
                    alt={item.alt_text || item.media.alt || item.title}
                    loading="lazy"
                  />
                  <div className="gallery-item-overlay">
                    <span className="view-icon" aria-hidden="true">
                      🔍
                    </span>
                  </div>
                </button>
              ) : null}

              <div className="gallery-item-content">
                <h3 className="gallery-item-title">{item.title}</h3>

                {item.description && (
                  <p className="gallery-item-description">{item.description}</p>
                )}

                {item.photographer && (
                  <p className="gallery-item-photographer">
                    Photo by {item.photographer}
                  </p>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="gallery-item-tags">
                    {item.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {formatTagLabel(tag)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={lightboxSlides}
      />
    </div>
  );
}

