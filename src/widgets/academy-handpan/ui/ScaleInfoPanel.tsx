import { useState, useCallback, useMemo, useEffect } from 'react';
import { initializeAudio, isAudioInitialized } from '../audio/engine';
import { playArpeggio, stopArpeggio } from '../audio/scheduler';
import { sortNotesByPitch } from '../theory/utils';
import styles from '../styles/ScaleInfoPanel.module.scss';

interface ScaleInfo {
  name: string;
  aliases?: string[];
  description: string;
  moodTags: string[];
}

interface ScaleInfoPanelProps {
  scaleInfo: ScaleInfo | null;
  scaleNotes: string[];
  onActiveNotesChange: (notes: Set<string>) => void;
}

export default function ScaleInfoPanel({
  scaleInfo,
  scaleNotes,
  onActiveNotesChange,
}: ScaleInfoPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (scaleInfo) {
      stopArpeggio();
      setIsPlaying(false);
      onActiveNotesChange(new Set());
    }
  }, [scaleInfo?.name, scaleInfo?.description]);

  const sortedNotes = useMemo(() => {
    return sortNotesByPitch([...scaleNotes]);
  }, [scaleNotes]);

  const handlePlay = useCallback(async () => {
    if (sortedNotes.length === 0 || isPlaying) {
      return;
    }

    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }

      setIsPlaying(true);
      onActiveNotesChange(new Set());

      playArpeggio({
        notes: sortedNotes,
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
  }, [sortedNotes, isPlaying, onActiveNotesChange]);

  const handleStop = useCallback(() => {
    stopArpeggio();
    setIsPlaying(false);
    onActiveNotesChange(new Set());
  }, [onActiveNotesChange]);

  if (!scaleInfo) {
    return (
      <div className={styles.scaleInfoPanel}>
        <p className={styles.emptyMessage}>No scale information available.</p>
      </div>
    );
  }

  return (
    <div className={styles.scaleInfoPanel}>
      <div className={styles.header}>
        <div className={styles.scaleHeader}>
          <h3 className={styles.scaleName}>{scaleInfo.name}</h3>
          {scaleInfo.aliases && scaleInfo.aliases.length > 0 && (
            <p className={styles.scaleAliases}>
              {scaleInfo.aliases.join(', ')}
            </p>
          )}
        </div>
        <div className={styles.controls}>
          {!isPlaying ? (
            <button
              type="button"
              className={styles.playButton}
              onClick={handlePlay}
              aria-label="Play scale"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              Stop
            </button>
          )}
        </div>
      </div>

      <div className={styles.scaleContent}>
        <p className={styles.scaleDescription}>{scaleInfo.description}</p>

        <div className={styles.scaleTags}>
          {scaleInfo.moodTags.map((tag) => (
            <span key={tag} className={styles.scaleTag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.scaleNotesSection}>
          <h4 className={styles.notesTitle}>Scale Notes</h4>
          <div className={styles.notesList}>
            {sortedNotes.map((note) => (
              <span key={note} className={styles.noteBadge}>
                {note}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
