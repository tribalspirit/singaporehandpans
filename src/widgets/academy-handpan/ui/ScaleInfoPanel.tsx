import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { initializeAudio, isAudioInitialized, playNote } from '../audio/engine';
import { playArpeggio, stopArpeggio } from '../audio/scheduler';
import { sortNotesByPitch } from '../theory/utils';
import { normalizeToPitchClass } from '../theory/normalize';
import type { PlaybackState } from './types';
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
  playbackState: PlaybackState;
  onPlaybackStateChange: (state: PlaybackState) => void;
  onChordSelect?: () => void;
  availableNotes?: string[];
}

export default function ScaleInfoPanel({
  scaleInfo,
  scaleNotes,
  playbackState,
  onPlaybackStateChange,
  onChordSelect,
  availableNotes = [],
}: ScaleInfoPanelProps) {
  const onPlaybackStateChangeRef = useRef(onPlaybackStateChange);

  // Keep ref up to date
  useEffect(() => {
    onPlaybackStateChangeRef.current = onPlaybackStateChange;
  }, [onPlaybackStateChange]);

  useEffect(() => {
    if (scaleInfo) {
      stopArpeggio();
      onPlaybackStateChange({
        activePitchClass: null,
        activeNote: null,
        isPlaying: false,
      });
    }
  }, [scaleInfo?.name, scaleInfo?.description, onPlaybackStateChange]);

  const sortedNotes = useMemo(() => {
    return sortNotesByPitch([...scaleNotes]);
  }, [scaleNotes]);

  const handlePlay = useCallback(async () => {
    if (sortedNotes.length === 0 || playbackState.isPlaying) {
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

      onPlaybackStateChange({
        activePitchClass: null,
        activeNote: null,
        isPlaying: true,
      });

      playArpeggio({
        notes: sortedNotes,
        bpm: 120,
        direction: 'up',
        onStep: (step) => {
          // Update unified playback state - set both activeNote and activePitchClass for full sync
          onPlaybackStateChangeRef.current({
            activePitchClass: normalizeToPitchClass(step.note), // Enable pitch-class highlighting for handpan
            activeNote: step.note, // Use exact note match for scale notes
            isPlaying: true,
          });
        },
        onComplete: () => {
          onPlaybackStateChangeRef.current({
            activePitchClass: null,
            activeNote: null,
            isPlaying: false,
          });
        },
      });
    } catch (error) {
      onPlaybackStateChange({
        activePitchClass: null,
        activeNote: null,
        isPlaying: false,
      });
    }
  }, [
    sortedNotes,
    playbackState.isPlaying,
    onPlaybackStateChange,
    onChordSelect,
  ]);

  const handleStop = useCallback(() => {
    stopArpeggio();
    onPlaybackStateChange({
      activePitchClass: null,
      activeNote: null,
      isPlaying: false,
    });
  }, [onPlaybackStateChange]);

  const handleNoteClick = useCallback(
    async (note: string) => {
      try {
        if (!isAudioInitialized()) {
          await initializeAudio();
        }

        // Reset selected chord if any was selected
        if (onChordSelect) {
          onChordSelect();
        }

        playNote(note, 500);

        // Update unified playback state - set both activeNote and activePitchClass for full sync
        onPlaybackStateChange({
          activePitchClass: normalizeToPitchClass(note), // Enable pitch-class highlighting for handpan
          activeNote: note, // Use exact note match for scale notes
          isPlaying: false,
        });

        // Clear highlight after note duration
        setTimeout(() => {
          onPlaybackStateChange({
            activePitchClass: null,
            activeNote: null,
            isPlaying: false,
          });
        }, 500);
      } catch (error) {
        try {
          await initializeAudio();
          playNote(note, 500);
          onPlaybackStateChange({
            activePitchClass: normalizeToPitchClass(note),
            activeNote: note,
            isPlaying: false,
          });
          setTimeout(() => {
            onPlaybackStateChange({
              activePitchClass: null,
              activeNote: null,
              isPlaying: false,
            });
          }, 500);
        } catch (retryError) {
          // Audio initialization failed
        }
      }
    },
    [onChordSelect, onPlaybackStateChange]
  );

  // Update scale note highlight logic to use pitch-class match for robustness
  const getNoteHighlightState = useCallback(
    (note: string) => {
      // Prefer pitch-class match (works across octaves)
      if (playbackState.activePitchClass) {
        return normalizeToPitchClass(note) === playbackState.activePitchClass;
      }
      // Fallback to exact note match
      if (playbackState.activeNote) {
        return playbackState.activeNote === note;
      }
      return false;
    },
    [playbackState]
  );

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
              const isActive = getNoteHighlightState(note);
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
