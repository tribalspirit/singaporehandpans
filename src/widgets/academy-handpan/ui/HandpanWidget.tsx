import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PlaybackProvider } from './PlaybackContext';
import { usePlayback } from './usePlayback';
import HandpanRenderer from './HandpanRenderer';
import ScaleInfoPanel from './ScaleInfoPanel';
import ChordsSection from './ChordsSection';
import type { HandpanPad, PitchClass } from '../config/types';
import type { PlayableChord } from '../theory/chords';
import type { PlaybackMode } from './ChordsSection';
import { initializeAudio, isAudioInitialized, playNote } from '../audio/engine';
import { normalizeToPitchClass } from '../theory/normalize';
import { note } from '@tonaljs/core';
import {
  getFamilyOptions,
  getKeyOptions,
  getNoteCountOptions,
  getDefaultSelection,
  resolveHandpanConfig,
  getInitialSelection,
} from '../config/handpanSelectorModel';
import styles from '../styles/HandpanWidget.module.scss';

function pickBestPadNoteForPc(layout: HandpanPad[], pc: string): string | null {
  const matches = layout.filter((p) => normalizeToPitchClass(p.note) === pc);
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

function HandpanWidgetContent() {
  const initialSelection = useMemo(() => getInitialSelection(), []);
  const [familyId, setFamilyId] = useState(initialSelection.familyId);
  const [selectedKey, setSelectedKey] = useState<PitchClass>(
    initialSelection.key
  );
  const [selectedNoteCount, setSelectedNoteCount] = useState(
    initialSelection.noteCount
  );
  const [selectedChord, setSelectedChord] = useState<PlayableChord | null>(
    null
  );
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('arpeggio');
  const [arpeggioBpm, setArpeggioBpm] = useState(120);

  const playback = usePlayback();
  const familyOptions = useMemo(() => getFamilyOptions(), []);
  const keyOptions = useMemo(() => getKeyOptions(familyId), [familyId]);
  const noteCountOptions = useMemo(
    () => getNoteCountOptions(familyId),
    [familyId]
  );

  const selectedHandpan = useMemo(
    () =>
      resolveHandpanConfig({
        familyId,
        key: selectedKey,
        noteCount: selectedNoteCount,
      }),
    [familyId, selectedKey, selectedNoteCount]
  );

  const selectedScaleInfo = useMemo(() => {
    if (!selectedHandpan) return null;
    return {
      name: selectedHandpan.scaleName,
      aliases: selectedHandpan.scaleAliases,
      description: selectedHandpan.scaleDescription,
      moodTags: selectedHandpan.scaleMoodTags,
    };
  }, [selectedHandpan]);

  useEffect(() => {
    const defaults = getDefaultSelection(familyId);
    setSelectedKey(defaults.key);
    setSelectedNoteCount(defaults.noteCount);
    setSelectedChord(null);
    playback.clearPlayback();
  }, [familyId]);

  const selectedNotesForHandpan = useMemo<Set<string>>(() => {
    if (!selectedHandpan || !selectedChord) return new Set();
    const notes = new Set<string>();
    const chordNotesSet = new Set(selectedChord.notes);
    selectedHandpan.layout.forEach((pad) => {
      if (chordNotesSet.has(pad.note)) {
        notes.add(pad.note);
      }
    });
    return notes;
  }, [selectedHandpan, selectedChord]);

  const activeNotes = useMemo<Set<string>>(() => {
    if (!selectedHandpan) return new Set();
    const notes = new Set<string>();

    if (
      playback.state.intent === 'note' ||
      playback.state.intent === 'scalePlayback'
    ) {
      if (playback.state.activeNote) {
        const pad = selectedHandpan.layout.find(
          (p) => p.note === playback.state.activeNote
        );
        if (pad) {
          notes.add(pad.note);
        } else {
          const pc = normalizeToPitchClass(playback.state.activeNote);
          const mapped = pickBestPadNoteForPc(selectedHandpan.layout, pc);
          if (mapped) {
            notes.add(mapped);
          }
        }
      }
    } else if (
      playback.state.intent === 'chordPlayback' &&
      playback.state.activePitchClasses
    ) {
      const pitchClassSet = new Set(playback.state.activePitchClasses);
      selectedHandpan.layout.forEach((pad) => {
        const padPc = normalizeToPitchClass(pad.note);
        if (pitchClassSet.has(padPc)) {
          notes.add(pad.note);
        }
      });
    }

    return notes;
  }, [
    selectedHandpan,
    playback.state.intent,
    playback.state.activeNote,
    playback.state.activePitchClasses,
  ]);

  const handlePadClick = useCallback(
    async (pad: HandpanPad) => {
      try {
        if (!isAudioInitialized()) {
          await initializeAudio();
        }
        setSelectedChord(null);
        playback.setNoteActive(pad.note, 'note');
        playNote(pad.note, 500);
        setTimeout(() => {
          playback.clearPlayback();
        }, 500);
      } catch (error) {
        try {
          await initializeAudio();
          setSelectedChord(null);
          playback.setNoteActive(pad.note, 'note');
          playNote(pad.note, 500);
          setTimeout(() => {
            playback.clearPlayback();
          }, 500);
        } catch (retryError) {
          console.error('Audio initialization failed', retryError);
        }
      }
    },
    [playback]
  );

  const handleChordSelect = useCallback((chord: PlayableChord | null) => {
    setSelectedChord(chord);
  }, []);

  const handleChordClear = useCallback(() => {
    setSelectedChord(null);
  }, []);

  if (!selectedHandpan) {
    return <div>No handpan configuration available.</div>;
  }

  return (
    <div className={styles.handpanWidget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Chord Explorer</h2>
        <div className={styles.selector}>
          <div className={styles.selectorRow}>
            <label htmlFor="family-select" className={styles.label}>
              Scale Family:
            </label>
            <select
              id="family-select"
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              className={styles.select}
              aria-label="Select scale family"
            >
              {familyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectorRow}>
            <label htmlFor="key-select" className={styles.label}>
              Key:
            </label>
            <select
              id="key-select"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value as PitchClass)}
              className={`${styles.select} ${styles.selectCompact}`}
              aria-label="Select key"
              disabled={keyOptions.length <= 1}
            >
              {keyOptions.map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.selectorRow}>
            <label htmlFor="pads-select" className={styles.label}>
              Pads:
            </label>
            <select
              id="pads-select"
              value={selectedNoteCount}
              onChange={(e) => setSelectedNoteCount(Number(e.target.value))}
              className={`${styles.select} ${styles.selectCompact}`}
              aria-label="Select number of pads"
              disabled={noteCountOptions.length <= 1}
            >
              {noteCountOptions.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className={styles.topRow}>
        <div className={styles.handpanSection}>
          <HandpanRenderer
            key={`${familyId}-${selectedKey}-${selectedNoteCount}`}
            config={selectedHandpan}
            selectedNotes={selectedNotesForHandpan}
            activeNotes={activeNotes}
            onPadClick={handlePadClick}
          />
        </div>
        <div className={styles.scaleInfoSection}>
          <ScaleInfoPanel
            key={`${familyId}-${selectedKey}-${selectedNoteCount}-${selectedHandpan.scaleName}`}
            scaleInfo={selectedScaleInfo}
            scaleNotes={selectedHandpan.notes}
            onChordSelect={handleChordClear}
          />
        </div>
      </div>
      <div className={styles.chordsSectionWrapper}>
        <ChordsSection
          key={`${familyId}-${selectedKey}-${selectedNoteCount}`}
          availableNotes={selectedHandpan.notes}
          selectedChord={selectedChord}
          onChordSelect={handleChordSelect}
          playbackMode={playbackMode}
          onPlaybackModeChange={setPlaybackMode}
          arpeggioBpm={arpeggioBpm}
          onArpeggioBpmChange={setArpeggioBpm}
        />
      </div>
    </div>
  );
}

export default function HandpanWidget() {
  return (
    <PlaybackProvider key="handpan-playback-provider">
      <HandpanWidgetContent />
    </PlaybackProvider>
  );
}
