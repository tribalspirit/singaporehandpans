import React from 'react';
import * as Chord from '@tonaljs/chord';
import type { PlaybackMode } from './ChordsSection';
import type { PlayableChord } from '../theory/chords';
import styles from '../styles/Controls.module.scss';

interface ControlsProps {
  selectedChord: PlayableChord;
  playbackMode: PlaybackMode;
  onPlaybackModeChange: (mode: PlaybackMode) => void;
  arpeggioBpm: number;
  onArpeggioBpmChange: (bpm: number) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

const MIN_BPM = 60;
const MAX_BPM = 200;

export default function Controls({
  selectedChord,
  playbackMode,
  onPlaybackModeChange,
  arpeggioBpm,
  onArpeggioBpmChange,
  isPlaying,
  onPlay,
  onStop,
}: ControlsProps) {
  const chordData = Chord.get(selectedChord.name);
  const chordFormula = chordData.intervals?.join(' ') || '';
  const chordType = chordData.type || '';

  const handleModeToggle = () => {
    onPlaybackModeChange(
      playbackMode === 'arpeggio' ? 'simultaneous' : 'arpeggio'
    );
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bpm = parseInt(e.target.value, 10);
    if (!isNaN(bpm) && bpm >= MIN_BPM && bpm <= MAX_BPM) {
      onArpeggioBpmChange(bpm);
    }
  };

  return (
    <div className={styles.controls}>
      <div className={styles.chordInfo}>
        <div className={styles.chordName}>{selectedChord.displayName}</div>
        <div className={styles.chordNotes}>{selectedChord.notes.join(' ')}</div>
        <div className={styles.chordFormula}>
          {chordType || chordFormula || selectedChord.name}
        </div>
      </div>

      <div className={styles.controlsGroup}>
        <button
          type="button"
          className={`${styles.modeToggle} ${playbackMode === 'arpeggio' ? styles.modeToggleArpeggio : styles.modeToggleSimultaneous}`}
          onClick={handleModeToggle}
          aria-label={`Switch to ${playbackMode === 'arpeggio' ? 'simultaneous' : 'arpeggio'} mode`}
        >
          {playbackMode === 'arpeggio' ? 'Arpeggio' : 'Simultaneous'}
        </button>

        <div className={styles.speedControl}>
          <label htmlFor="bpm-slider" className={styles.speedLabel}>
            {arpeggioBpm} BPM
          </label>
          <input
            id="bpm-slider"
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={arpeggioBpm}
            onChange={handleBpmChange}
            className={styles.slider}
            disabled={playbackMode === 'simultaneous'}
            aria-label="Arpeggio speed in BPM"
          />
        </div>

        <div className={styles.playbackButtons}>
          {!isPlaying ? (
            <button
              type="button"
              className={styles.playButton}
              onClick={onPlay}
              aria-label="Play chord"
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
              onClick={onStop}
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
    </div>
  );
}
