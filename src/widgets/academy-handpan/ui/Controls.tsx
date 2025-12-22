import React from 'react';
import type { PlaybackMode } from './ChordsPanel';
import styles from '../styles/Controls.module.scss';

interface ControlsProps {
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
const DEFAULT_BPM = 120;

export default function Controls({
  playbackMode,
  onPlaybackModeChange,
  arpeggioBpm,
  onArpeggioBpmChange,
  isPlaying,
  onPlay,
  onStop,
}: ControlsProps) {
  const handleModeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPlaybackModeChange(e.target.value as PlaybackMode);
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bpm = parseInt(e.target.value, 10);
    if (!isNaN(bpm) && bpm >= MIN_BPM && bpm <= MAX_BPM) {
      onArpeggioBpmChange(bpm);
    }
  };

  return (
    <div className={styles.controls}>
      <div className={styles.modeToggle}>
        <label className={styles.toggleLabel}>
          <input
            type="radio"
            name="playback-mode"
            value="simultaneous"
            checked={playbackMode === 'simultaneous'}
            onChange={handleModeToggle}
            className={styles.radioInput}
          />
          <span className={styles.toggleOption}>Simultaneous</span>
        </label>
        <label className={styles.toggleLabel}>
          <input
            type="radio"
            name="playback-mode"
            value="arpeggio"
            checked={playbackMode === 'arpeggio'}
            onChange={handleModeToggle}
            className={styles.radioInput}
          />
          <span className={styles.toggleOption}>Arpeggio</span>
        </label>
      </div>

      {playbackMode === 'arpeggio' && (
        <div className={styles.speedControl}>
          <label htmlFor="bpm-slider" className={styles.speedLabel}>
            Speed: {arpeggioBpm} BPM
          </label>
          <input
            id="bpm-slider"
            type="range"
            min={MIN_BPM}
            max={MAX_BPM}
            value={arpeggioBpm}
            onChange={handleBpmChange}
            className={styles.slider}
            aria-label="Arpeggio speed in BPM"
          />
        </div>
      )}

      <div className={styles.playbackButtons}>
        {!isPlaying ? (
          <button
            type="button"
            className={styles.playButton}
            onClick={onPlay}
            aria-label="Play chord"
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
            onClick={onStop}
            aria-label="Stop playback"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

