import { useState, useMemo, useCallback } from 'react';
import { findPlayableChords, type PlayableChord } from '../theory/chords';
import { initializeAudio, isAudioInitialized, playChord } from '../audio/engine';
import { playArpeggio, stopArpeggio } from '../audio/scheduler';
import Controls from './Controls';
import styles from '../styles/ChordsPanel.module.scss';

export type PlaybackMode = 'simultaneous' | 'arpeggio';

interface ChordsPanelProps {
  availableNotes: string[];
  selectedChord: PlayableChord | null;
  onChordSelect: (chord: PlayableChord | null) => void;
  onActiveNotesChange: (notes: Set<string>) => void;
  playbackMode: PlaybackMode;
  onPlaybackModeChange: (mode: PlaybackMode) => void;
  arpeggioBpm: number;
  onArpeggioBpmChange: (bpm: number) => void;
}

export default function ChordsPanel({
  availableNotes,
  selectedChord,
  onChordSelect,
  onActiveNotesChange,
  playbackMode,
  onPlaybackModeChange,
  arpeggioBpm,
  onArpeggioBpmChange,
}: ChordsPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const playableChords = useMemo(() => {
    return findPlayableChords(availableNotes);
  }, [availableNotes]);

  const basicChords = useMemo(() => {
    return playableChords.filter((chord) => chord.category === 'basic');
  }, [playableChords]);

  const advancedChords = useMemo(() => {
    return playableChords.filter((chord) => chord.category === 'advanced');
  }, [playableChords]);

  const handleChordClick = useCallback((chord: PlayableChord) => {
    if (selectedChord?.name === chord.name) {
      onChordSelect(null);
    } else {
      onChordSelect(chord);
    }
  }, [selectedChord, onChordSelect]);

  const handlePlay = useCallback(async () => {
    if (!selectedChord || isPlaying) {
      return;
    }

    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }

      setIsPlaying(true);
      onActiveNotesChange(new Set());

      if (playbackMode === 'simultaneous') {
        playChord(selectedChord.notes, 1000);
        setTimeout(() => {
          setIsPlaying(false);
          onActiveNotesChange(new Set());
        }, 1000);
      } else {
        playArpeggio({
          notes: selectedChord.notes,
          bpm: arpeggioBpm,
          direction: 'up',
          onStep: (note) => {
            onActiveNotesChange(new Set([note]));
          },
          onComplete: () => {
            setIsPlaying(false);
            onActiveNotesChange(new Set());
          },
        });
      }
    } catch (error) {
      setIsPlaying(false);
      onActiveNotesChange(new Set());
    }
  }, [selectedChord, isPlaying, playbackMode, arpeggioBpm, onActiveNotesChange]);

  const handleStop = useCallback(() => {
    if (playbackMode === 'arpeggio') {
      stopArpeggio();
    }
    setIsPlaying(false);
    onActiveNotesChange(new Set());
  }, [playbackMode, onActiveNotesChange]);

  if (playableChords.length === 0) {
    return (
      <div className={styles.chordsPanel}>
        <p className={styles.emptyMessage}>No playable chords found for this handpan.</p>
      </div>
    );
  }

  return (
    <div className={styles.chordsPanel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Playable Chords</h3>
        {selectedChord && (
          <Controls
            playbackMode={playbackMode}
            onPlaybackModeChange={onPlaybackModeChange}
            arpeggioBpm={arpeggioBpm}
            onArpeggioBpmChange={onArpeggioBpmChange}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onStop={handleStop}
          />
        )}
      </div>

      <div className={styles.chordLists}>
        {basicChords.length > 0 && (
          <div className={styles.chordCategory}>
            <h4 className={styles.categoryTitle}>Basic (Triads)</h4>
            <div className={styles.chordList}>
              {basicChords.map((chord) => {
                const isSelected = selectedChord?.name === chord.name;
                return (
                  <button
                    key={chord.name}
                    type="button"
                    className={`${styles.chordItem} ${isSelected ? styles.chordItemSelected : ''}`}
                    onClick={() => handleChordClick(chord)}
                    aria-pressed={isSelected}
                  >
                    <span className={styles.chordName}>{chord.displayName}</span>
                    <span className={styles.chordNotes}>
                      {chord.notes.join(' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {advancedChords.length > 0 && (
          <div className={styles.chordCategory}>
            <h4 className={styles.categoryTitle}>Advanced (4-note)</h4>
            <div className={styles.chordList}>
              {advancedChords.map((chord) => {
                const isSelected = selectedChord?.name === chord.name;
                return (
                  <button
                    key={chord.name}
                    type="button"
                    className={`${styles.chordItem} ${isSelected ? styles.chordItemSelected : ''}`}
                    onClick={() => handleChordClick(chord)}
                    aria-pressed={isSelected}
                  >
                    <span className={styles.chordName}>{chord.displayName}</span>
                    <span className={styles.chordNotes}>
                      {chord.notes.join(' ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

