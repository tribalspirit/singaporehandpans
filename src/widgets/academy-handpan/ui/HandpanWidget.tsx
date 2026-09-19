import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { PlaybackProvider } from './PlaybackContext';
import { usePlayback } from './usePlayback';
import { useScaleAudio } from './useScaleAudio';
import HandpanRenderer from './HandpanRenderer';
import ScaleSelector from './ScaleSelector';
import ScaleNotesRow from './ScaleNotesRow';
import ScaleAbout from './ScaleAbout';
import LayoutNote from './LayoutNote';
import ChordsSection from './ChordsSection';
import ChordActionBar from './ChordActionBar';
import WidgetTabs, { type WidgetTab } from './WidgetTabs';
import { warmAudioModule } from '../audio/engine';
import type { NotationMode } from '../core/notation/padLabel';
import type { HandpanPad, PitchClass } from '../config/types';
import type { PlayableChord } from '../theory/chords';
import type { PlaybackMode } from './types';
import { normalizeToPitchClass } from '../theory/normalize';
import { sortNotesByPitch } from '../theory/utils';
import { note } from '@tonaljs/core';
import {
  getKeyOptions,
  getNoteCountOptions,
  getFamilyPreviewOptions,
  getSelectionForFamily,
  resolveHandpanConfig,
  type FamilyPreviewOption,
} from '../config/handpanSelectorModel';
import {
  resolveWidgetProps,
  type HandpanWidgetProps,
  type ResolvedWidgetProps,
} from './widgetProps';
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

function HandpanWidgetContent({ initial }: { initial: ResolvedWidgetProps }) {
  const [familyId, setFamilyId] = useState(initial.selection.familyId);
  const [selectedKey, setSelectedKey] = useState<PitchClass>(
    initial.selection.key
  );
  const [selectedNoteCount, setSelectedNoteCount] = useState(
    initial.selection.noteCount
  );
  const [selectedChord, setSelectedChord] = useState<PlayableChord | null>(
    null
  );
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>(
    initial.playbackMode
  );
  const [arpeggioBpm, setArpeggioBpm] = useState(initial.arpeggioBpm);
  const [notation, setNotation] = useState<NotationMode>(initial.notation);
  const [activeTabId, setActiveTabId] = useState<string>(initial.view);
  const [familyNotice, setFamilyNotice] = useState<string | null>(null);
  const [previewingFamilyId, setPreviewingFamilyId] = useState<string | null>(
    null
  );
  /**
   * Invalidates in-flight previews.
   *
   * `playScale` awaits the audio module, which on a cold or throttled load
   * takes long enough for the user to pick another family, key or shell. The
   * change handlers call `stop()`, but there is no arpeggio to stop yet — so
   * when the import finally resolved, the stale call scheduled the *previous*
   * family's notes over the newly chosen instrument, and its preview button
   * stayed lit. Bumping this on every selection change lets the resolved call
   * see that it has been superseded and return.
   */
  const previewGenerationRef = useRef(0);

  const playback = usePlayback();

  /**
   * Cancel any preview because the instrument itself changed.
   *
   * Distinct from one preview superseding another. A superseded request
   * declines to unlight the button, since the request that replaced it owns
   * that state now — but a configuration change leaves no preview to own it,
   * and nothing else clears the marker on this path because `isPlaying` never
   * went true. Without this the button stayed lit over a preview that never
   * played.
   */
  const invalidatePreview = useCallback(() => {
    previewGenerationRef.current += 1;
    setPreviewingFamilyId(null);
  }, []);
  const familyOptions = useMemo(() => getFamilyPreviewOptions(), []);
  const keyOptions = useMemo(() => getKeyOptions(familyId), [familyId]);
  const noteCountOptions = useMemo(
    () => getNoteCountOptions(familyId),
    [familyId]
  );

  const handleChordClear = useCallback(() => setSelectedChord(null), []);
  const { playSingleNote, playScale, playChordNotes, stop } = useScaleAudio({
    onBeforePlay: handleChordClear,
  });

  const selectedHandpan = useMemo(
    () =>
      resolveHandpanConfig({
        familyId,
        key: selectedKey,
        noteCount: selectedNoteCount,
      }),
    [familyId, selectedKey, selectedNoteCount]
  );

  const sortedScaleNotes = useMemo(
    () => (selectedHandpan ? sortNotesByPitch([...selectedHandpan.notes]) : []),
    [selectedHandpan]
  );

  // A family preview is just scale playback, so it ends when playback does.
  useEffect(() => {
    if (!playback.state.isPlaying) {
      setPreviewingFamilyId(null);
    }
  }, [playback.state.isPlaying]);

  /*
   * Selecting a different instrument invalidates anything currently sounding.
   *
   * Keyed on the whole selection, not the scale name. `scaleName` is the
   * family's name — "Kurd" — so it is unchanged by a key or pad-count switch,
   * and an arpeggio for D would go on sounding over a pan now drawn in E. The
   * previous layout got away with the narrower key only because the panel
   * holding this effect was remounted by a composite `key` prop.
   */
  const selectionKey = `${familyId}-${selectedKey}-${selectedNoteCount}`;
  useEffect(() => {
    stop();
  }, [selectionKey, stop]);

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
    (pad: HandpanPad) => {
      void playSingleNote(pad.note);
    },
    [playSingleNote]
  );

  const handleNoteClick = useCallback(
    (noteName: string) => {
      void playSingleNote(noteName);
    },
    [playSingleNote]
  );

  const handlePlayScale = useCallback(() => {
    if (playback.state.isPlaying) {
      stop();
      return;
    }
    // Playing the scale outright cancels any preview, exactly as changing the
    // instrument does. Only the preview's own request clears its marker, and
    // that request may be stuck behind a context start for seconds yet — until
    // then the preview button sat lit beside a scale that really was playing.
    invalidatePreview();
    void playScale(sortedScaleNotes);
  }, [
    playback.state.isPlaying,
    stop,
    playScale,
    sortedScaleNotes,
    invalidatePreview,
  ]);

  const handlePlayChord = useCallback(() => {
    if (!selectedChord || playback.state.isPlaying) {
      return;
    }
    // See `handlePlayScale`: sounding a chord cancels a pending preview too.
    invalidatePreview();
    void playChordNotes(selectedChord.notes, playbackMode, arpeggioBpm);
  }, [
    selectedChord,
    playback.state.isPlaying,
    playChordNotes,
    playbackMode,
    arpeggioBpm,
    invalidatePreview,
  ]);

  const handlePreviewFamily = useCallback(
    (option: FamilyPreviewOption) => {
      const config = resolveHandpanConfig({
        familyId: option.id,
        key: option.preview.key,
        noteCount: option.preview.noteCount,
      });
      if (!config) {
        return;
      }

      // Each preview supersedes the last. Reading the generation without
      // bumping it let two pending previews both believe they were current,
      // and since every gesture now gets its own initialisation attempt, the
      // earlier one could settle second — stopping the preview the visitor was
      // actually waiting on and playing itself under the other one's lit
      // button.
      previewGenerationRef.current += 1;
      const generation = previewGenerationRef.current;
      setPreviewingFamilyId(option.id);

      void (async () => {
        const started = await playScale(
          sortNotesByPitch([...config.notes]),
          // Re-checked after the audio module resolves, immediately before any
          // note is scheduled.
          () => previewGenerationRef.current === generation
        );

        // Covers both ways nothing plays: superseded by a later choice, or
        // audio failing outright. Either way `isPlaying` never goes true, so
        // the effect that normally unlights the button never fires.
        //
        // Only this request may stand down, though. Matching on family id
        // alone meant that previewing the *same* family twice had the older
        // request unlight the button for the newer one that was playing —
        // both ids being equal, the id check could not tell them apart.
        if (!started && previewGenerationRef.current === generation) {
          setPreviewingFamilyId((current) =>
            current === option.id ? null : current
          );
        }
      })();
    },
    [playScale]
  );

  /**
   * Change family, keeping the key wherever the new family publishes it.
   *
   * Family, key and shell are set together in one batch. Setting the family
   * alone left one render with the previous key against the new family —
   * Kurd's D/9 against Golden Gate's C/8 — which resolves to nothing and takes
   * the "no configuration" early return, unmounting the controls and dropping
   * a keyboard user's focus to the document body mid-navigation.
   */
  const handleFamilyChange = useCallback(
    (nextFamilyId: string) => {
      const next = getSelectionForFamily(nextFamilyId, {
        key: selectedKey,
        noteCount: selectedNoteCount,
      });
      setFamilyId(nextFamilyId);
      setSelectedKey(next.key);
      setSelectedNoteCount(next.noteCount);
      setSelectedChord(null);
      invalidatePreview();
      // `stop()`, not `clearPlayback()`. Re-selecting the family already shown
      // leaves the selection — and so `selectionKey` — unchanged, so the effect
      // above does not fire. Clearing only the state would let the scheduled
      // notes of an in-flight preview keep firing `onStep`, which sets
      // `isPlaying` back to true and relights pads with no user action.
      stop();
      setFamilyNotice(
        next.movedFromKey
          ? `This family is not tuned to ${next.movedFromKey}. Showing ${next.key} instead.`
          : null
      );
    },
    [selectedKey, selectedNoteCount, stop, invalidatePreview]
  );

  const handleKeyChange = useCallback(
    (key: PitchClass) => {
      setSelectedKey(key);
      setSelectedChord(null);
      setFamilyNotice(null);
      invalidatePreview();
      stop();
    },
    [stop, invalidatePreview]
  );

  const handleNoteCountChange = useCallback(
    (noteCount: number) => {
      setSelectedNoteCount(noteCount);
      setSelectedChord(null);
      invalidatePreview();
      stop();
    },
    [stop, invalidatePreview]
  );

  /*
   * Start fetching Tone.js on pointerdown, before the click that will need it.
   * Tone is kept out of the initial bundle, so without this the first gesture
   * waits on a ~340 KB download and the browser's user activation can expire
   * mid-flight, which on stricter engines leaves audio blocked.
   *
   * Attached to the sound-producing surfaces only, never to the widget root:
   * doing that pulled 340 KB for someone who only ever browsed the catalogue,
   * which defeats the point of loading it lazily at all.
   *
   * That rule is about controls, not containers. Only the stage is warmed by
   * its wrapper, because the pan and Play scale are all it holds. Everywhere
   * else the handler goes on the individual controls — the scale-note buttons,
   * the family preview buttons, the chord Play button — so the tabs, the
   * theory views, the About disclosure and the family, key, pad-count and
   * label pickers all stay cold.
   *
   * Both pointer *and* keyboard. Activating a pad with Enter or Space fires a
   * click with no pointer event at all, so a pointer-only hook left keyboard
   * users on the cold path this exists to avoid.
   *
   * `onFocus` rather than `onKeyDown`: React's focus events bubble, so tabbing
   * *to* a pad warms audio before the key is even pressed.
   */
  const handleWarmAudio = useCallback(() => {
    void warmAudioModule().catch(() => {
      // Warming is an optimisation; initializeAudio reports real failures.
    });
  }, []);

  const tabs = useMemo<WidgetTab[]>(() => {
    if (!selectedHandpan) {
      return [];
    }
    return [
      {
        id: 'listen',
        label: 'Listen',
        render: () => (
          <ScaleNotesRow
            notes={sortedScaleNotes}
            onNoteClick={handleNoteClick}
            onWarmAudio={handleWarmAudio}
          />
        ),
      },
      {
        id: 'chords',
        label: 'Chords',
        render: () => (
          <ChordsSection
            key={`${familyId}-${selectedKey}-${selectedNoteCount}`}
            availableNotes={selectedHandpan.notes}
            selectedChord={selectedChord}
            onChordSelect={setSelectedChord}
            dingIsTonalCentre={
              (selectedHandpan.tonalCentreOffsetSemitones ?? 0) === 0
            }
          />
        ),
      },
      {
        id: 'about',
        label: 'About',
        render: () => (
          <ScaleAbout
            name={selectedHandpan.scaleName}
            aliases={selectedHandpan.scaleAliases}
            description={selectedHandpan.scaleDescription}
            moodTags={selectedHandpan.scaleMoodTags}
          />
        ),
      },
    ];
  }, [
    selectedHandpan,
    sortedScaleNotes,
    handleNoteClick,
    handleWarmAudio,
    familyId,
    selectedKey,
    selectedNoteCount,
    selectedChord,
  ]);

  // Every hook must be declared above this point. A family switch can leave the
  // previous key/shell in state for one render, and any hook below this return
  // would be skipped on exactly that render, which React reports as "Rendered
  // fewer hooks than expected". Guarded by `familySwitch.test.tsx`.
  if (!selectedHandpan) {
    return <div>No handpan configuration available.</div>;
  }

  const summary = `${selectedKey} ${selectedHandpan.scaleName} · ${selectedNoteCount} notes`;

  return (
    <div className={styles.handpanWidget}>
      <header className={styles.header}>
        <h2 className={styles.title}>Chord Explorer</h2>
        <ScaleSelector
          summary={summary}
          familyOptions={familyOptions}
          familyId={familyId}
          onFamilyChange={handleFamilyChange}
          keyOptions={keyOptions}
          selectedKey={selectedKey}
          onKeyChange={handleKeyChange}
          noteCountOptions={noteCountOptions}
          selectedNoteCount={selectedNoteCount}
          onNoteCountChange={handleNoteCountChange}
          notation={notation}
          onNotationChange={setNotation}
          onPreviewFamily={handlePreviewFamily}
          onWarmAudio={handleWarmAudio}
          previewingFamilyId={previewingFamilyId}
          notice={familyNotice}
        />
      </header>

      {/*
        The instrument, above the fold at every width, with the one action that
        satisfies the page's stated job directly beneath it. Play used to sit
        in the top-right of a secondary card, styled like every other button
        and below the fold on a phone.
      */}
      <div
        className={styles.stage}
        onPointerDown={handleWarmAudio}
        onFocus={handleWarmAudio}
      >
        <div className={styles.panFrame}>
          <HandpanRenderer
            key={`${familyId}-${selectedKey}-${selectedNoteCount}`}
            config={selectedHandpan}
            selectedNotes={selectedNotesForHandpan}
            activeNotes={activeNotes}
            onPadClick={handlePadClick}
            notation={notation}
          />
        </div>
        <button
          type="button"
          className={styles.primaryPlay}
          onClick={handlePlayScale}
        >
          {playback.state.isPlaying ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
          )}
          {playback.state.isPlaying ? 'Stop' : 'Play scale'}
        </button>
        <p className={styles.stageHint}>
          Tap any pad to hear it — or play the whole scale.
        </p>
      </div>
      <LayoutNote />

      {/*
        No warming on this region. It holds the tabs, the About disclosure and
        the chord tiles, none of which make a sound — warming here meant merely
        browsing the theory views pulled the whole audio module. The note
        buttons inside it warm themselves, as does the action bar's Play.
      */}
      <div className={styles.views}>
        <WidgetTabs
          tabs={tabs}
          activeId={activeTabId}
          onChange={setActiveTabId}
          label="Handpan views"
        />
      </div>

      <ChordActionBar
        selectedChord={selectedChord}
        playbackMode={playbackMode}
        onPlaybackModeChange={setPlaybackMode}
        arpeggioBpm={arpeggioBpm}
        onArpeggioBpmChange={setArpeggioBpm}
        isPlaying={playback.state.isPlaying}
        onPlay={handlePlayChord}
        onStop={stop}
        onWarmAudio={handleWarmAudio}
      />
    </div>
  );
}

/**
 * The widget, with its opening state optionally set by whoever renders it.
 *
 * Props are read once. Resolving them on every render would fight the
 * visitor's own choices — a host that re-rendered with the same `familyId`
 * would keep yanking them back to it — so the resolved value is captured at
 * mount and the widget owns its state from there.
 */
export default function HandpanWidget(props: HandpanWidgetProps = {}) {
  const initialRef = useRef<ResolvedWidgetProps | null>(null);
  if (initialRef.current === null) {
    initialRef.current = resolveWidgetProps(props);
  }

  return (
    <PlaybackProvider key="handpan-playback-provider">
      <HandpanWidgetContent initial={initialRef.current} />
    </PlaybackProvider>
  );
}
