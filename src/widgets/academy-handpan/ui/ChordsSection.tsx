import React, { useMemo, useCallback, useRef } from 'react';
import { usePlayback } from './usePlayback';
import { findPlayableChords, type PlayableChord } from '../theory/chords';
import { getDiatonicTriads } from '../theory/diatonicTriads';
import {
  initializeAudio,
  isAudioInitialized,
  playChord,
} from '../audio/engine';
import { playArpeggio, stopArpeggio } from '../audio/scheduler';
import { normalizeToPitchClass } from '../theory/normalize';
import Controls from './Controls';
import styles from '../styles/ChordsSection.module.scss';

export type PlaybackMode = 'simultaneous' | 'arpeggio';

interface ChordsSectionProps {
  availableNotes: string[];
  selectedChord: PlayableChord | null;
  onChordSelect: (chord: PlayableChord | null) => void;
  playbackMode: PlaybackMode;
  onPlaybackModeChange: (mode: PlaybackMode) => void;
  arpeggioBpm: number;
  onArpeggioBpmChange: (bpm: number) => void;
}

export default function ChordsSection({
  availableNotes,
  selectedChord,
  onChordSelect,
  playbackMode,
  onPlaybackModeChange,
  arpeggioBpm,
  onArpeggioBpmChange,
}: ChordsSectionProps) {
  const {
    state: playbackState,
    setChordPitchClassesActive,
    setIsPlaying,
    clearPlayback,
  } = usePlayback();
  const setChordPitchClassesActiveRef = useRef(setChordPitchClassesActive);
  const setIsPlayingRef = useRef(setIsPlaying);
  const clearPlaybackRef = useRef(clearPlayback);

  React.useEffect(() => {
    setChordPitchClassesActiveRef.current = setChordPitchClassesActive;
  }, [setChordPitchClassesActive]);
  React.useEffect(() => {
    setIsPlayingRef.current = setIsPlaying;
  }, [setIsPlaying]);
  React.useEffect(() => {
    clearPlaybackRef.current = clearPlayback;
  }, [clearPlayback]);

  const diatonicTriads = useMemo(() => {
    return getDiatonicTriads(availableNotes, availableNotes);
  }, [availableNotes]);

  const addedNoteChords = useMemo(() => {
    const allChords = findPlayableChords(availableNotes);
    const filtered = allChords.filter(
      (chord) =>
        chord.category === 'advanced' &&
        chord.notes.length >= 3 &&
        chord.notes.length <= 5 &&
        chord.notes.every((note) => availableNotes.includes(note))
    );
    const grouped = new Map<string, PlayableChord[]>();
    for (const chord of filtered) {
      const root = chord.rootPc || chord.pitchClasses[0] || '';
      if (!grouped.has(root)) {
        grouped.set(root, []);
      }
      grouped.get(root)!.push(chord);
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([root, chords]) => ({ root, chords }));
  }, [availableNotes]);

  const handleChordClick = useCallback(
    (chord: PlayableChord) => {
      if (selectedChord && chord.name === selectedChord.name) {
        onChordSelect(null);
      } else {
        onChordSelect(chord);
      }
    },
    [selectedChord, onChordSelect]
  );

  const handlePlayChord = useCallback(async () => {
    if (!selectedChord || playbackState.isPlaying) {
      return;
    }
    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }
      stopArpeggio();
      setIsPlayingRef.current(true);
      if (playbackMode === 'simultaneous') {
        setChordPitchClassesActiveRef.current(selectedChord.pitchClasses);
        playChord(selectedChord.notes, 1000);
        setTimeout(() => {
          clearPlaybackRef.current();
        }, 1000);
      } else {
        playArpeggio({
          notes: selectedChord.notes,
          bpm: arpeggioBpm,
          direction: 'up',
          onStep: (step) => {
            setChordPitchClassesActiveRef.current([
              normalizeToPitchClass(step.note),
            ]);
          },
          onComplete: () => {
            clearPlaybackRef.current();
          },
        });
      }
    } catch (error) {
      console.error('Error during chord playback', error);
      clearPlaybackRef.current();
    }
  }, [selectedChord, playbackState.isPlaying, playbackMode, arpeggioBpm]);

  const handleStopChord = useCallback(() => {
    stopArpeggio();
    clearPlaybackRef.current();
  }, []);

  return (
    <div className={styles.chordsSection}>
      {selectedChord && (
        <div className={styles.chordControls}>
          <Controls
            selectedChord={selectedChord}
            playbackMode={playbackMode}
            onPlaybackModeChange={onPlaybackModeChange}
            arpeggioBpm={arpeggioBpm}
            onArpeggioBpmChange={onArpeggioBpmChange}
            isPlaying={playbackState.isPlaying}
            onPlay={handlePlayChord}
            onStop={handleStopChord}
          />
        </div>
      )}

      {diatonicTriads.length > 0 && (
        <div className={styles.triadsSection}>
          <h3 className={styles.sectionTitle}>
            Main Triads (Circle of Fifths)
          </h3>
          <div className={styles.triadsRow}>
            {diatonicTriads.map(({ chord, isTonic, isRelativeMajor }) => {
              const isSelected = selectedChord?.name === chord.name;
              return (
                <button
                  key={chord.name}
                  type="button"
                  className={[
                    styles.triadTile,
                    isSelected ? styles.triadTileSelected : '',
                    isTonic ? styles.triadTileTonic : '',
                    isRelativeMajor ? styles.triadTileRelativeMajor : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleChordClick(chord)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.triadName}>{chord.displayName}</span>
                  <span className={styles.triadNotes}>
                    {chord.notes.join(' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {addedNoteChords.length > 0 && (
        <div className={styles.fourNoteSection}>
          <h3 className={styles.sectionTitle}>Added Note Chords</h3>
          <p className={styles.sectionDescription}>
            Includes 7ths, 9ths, sus chords, add chords, and common
            handpan-friendly voicings.
          </p>
          <div className={styles.chordGroups}>
            {addedNoteChords.map(({ root, chords }) => (
              <div key={root} className={styles.chordGroup}>
                <h4 className={styles.groupTitle}>{root}</h4>
                <div className={styles.chordGrid}>
                  {chords.map((chord) => {
                    const isSelected = selectedChord?.name === chord.name;
                    return (
                      <button
                        key={chord.name}
                        type="button"
                        className={`${styles.chordItem} ${isSelected ? styles.chordItemSelected : ''}`}
                        onClick={() => handleChordClick(chord)}
                        aria-pressed={isSelected}
                      >
                        <span className={styles.chordName}>
                          {chord.displayName}
                        </span>
                        <span className={styles.chordNotes}>
                          {chord.notes.join(' ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {diatonicTriads.length === 0 && addedNoteChords.length === 0 && (
        <p className={styles.emptyMessage}>
          No playable chords found for this handpan.
        </p>
      )}
    </div>
  );
}
