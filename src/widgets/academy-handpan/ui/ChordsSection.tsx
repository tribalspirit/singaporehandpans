import { useState, useMemo, useCallback } from 'react';
import { findPlayableChords, type PlayableChord } from '../theory/chords';
import { getDiatonicTriads } from '../theory/diatonicTriads';
import { initializeAudio, isAudioInitialized, playChord } from '../audio/engine';
import { playArpeggio, stopArpeggio } from '../audio/scheduler';
import Controls from './Controls';
import styles from '../styles/ChordsSection.module.scss';

export type PlaybackMode = 'simultaneous' | 'arpeggio';

interface ChordsSectionProps {
  availableNotes: string[];
  selectedChord: PlayableChord | null;
  onChordSelect: (chord: PlayableChord | null) => void;
  onActiveNotesChange: (notes: Set<string>) => void;
  playbackMode: PlaybackMode;
  onPlaybackModeChange: (mode: PlaybackMode) => void;
  arpeggioBpm: number;
  onArpeggioBpmChange: (bpm: number) => void;
}

export default function ChordsSection({
  availableNotes,
  selectedChord,
  onChordSelect,
  onActiveNotesChange,
  playbackMode,
  onPlaybackModeChange,
  arpeggioBpm,
  onArpeggioBpmChange,
}: ChordsSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const diatonicTriads = useMemo(() => {
    return getDiatonicTriads(availableNotes, availableNotes);
  }, [availableNotes]);

  const fourNoteChords = useMemo(() => {
    const allChords = findPlayableChords(availableNotes);
    const filtered = allChords.filter((chord) => {
      return (
        chord.category === 'advanced' &&
        chord.notes.length === 4 &&
        chord.notes.every((note) => availableNotes.includes(note))
      );
    });
    
    // Group by root note (first pitch class)
    const grouped = new Map<string, PlayableChord[]>();
    for (const chord of filtered) {
      const root = chord.pitchClasses[0] || '';
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

  return (
    <div className={styles.chordsSection}>
      {selectedChord && (
        <div className={styles.chordControls}>
          <Controls
            playbackMode={playbackMode}
            onPlaybackModeChange={onPlaybackModeChange}
            arpeggioBpm={arpeggioBpm}
            onArpeggioBpmChange={onArpeggioBpmChange}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onStop={handleStop}
          />
        </div>
      )}

      {diatonicTriads.length > 0 && (
        <div className={styles.triadsSection}>
          <h3 className={styles.sectionTitle}>Main Triads (Circle of Fifths)</h3>
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
                  <span className={styles.triadName}>{triad.chord.displayName}</span>
                  <span className={styles.triadNotes}>
                    {triad.chord.notes.join(' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {fourNoteChords.length > 0 && (
        <div className={styles.fourNoteSection}>
          <h3 className={styles.sectionTitle}>4-Note Chords</h3>
          <div className={styles.chordGroups}>
            {fourNoteChords.map(({ root, chords }) => (
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
                        <span className={styles.chordName}>{chord.displayName}</span>
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

      {diatonicTriads.length === 0 && fourNoteChords.length === 0 && (
        <p className={styles.emptyMessage}>No playable chords found for this handpan.</p>
      )}
    </div>
  );
}

