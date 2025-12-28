import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { usePlayback } from './usePlayback';
import { initializeAudio, isAudioInitialized, playNote } from '../audio/engine';
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
  onChordSelect?: () => void;
}

export default function ScaleInfoPanel({
  scaleInfo,
  scaleNotes,
  onChordSelect,
}: ScaleInfoPanelProps) {
  const {
    state: playbackState,
    setNoteActive,
    setIsPlaying,
    clearPlayback,
  } = usePlayback();
  const onChordSelectRef = useRef(onChordSelect);
  const setNoteActiveRef = useRef(setNoteActive);
  const clearPlaybackRef = useRef(clearPlayback);
  const setIsPlayingRef = useRef(setIsPlaying);

  useEffect(() => {
    onChordSelectRef.current = onChordSelect;
  }, [onChordSelect]);

  useEffect(() => {
    setNoteActiveRef.current = setNoteActive;
    clearPlaybackRef.current = clearPlayback;
    setIsPlayingRef.current = setIsPlaying;
  }, [setNoteActive, clearPlayback, setIsPlaying]);

  useEffect(() => {
    stopArpeggio();
    clearPlaybackRef.current();
    setIsPlayingRef.current(false);
  }, [scaleInfo?.name]);

  const sortedNotes = useMemo(
    () => sortNotesByPitch([...scaleNotes]),
    [scaleNotes]
  );

  const handlePlayScale = useCallback(async () => {
    if (sortedNotes.length === 0 || playbackState.isPlaying) {
      return;
    }
    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }
      if (onChordSelectRef.current) {
        onChordSelectRef.current();
      }
      setIsPlayingRef.current(true);
      playArpeggio({
        notes: sortedNotes,
        bpm: 120,
        direction: 'up',
        onStep: (step) => {
          setNoteActiveRef.current(step.note, 'scalePlayback');
        },
        onComplete: () => {
          clearPlaybackRef.current();
        },
      });
    } catch (error) {
      console.error('Failed to play scale arpeggio', error);
      clearPlaybackRef.current();
    }
  }, [sortedNotes, playbackState.isPlaying]);

  const handleStopScale = useCallback(() => {
    stopArpeggio();
    clearPlaybackRef.current();
  }, []);

  const handleNoteClick = useCallback(async (note: string) => {
    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }
      if (onChordSelectRef.current) {
        onChordSelectRef.current();
      }
      playNote(note, 500);
      setNoteActiveRef.current(note, 'note');
      setTimeout(() => {
        clearPlaybackRef.current();
      }, 500);
    } catch (error) {
      try {
        await initializeAudio();
        playNote(note, 500);
        setNoteActiveRef.current(note, 'note');
        setTimeout(() => {
          clearPlaybackRef.current();
        }, 500);
      } catch (retryError) {
        console.error('Failed to play scale note', note, retryError);
      }
    }
  }, []);

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
          {!playbackState.isPlaying ? (
            <button
              type="button"
              className={styles.playButton}
              onClick={handlePlayScale}
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
              onClick={handleStopScale}
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
        <div className={styles.descriptionWrapper}>
          <p className={styles.scaleDescription}>{scaleInfo.description}</p>
          <div className={styles.infoTooltipWrapper}>
            <span className={styles.infoIcon} aria-label="Layout information">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
            <div className={styles.tooltip}>
              Note: This virtual handpan layout is representative. Actual note positions may vary depending on the manufacturer and specific model.
            </div>
          </div>
        </div>
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
              const isActive = playbackState.activeNote === note;
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
