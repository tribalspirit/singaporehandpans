import React, { useId } from 'react';
import type { PlaybackMode } from './types';
import {
  MAX_ARPEGGIO_BPM as MAX_BPM,
  MIN_ARPEGGIO_BPM as MIN_BPM,
} from './widgetProps';
import styles from '../styles/PlaybackOptions.module.scss';

const MODE_OPTIONS: ReadonlyArray<{ value: PlaybackMode; label: string }> = [
  { value: 'arpeggio', label: 'Roll' },
  { value: 'simultaneous', label: 'Strum' },
];

interface PlaybackOptionsProps {
  playbackMode: PlaybackMode;
  onPlaybackModeChange: (mode: PlaybackMode) => void;
  arpeggioBpm: number;
  onArpeggioBpmChange: (bpm: number) => void;
}

/**
 * How a chord is sounded, kept out of the action row.
 *
 * Neither control earns a permanent slot beside Play: the speed slider is
 * disabled half the time and both are near-zero value in a first session. They
 * are still here for the players who do want them — behind the bar's options
 * disclosure rather than deleted.
 *
 * A segmented pair of radios rather than the former single toggle button. The
 * toggle showed the *current* mode while its label announced the *other* one,
 * so what it read and what it did disagreed; with both options visible the
 * question does not arise.
 */
export default function PlaybackOptions({
  playbackMode,
  onPlaybackModeChange,
  arpeggioBpm,
  onArpeggioBpmChange,
}: PlaybackOptionsProps) {
  // Generated, not hardcoded: two widgets on one page would otherwise share
  // these ids and break every label association on the second instance.
  const modeLabelId = useId();
  const bpmId = useId();

  const handleBpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const bpm = Number.parseInt(event.target.value, 10);
    if (!Number.isNaN(bpm) && bpm >= MIN_BPM && bpm <= MAX_BPM) {
      onArpeggioBpmChange(bpm);
    }
  };

  return (
    <div className={styles.options}>
      <div className={styles.field}>
        <span className={styles.fieldLabel} id={modeLabelId}>
          Sound
        </span>
        <div
          className={styles.modeToggle}
          role="radiogroup"
          aria-labelledby={modeLabelId}
        >
          {MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={[
                styles.modeOption,
                playbackMode === option.value ? styles.modeOptionActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <input
                type="radio"
                name="playback-mode"
                value={option.value}
                checked={playbackMode === option.value}
                onChange={() => onPlaybackModeChange(option.value)}
                className={styles.modeInput}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={bpmId} className={styles.fieldLabel}>
          Speed <span className={styles.fieldValue}>{arpeggioBpm} BPM</span>
        </label>
        <input
          id={bpmId}
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          value={arpeggioBpm}
          onChange={handleBpmChange}
          className={styles.slider}
          disabled={playbackMode === 'simultaneous'}
        />
        {playbackMode === 'simultaneous' && (
          <p className={styles.fieldHint}>Speed applies to Roll only.</p>
        )}
      </div>
    </div>
  );
}
