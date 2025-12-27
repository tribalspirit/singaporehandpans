import { useState, useCallback, useMemo, useEffect } from 'react';
import { getAllHandpanConfigs, getHandpanConfig } from '../config/handpans';
import HandpanRenderer from './HandpanRenderer';
import ScaleInfoPanel from './ScaleInfoPanel';
import ChordsSection from './ChordsSection';
import type { HandpanPad } from '../config/types';
import type { PlayableChord } from '../theory/chords';
import type { PlaybackMode } from './ChordsSection';
import { initializeAudio, isAudioInitialized, playNote } from '../audio/engine';
import { normalizeToPitchClass } from '../theory/normalize';
import { note } from '@tonaljs/core';
import type { PlaybackState } from './types';
import styles from '../styles/HandpanWidget.module.scss';

function pickBestPadNoteForPc(
  layout: HandpanPad[],
  pc: string
): string | null {
  const matches = layout.filter(
    (p) => normalizeToPitchClass(p.note) === pc
  );
  if (matches.length === 0) return null;

  const bottom = matches.find((m) => m.role === 'bottom');
  if (bottom) return bottom.note;

  const sorted = matches.sort((a, b) => {
    const midiA = note(a.note).midi ?? 999;
    const midiB = note(b.note).midi ?? 999;
    return midiA - midiB;
  });
  return sorted[0].note;
}

export default function HandpanWidget() {
  const configs = getAllHandpanConfigs();
  const [selectedHandpanId, setSelectedHandpanId] = useState<string>(
    configs[0]?.id || ''
  );
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    activePadNote: null,
    activePitchClasses: null,
    isPlaying: false,
  });
  const [selectedChord, setSelectedChord] = useState<PlayableChord | null>(
    null
  );
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('arpeggio');
  const [arpeggioBpm, setArpeggioBpm] = useState<number>(120);

  const selectedHandpan = getHandpanConfig(selectedHandpanId);
  const selectedScaleInfo = useMemo(() => {
    if (!selectedHandpan) return null;
    return {
      name: selectedHandpan.scaleName,
      aliases: selectedHandpan.scaleAliases,
      description: selectedHandpan.scaleDescription,
      moodTags: selectedHandpan.scaleMoodTags,
    };
  }, [selectedHandpanId]);

  useEffect(() => {
    setSelectedChord(null);
    setPlaybackState({
      activePadNote: null,
      activePitchClasses: null,
      isPlaying: false,
    });
  }, [selectedHandpanId]);

  const selectedNotes = useMemo(() => {
    const notes = new Set<string>();
    if (selectedChord && selectedHandpan) {
      const highlightPitchClasses = new Set(selectedChord.pitchClasses);
      selectedHandpan.notes.forEach((note) => {
        const pc = normalizeToPitchClass(note);
        if (highlightPitchClasses.has(pc)) {
          notes.add(note);
        }
      });
    }
    return notes;
  }, [selectedChord, selectedHandpan]);

  const activeNotes = useMemo(() => {
    const notes = new Set<string>();
    if (!selectedHandpan) return notes;

    // Priority 1: Exact pad note match (for single-note interactions)
    if (playbackState.activePadNote) {
      const hasExact = selectedHandpan.layout.some(
        (p) => p.note === playbackState.activePadNote
      );
      if (hasExact) {
        notes.add(playbackState.activePadNote);
        return notes; // IMPORTANT: no pitch-class highlight when exact note is known
      }

      // If exact pad doesn't exist, map to closest pad of same pitch class
      const pc = normalizeToPitchClass(playbackState.activePadNote);
      const mapped = pickBestPadNoteForPc(selectedHandpan.layout, pc);
      if (mapped) {
        notes.add(mapped);
      }
      return notes;
    }

    // Priority 2: Conceptual pitch-class highlights (for chords)
    if (
      playbackState.activePitchClasses &&
      playbackState.activePitchClasses.length > 0
    ) {
      const pitchClassSet = new Set(playbackState.activePitchClasses);
      selectedHandpan.layout.forEach((pad) => {
        if (pitchClassSet.has(normalizeToPitchClass(pad.note))) {
          notes.add(pad.note);
        }
      });
    }

    return notes;
  }, [
    playbackState.activePadNote,
    playbackState.activePitchClasses,
    selectedHandpan,
  ]);

  const handlePadClick = useCallback(async (pad: HandpanPad) => {
    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }

      playNote(pad.note, 500);

      // Set exact pad note only (no pitch-class highlight for single-note clicks)
      setPlaybackState({
        activePadNote: pad.note,
        activePitchClasses: null,
        isPlaying: false,
      });

      setTimeout(() => {
        setPlaybackState({
          activePadNote: null,
          activePitchClasses: null,
          isPlaying: false,
        });
      }, 500);
    } catch (error) {
        try {
          await initializeAudio();
          playNote(pad.note, 500);
          setPlaybackState({
            activePadNote: pad.note,
            activePitchClasses: null,
            isPlaying: false,
          });
          setTimeout(() => {
            setPlaybackState({
              activePadNote: null,
              activePitchClasses: null,
              isPlaying: false,
            });
          }, 500);
      } catch (retryError) {
        // Audio initialization failed
      }
    }
  }, []);

  const handleChordSelect = useCallback(
    (chord: PlayableChord | null) => {
      setSelectedChord(chord);
      // Reset playback state when chord changes
      setPlaybackState({
        activePadNote: null,
        activePitchClasses: chord ? chord.pitchClasses : null,
        isPlaying: false,
      });
    },
    []
  );

  if (!selectedHandpan) {
    return <div>No handpan configuration available</div>;
  }

  return (
    <div className={styles.handpanWidget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Handpan Memorization</h2>
        <div className={styles.selector}>
          <label htmlFor="handpan-select" className={styles.label}>
            Select Handpan:
          </label>
          <select
            id="handpan-select"
            value={selectedHandpanId}
            onChange={(e) => {
              setSelectedHandpanId(e.target.value);
            }}
            className={styles.select}
            aria-label="Select handpan type"
          >
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.topRow}>
        <div className={styles.handpanSection}>
          <HandpanRenderer
            key={selectedHandpanId}
            config={selectedHandpan}
            selectedNotes={selectedNotes}
            activeNotes={activeNotes}
            onPadClick={handlePadClick}
          />
        </div>
        <div className={styles.scaleInfoSection}>
          <ScaleInfoPanel
            key={`${selectedHandpanId}-${selectedHandpan.scaleName}-${selectedHandpan.scaleDescription}`}
            scaleInfo={selectedScaleInfo}
            scaleNotes={selectedHandpan.notes}
            playbackState={playbackState}
            onPlaybackStateChange={setPlaybackState}
            onChordSelect={() => setSelectedChord(null)}
            availableNotes={selectedHandpan.notes}
          />
        </div>
      </div>
      <div className={styles.chordsSectionWrapper}>
        <ChordsSection
          key={selectedHandpanId}
          availableNotes={selectedHandpan.notes}
          selectedChord={selectedChord}
          onChordSelect={handleChordSelect}
          playbackState={playbackState}
          onPlaybackStateChange={setPlaybackState}
          playbackMode={playbackMode}
          onPlaybackModeChange={setPlaybackMode}
          arpeggioBpm={arpeggioBpm}
          onArpeggioBpmChange={setArpeggioBpm}
        />
      </div>
    </div>
  );
}
