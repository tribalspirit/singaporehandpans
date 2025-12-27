import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
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

import type { PlaybackState } from './types';

export type PlaybackMode = 'simultaneous' | 'arpeggio';

interface ChordsSectionProps {
  availableNotes: string[];
  selectedChord: PlayableChord | null;
  onChordSelect: (chord: PlayableChord | null) => void;
  playbackState: PlaybackState;
  onPlaybackStateChange: (state: PlaybackState) => void;
  playbackMode: PlaybackMode;
  onPlaybackModeChange: (mode: PlaybackMode) => void;
  arpeggioBpm: number;
  onArpeggioBpmChange: (bpm: number) => void;
}

export default function ChordsSection({
  availableNotes,
  selectedChord,
  onChordSelect,
  playbackState,
  onPlaybackStateChange,
  playbackMode,
  onPlaybackModeChange,
  arpeggioBpm,
  onArpeggioBpmChange,
}: ChordsSectionProps) {
  const onPlaybackStateChangeRef = React.useRef(onPlaybackStateChange);

  React.useEffect(() => {
    onPlaybackStateChangeRef.current = onPlaybackStateChange;
  }, [onPlaybackStateChange]);

  const diatonicTriads = useMemo(() => {
    return getDiatonicTriads(availableNotes, availableNotes);
  }, [availableNotes]);

  const addedNoteChords = useMemo(() => {
    const allChords = findPlayableChords(availableNotes);
    const filtered = allChords.filter((chord) => {
      return (
        chord.category === 'advanced' &&
        chord.notes.length >= 3 &&
        chord.notes.length <= 5 &&
        chord.notes.every((note) => availableNotes.includes(note))
      );
    });

    // Group by root note (from canonical detection)
    const grouped = new Map<string, PlayableChord[]>();
    for (const chord of filtered) {
      const root = chord.rootPc || chord.pitchClasses[0] || '';
      if (!grouped.has(root)) {
        grouped.set(root, []);
      }
      grouped.get(root)!.push(chord);
    }

    // Convert to array of groups, sorted by root
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([root, chords]) => ({ root, chords }));
  }, [availableNotes]);

  const handleChordClick = useCallback(
    (chord: PlayableChord) => {
      if (selectedChord?.name === chord.name) {
        onChordSelect(null);
      } else {
        onChordSelect(chord);
      }
    },
    [selectedChord, onChordSelect]
  );

  const handlePlay = useCallback(async () => {
    if (!selectedChord || playbackState.isPlaying) {
      return;
    }

    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }

      onPlaybackStateChange({
        activePitchClass: null,
        activeNote: null,
        isPlaying: true,
      });

      if (playbackMode === 'simultaneous') {
        playChord(selectedChord.notes, 1000);
        setTimeout(() => {
          onPlaybackStateChange({
            activePitchClass: null,
            activeNote: null,
            isPlaying: false,
          });
        }, 1000);
      } else {
        playArpeggio({
          notes: selectedChord.notes,
          bpm: arpeggioBpm,
          direction: 'up',
          onStep: (step) => {
            onPlaybackStateChangeRef.current({
              activePitchClass: step.pitchClass,
              activeNote: step.note,
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
      }
    } catch (error) {
      onPlaybackStateChange({
        activePitchClass: null,
        activeNote: null,
        isPlaying: false,
      });
    }
  }, [
    selectedChord,
    playbackState.isPlaying,
    playbackMode,
    arpeggioBpm,
    onPlaybackStateChange,
  ]);

  const handleStop = useCallback(() => {
    if (playbackMode === 'arpeggio') {
      stopArpeggio();
    }
    onPlaybackStateChange({
      activePitchClass: null,
      activeNote: null,
      isPlaying: false,
    });
  }, [playbackMode, onPlaybackStateChange]);

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
            onPlay={handlePlay}
            onStop={handleStop}
          />
        </div>
      )}

      {diatonicTriads.length > 0 && (
        <div className={styles.triadsSection}>
          <h3 className={styles.sectionTitle}>
            Main Triads (Circle of Fifths)
          </h3>
          <div className={styles.triadsRow}>
            {diatonicTriads.map((triad) => {
              const isSelected = selectedChord?.name === triad.chord.name;
              return (
                <button
                  key={triad.chord.name}
                  type="button"
                  className={`${styles.triadTile} ${isSelected ? styles.triadTileSelected : ''} ${triad.isTonic ? styles.triadTileTonic : ''} ${triad.isRelativeMajor ? styles.triadTileRelativeMajor : ''}`}
                  onClick={() => handleChordClick(triad.chord)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.triadName}>
                    {triad.chord.displayName}
                  </span>
                  <span className={styles.triadNotes}>
                    {triad.chord.notes.join(' ')}
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
