import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PlaybackProvider } from './PlaybackContext';
import { usePlayback } from './usePlayback';
import HandpanRenderer from './HandpanRenderer';
import type { NotationMode } from '../core/notation/padLabel';

const NOTATION_OPTIONS: ReadonlyArray<{ value: NotationMode; label: string }> =
  [
    { value: 'note', label: 'Notes' },
    { value: 'number', label: 'Numbers' },
  ];
import { warmAudioModule } from '../audio/engine';
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
  const [notation, setNotation] = useState<NotationMode>('note');

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

  // `handleFamilyChange` applies the family and its defaults together, so this
  // only has to cover a familyId arriving from somewhere else — an initial
  // selection that does not resolve, say. Skipping it while the current
  // selection is valid is what keeps the controls mounted, and focus with them.
  useEffect(() => {
    if (
      resolveHandpanConfig({
        familyId,
        key: selectedKey,
        noteCount: selectedNoteCount,
      })
    ) {
      return;
    }

    const defaults = getDefaultSelection(familyId);
    setSelectedKey(defaults.key);
    setSelectedNoteCount(defaults.noteCount);
    setSelectedChord(null);
    playback.clearPlayback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, selectedKey, selectedNoteCount]);

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
    } else if (playback.state.intent === 'chordPlayback') {
      if (playback.state.activeNotes) {
        const activeNotesSet = new Set(playback.state.activeNotes);
        selectedHandpan.layout.forEach((pad) => {
          if (activeNotesSet.has(pad.note)) {
            notes.add(pad.note);
          }
        });
      } else if (playback.state.activePitchClasses) {
        const pitchClassSet = new Set(playback.state.activePitchClasses);
        selectedHandpan.layout.forEach((pad) => {
          const padPc = normalizeToPitchClass(pad.note);
          if (pitchClassSet.has(padPc)) {
            notes.add(pad.note);
          }
        });
      }
    }

    return notes;
  }, [
    selectedHandpan,
    playback.state.intent,
    playback.state.activeNote,
    playback.state.activePitchClasses,
    playback.state.activeNotes,
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

  /**
   * Change family and its defaults together.
   *
   * Setting the family alone left one render with the previous key and shell —
   * Kurd's D/9 against Golden Gate's C/8 — which resolves to nothing and takes
   * the "no configuration" early return. That unmounted the controls, and a
   * keyboard user lost focus to the document body mid-navigation. React batches
   * these, so the config never passes through an unresolvable state.
   */
  const handleFamilyChange = useCallback(
    (nextFamilyId: string) => {
      const defaults = getDefaultSelection(nextFamilyId);
      setFamilyId(nextFamilyId);
      setSelectedKey(defaults.key);
      setSelectedNoteCount(defaults.noteCount);
      setSelectedChord(null);
      playback.clearPlayback();
    },
    [playback]
  );

  /*
   * Start fetching Tone.js on pointerdown, before the click that will need it.
   * Tone is kept out of the initial bundle, so without this the first gesture
   * waits on a ~340 KB download and the browser's user activation can expire
   * mid-flight, which on stricter engines leaves audio blocked.
   *
   * Attached to the sound-producing surfaces only — the pan, the scale notes
   * and the chords — never to the header. Putting it on the widget root meant
   * changing the scale family or the label mode pulled 340 KB for someone who
   * only ever browsed the catalogue, which defeats the point of loading it
   * lazily at all.
   *
   * Both pointer *and* keyboard. Activating a pad with Enter or Space fires a
   * click with no pointer event at all, so a pointer-only hook left keyboard
   * users on the cold path this exists to avoid — the one where the download
   * outlives the browser's user activation and the first note is silent.
   *
   * `onFocus` rather than `onKeyDown`: React's focus events bubble, so tabbing
   * *to* a pad warms audio before the key is even pressed, and a plain
   * container keeps its keyboard handling to the buttons inside it rather than
   * pretending to be interactive itself.
   */
  const handleWarmAudio = useCallback(() => {
    void warmAudioModule().catch(() => {
      // Warming is an optimisation; initializeAudio reports real failures.
    });
  }, []);

  // Every hook must be declared above this point. A family switch leaves the
  // previous key/shell in state for one render — Golden Gate is C/8 only, so
  // Kurd's D/9 cannot resolve — and any hook below this return would be skipped
  // on exactly that render, which React reports as "Rendered fewer hooks than
  // expected". Guarded by `familySwitch.test.tsx`.
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
              onChange={(e) => handleFamilyChange(e.target.value)}
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
          <div className={styles.selectorRow}>
            <span className={styles.label} id="notation-label">
              Labels:
            </span>
            {/*
              Two mutually exclusive options, so a segmented pair of radios
              rather than a dropdown: both choices stay visible and switching
              takes one click instead of open-then-pick. Native radios keep the
              arrow-key behaviour and grouping semantics a custom toggle would
              have to reimplement.
            */}
            <div
              className={styles.notationToggle}
              role="radiogroup"
              aria-labelledby="notation-label"
            >
              {NOTATION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={[
                    styles.notationOption,
                    notation === option.value
                      ? styles.notationOptionActive
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <input
                    type="radio"
                    name="notation"
                    value={option.value}
                    checked={notation === option.value}
                    onChange={() => setNotation(option.value)}
                    className={styles.notationInput}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div
        className={styles.topRow}
        onPointerDown={handleWarmAudio}
        onFocus={handleWarmAudio}
      >
        <div className={styles.handpanSection}>
          <HandpanRenderer
            key={`${familyId}-${selectedKey}-${selectedNoteCount}`}
            config={selectedHandpan}
            selectedNotes={selectedNotesForHandpan}
            activeNotes={activeNotes}
            onPadClick={handlePadClick}
            notation={notation}
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
      <div
        className={styles.chordsSectionWrapper}
        onPointerDown={handleWarmAudio}
        onFocus={handleWarmAudio}
      >
        <ChordsSection
          key={`${familyId}-${selectedKey}-${selectedNoteCount}`}
          availableNotes={selectedHandpan.notes}
          selectedChord={selectedChord}
          onChordSelect={handleChordSelect}
          playbackMode={playbackMode}
          onPlaybackModeChange={setPlaybackMode}
          arpeggioBpm={arpeggioBpm}
          onArpeggioBpmChange={setArpeggioBpm}
          dingIsTonalCentre={
            (selectedHandpan.tonalCentreOffsetSemitones ?? 0) === 0
          }
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
