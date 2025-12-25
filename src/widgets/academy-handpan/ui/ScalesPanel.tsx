import { useState, useMemo, useCallback } from 'react';
import { findPlayableScales, type PlayableScale } from '../theory/scales';
import { initializeAudio, isAudioInitialized } from '../audio/engine';
import { playArpeggio, stopArpeggio } from '../audio/scheduler';
import { HANDPAN_SCALE_CATALOG } from '../config/scaleCatalog';
import styles from '../styles/ScalesPanel.module.scss';

interface ScalesPanelProps {
  availableNotes: string[];
  selectedScale: PlayableScale | null;
  onScaleSelect: (scale: PlayableScale | null) => void;
  onActiveNotesChange: (notes: Set<string>) => void;
}

export default function ScalesPanel({
  availableNotes,
  selectedScale,
  onScaleSelect,
  onActiveNotesChange,
}: ScalesPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCatalogExpanded, setIsCatalogExpanded] = useState(false);

  const playableScales = useMemo(() => {
    return findPlayableScales(availableNotes);
  }, [availableNotes]);

  const handleScaleClick = useCallback((scale: PlayableScale) => {
    if (selectedScale?.name === scale.name) {
      onScaleSelect(null);
    } else {
      onScaleSelect(scale);
    }
  }, [selectedScale, onScaleSelect]);

  const handlePlay = useCallback(async () => {
    if (!selectedScale || isPlaying) {
      return;
    }

    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }

      setIsPlaying(true);
      onActiveNotesChange(new Set());

      playArpeggio({
        notes: selectedScale.notes,
        bpm: 120,
        direction: 'up',
        onStep: (note) => {
          onActiveNotesChange(new Set([note]));
        },
        onComplete: () => {
          setIsPlaying(false);
          onActiveNotesChange(new Set());
        },
      });
    } catch (error) {
      setIsPlaying(false);
      onActiveNotesChange(new Set());
    }
  }, [selectedScale, isPlaying, onActiveNotesChange]);

  const handleStop = useCallback(() => {
    stopArpeggio();
    setIsPlaying(false);
    onActiveNotesChange(new Set());
  }, [onActiveNotesChange]);

  if (playableScales.length === 0) {
    return (
      <div className={styles.scalesPanel}>
        <p className={styles.emptyMessage}>No playable scales found for this handpan.</p>
      </div>
    );
  }

  return (
    <div className={styles.scalesPanel}>
      <div className={styles.catalogSection}>
        <button
          type="button"
          className={styles.catalogToggle}
          onClick={() => setIsCatalogExpanded(!isCatalogExpanded)}
          aria-expanded={isCatalogExpanded}
          aria-controls="scale-catalog"
        >
          <span className={styles.catalogToggleText}>Handpan Scale Catalog</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`${styles.catalogToggleIcon} ${isCatalogExpanded ? styles.catalogToggleIconExpanded : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {isCatalogExpanded && (
          <div id="scale-catalog" className={styles.catalogList}>
            {HANDPAN_SCALE_CATALOG.map((entry) => (
              <div key={entry.id} className={styles.catalogItem}>
                <div className={styles.catalogItemHeader}>
                  <span className={styles.catalogItemName}>{entry.name}</span>
                  {entry.aliases && entry.aliases.length > 0 && (
                    <span className={styles.catalogItemAliases}>
                      ({entry.aliases.join(', ')})
                    </span>
                  )}
                </div>
                <p className={styles.catalogItemDescription}>{entry.description}</p>
                <div className={styles.catalogItemTags}>
                  {entry.moodTags.map((tag) => (
                    <span key={tag} className={styles.catalogItemTag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.header}>
        <h3 className={styles.title}>Playable Scales & Modes</h3>
        {selectedScale && (
          <div className={styles.controls}>
            {!isPlaying ? (
              <button
                type="button"
                className={styles.playButton}
                onClick={handlePlay}
                aria-label="Play scale"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Play
              </button>
            ) : (
              <button
                type="button"
                className={styles.stopButton}
                onClick={handleStop}
                aria-label="Stop playback"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="6" y="6" width="12" height="12"/>
                </svg>
                Stop
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.scaleList}>
        {playableScales.map((scale) => {
          const isSelected = selectedScale?.name === scale.name;
          return (
            <button
              key={scale.name}
              type="button"
              className={`${styles.scaleItem} ${isSelected ? styles.scaleItemSelected : ''}`}
              onClick={() => handleScaleClick(scale)}
              aria-pressed={isSelected}
            >
              <span className={styles.scaleName}>{scale.displayName}</span>
              <span className={styles.scaleNotes}>
                {scale.notes.join(' ')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

