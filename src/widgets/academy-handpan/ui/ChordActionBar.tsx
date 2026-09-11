import React, { useEffect, useId, useRef, useState } from 'react';
import * as Chord from '@tonaljs/chord';
import type { PlayableChord } from '../theory/chords';
import type { PlaybackMode } from './types';
import PlaybackOptions from './PlaybackOptions';
import styles from '../styles/ChordActionBar.module.scss';

interface ChordActionBarProps {
  selectedChord: PlayableChord | null;
  playbackMode: PlaybackMode;
  onPlaybackModeChange: (mode: PlaybackMode) => void;
  arpeggioBpm: number;
  onArpeggioBpmChange: (bpm: number) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  /**
   * Starts fetching the audio module. The bar sits outside the warmed views,
   * and while Play is disabled until a chord is picked from inside them, that
   * is an implicit dependency — warm on the control that makes the sound.
   */
  onWarmAudio: () => void;
}

/**
 * The persistent home for whatever is currently selected.
 *
 * Selecting a chord used to inject a control block above the chord list,
 * pushing every tile down the page; deselecting pulled it back out. On a phone
 * that moved the thing you had just tapped off screen. The bar is always
 * present and always the same height — only its contents change — so nothing
 * you are looking at moves.
 */
export default function ChordActionBar({
  selectedChord,
  playbackMode,
  onPlaybackModeChange,
  arpeggioBpm,
  onArpeggioBpmChange,
  isPlaying,
  onPlay,
  onStop,
  onWarmAudio,
}: ChordActionBarProps) {
  const optionsId = useId();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const optionsToggleRef = useRef<HTMLButtonElement>(null);

  // The options popover is a transient surface over the bar, so Escape has to
  // dismiss it and hand focus back to the control that opened it.
  useEffect(() => {
    if (!isOptionsOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOptionsOpen(false);
        optionsToggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOptionsOpen]);

  const chordData = selectedChord ? Chord.get(selectedChord.name) : null;
  const chordDetail =
    chordData?.type || chordData?.intervals?.join(' ') || selectedChord?.name;

  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.chordInfo}>
          {selectedChord ? (
            <>
              <span className={styles.chordName}>
                {selectedChord.displayName}
              </span>
              <span className={styles.chordNotes}>
                {selectedChord.notes.join(' ')}
                <span className={styles.chordHighlightNote}>
                  {' '}
                  — highlighted on the pan
                </span>
              </span>
              {chordDetail && (
                <span className={styles.chordDetail}>{chordDetail}</span>
              )}
            </>
          ) : (
            <span className={styles.placeholder}>
              Pick a chord to hear it and see it on the pan
            </span>
          )}
        </div>

        <div className={styles.actions}>
          <div className={styles.optionsWrapper}>
            <button
              ref={optionsToggleRef}
              type="button"
              className={styles.optionsToggle}
              aria-expanded={isOptionsOpen}
              aria-controls={optionsId}
              aria-label="Playback options"
              onClick={() => setIsOptionsOpen((open) => !open)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="16" x2="20" y2="16" />
                <circle cx="9" cy="8" r="2" fill="currentColor" />
                <circle cx="15" cy="16" r="2" fill="currentColor" />
              </svg>
            </button>
            <div
              id={optionsId}
              className={styles.optionsPopover}
              hidden={!isOptionsOpen}
            >
              <PlaybackOptions
                playbackMode={playbackMode}
                onPlaybackModeChange={onPlaybackModeChange}
                arpeggioBpm={arpeggioBpm}
                onArpeggioBpmChange={onArpeggioBpmChange}
              />
            </div>
          </div>

          {!isPlaying ? (
            <button
              type="button"
              className={styles.playButton}
              onClick={onPlay}
              onPointerDown={onWarmAudio}
              onFocus={onWarmAudio}
              disabled={!selectedChord}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
              Play
            </button>
          ) : (
            <button
              type="button"
              className={styles.stopButton}
              onClick={onStop}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
