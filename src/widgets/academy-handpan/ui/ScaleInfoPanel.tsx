import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { initializeAudio, isAudioInitialized, playNote } from '../audio/engine';
import { playArpeggio, stopArpeggio } from '../audio/scheduler';
import { sortNotesByPitch } from '../theory/utils';
import { normalizeToPitchClass } from '../theory/normalize';
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
  onChordSelect?: () => void;
  availableNotes?: string[];
}

export default function ScaleInfoPanel({
  scaleInfo,
  scaleNotes,
  onActiveNotesChange,
  onChordSelect,
  availableNotes = [],
}: ScaleInfoPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const availableNotesRef = useRef(availableNotes);
  const onActiveNotesChangeRef = useRef(onActiveNotesChange);

  // Keep refs up to date
  useEffect(() => {
    availableNotesRef.current = availableNotes;
    onActiveNotesChangeRef.current = onActiveNotesChange;
  }, [availableNotes, onActiveNotesChange]);

  useEffect(() => {
    if (scaleInfo) {
      stopArpeggio();
      setIsPlaying(false);
      setActiveNote(null);
      onActiveNotesChange(new Set());
    }
  }, [scaleInfo?.name, scaleInfo?.description, onActiveNotesChange]);

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

      // Reset selected chord if any was selected
      if (onChordSelect) {
        onChordSelect();
      }

      setIsPlaying(true);
      setActiveNote(null);
      onActiveNotesChange(new Set());

      playArpeggio({
        notes: sortedNotes,
        bpm: 120,
        direction: 'up',
        onStep: (note) => {
          // Update active note in Scale Notes section
          setActiveNote(note);
          
          // Find all notes with the same pitch class to highlight on handpan
          // Use refs to get latest values from Tone.js callback context
          const currentAvailableNotes = availableNotesRef.current;
          const activePitchClass = normalizeToPitchClass(note);
          const matchingNotes = new Set<string>();
          currentAvailableNotes.forEach((availableNote) => {
            if (normalizeToPitchClass(availableNote) === activePitchClass) {
              matchingNotes.add(availableNote);
            }
          });
          
          // Update active notes on handpan widget
          onActiveNotesChangeRef.current(matchingNotes);
        },
        onComplete: () => {
          setIsPlaying(false);
          setActiveNote(null);
          onActiveNotesChangeRef.current(new Set());
        },
      });
    } catch (error) {
      setIsPlaying(false);
      setActiveNote(null);
      onActiveNotesChange(new Set());
    }
  }, [sortedNotes, isPlaying, onActiveNotesChange, onChordSelect, availableNotes]);

  const handleStop = useCallback(() => {
    stopArpeggio();
    setIsPlaying(false);
    setActiveNote(null);
    onActiveNotesChange(new Set());
  }, [onActiveNotesChange]);

  const handleNoteClick = useCallback(async (note: string) => {
    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }

      // Reset selected chord if any was selected
      if (onChordSelect) {
        onChordSelect();
      }

      // Play the note
      playNote(note, 500);

      // Highlight the note in Scale Notes section
      setActiveNote(note);

      // Find all notes with the same pitch class to highlight on handpan
      const activePitchClass = normalizeToPitchClass(note);
      const matchingNotes = new Set<string>();
      availableNotes.forEach((availableNote) => {
        if (normalizeToPitchClass(availableNote) === activePitchClass) {
          matchingNotes.add(availableNote);
        }
      });
      
      // Update active notes immediately
      onActiveNotesChange(matchingNotes);

      // Clear highlight after note duration
      setTimeout(() => {
        setActiveNote(null);
        onActiveNotesChange(new Set());
      }, 500);
    } catch (error) {
      try {
        await initializeAudio();
        playNote(note, 500);
        setActiveNote(note);
        const activePitchClass = normalizeToPitchClass(note);
        const matchingNotes = new Set<string>();
        availableNotes.forEach((availableNote) => {
          if (normalizeToPitchClass(availableNote) === activePitchClass) {
            matchingNotes.add(availableNote);
          }
        });
        onActiveNotesChange(matchingNotes);
        setTimeout(() => {
          setActiveNote(null);
          onActiveNotesChange(new Set());
        }, 500);
      } catch (retryError) {
        // Audio initialization failed
      }
    }
  }, [onChordSelect, availableNotes, onActiveNotesChange]);

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
            {sortedNotes.map((note) => {
              const isActive = activeNote === note;
              return (
                <button
                  key={note}
                  type="button"
                  className={`${styles.noteBadge} ${isActive ? styles.noteBadgeActive : ''}`}
                  onClick={() => handleNoteClick(note)}
                  aria-label={`Play ${note}`}
                >
                  {note}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
