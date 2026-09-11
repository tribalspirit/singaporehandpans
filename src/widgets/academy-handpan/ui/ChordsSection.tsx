import React, { useCallback, useMemo, useState } from 'react';
import * as Chord from '@tonaljs/chord';
import { findPlayableChords, type PlayableChord } from '../theory/chords';
import { getDiatonicTriads, isDiatonicScale } from '../theory/diatonicTriads';
import { displayFlat } from '../theory/utils';
import WidgetTabs, { type WidgetTab } from './WidgetTabs';
import styles from '../styles/ChordsSection.module.scss';

export type { PlaybackMode } from './types';

const ROMAN_NUMERALS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

interface ChordsSectionProps {
  availableNotes: string[];
  selectedChord: PlayableChord | null;
  onChordSelect: (chord: PlayableChord | null) => void;
  /**
   * False when the catalog records that this tuning resolves somewhere other
   * than its ding, which makes ding-rooted Roman numerals unsupportable.
   */
  dingIsTonalCentre?: boolean;
}

/**
 * The degree label a tile carries, in the case its quality calls for.
 *
 * Tonic and relative major used to be pale indigo and pale yellow fills at
 * roughly 30-40% alpha, decoded via a legend above the row. That is meaning
 * carried by colour alone — it fails for anyone who cannot separate those
 * hues, it is low contrast against the surface, and even when it works it
 * forces a lookup. Writing the word on the tile removes the legend entirely.
 *
 * Case follows the usual convention so the label says something colour never
 * did: uppercase for major, lowercase for minor, with the quality symbol for
 * diminished and augmented.
 */
function getDegreeLabel(
  chord: PlayableChord,
  degree: number,
  isTonic: boolean,
  isRelativeMajor: boolean
): string {
  if (isTonic) {
    return 'tonic';
  }
  if (isRelativeMajor) {
    return 'relative major';
  }

  const numeral = ROMAN_NUMERALS[degree] || String(degree);
  const quality = Chord.get(chord.name).quality;

  if (quality === 'Minor') {
    return numeral.toLowerCase();
  }
  if (quality === 'Diminished') {
    return `${numeral.toLowerCase()}°`;
  }
  if (quality === 'Augmented') {
    return `${numeral}+`;
  }
  return numeral;
}

export default function ChordsSection({
  availableNotes,
  selectedChord,
  onChordSelect,
  dingIsTonalCentre = true,
}: ChordsSectionProps) {
  const [activeTabId, setActiveTabId] = useState('basic');

  /**
   * Roman numerals and the relative-major label describe a seven-note tonal
   * system. On the pentatonic and hexatonic tunings this catalog ships, a
   * scale position is just a position, so the triads are shown without that
   * vocabulary rather than labelled with degrees they do not have.
   */
  const scaleIsDiatonic = useMemo(
    () => isDiatonicScale(availableNotes, { dingIsTonalCentre }),
    [availableNotes, dingIsTonalCentre]
  );

  const diatonicTriads = useMemo(
    () =>
      getDiatonicTriads(availableNotes, availableNotes, { dingIsTonalCentre }),
    [availableNotes, dingIsTonalCentre]
  );

  const addedNoteChords = useMemo(() => {
    const filtered = findPlayableChords(availableNotes).filter(
      (chord) =>
        chord.category === 'advanced' &&
        chord.notes.length >= 3 &&
        chord.notes.every((note) => availableNotes.includes(note))
    );

    const grouped = new Map<string, PlayableChord[]>();
    for (const chord of filtered) {
      // Group by the tuned spelling so the heading agrees with the chord names
      // beneath it and with the pads.
      const root =
        chord.displayRootPc || chord.rootPc || chord.pitchClasses[0] || '';
      if (!grouped.has(root)) {
        grouped.set(root, []);
      }
      grouped.get(root)!.push(chord);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([root, chords]) => ({ root, chords }));
  }, [availableNotes]);

  const advancedCount = useMemo(
    () =>
      addedNoteChords.reduce((total, group) => total + group.chords.length, 0),
    [addedNoteChords]
  );

  const handleChordClick = useCallback(
    (chord: PlayableChord) => {
      onChordSelect(
        selectedChord && chord.name === selectedChord.name ? null : chord
      );
    },
    [selectedChord, onChordSelect]
  );

  const renderBasic = useCallback(
    () => (
      <div className={styles.triadsSection}>
        <p className={styles.sectionDescription}>
          {scaleIsDiatonic
            ? 'The chords that live in this scale, in circle-of-fifths order. Every one of them is playable on the pads in front of you.'
            : 'The chords playable on this tuning. This scale has fewer than seven notes, so its positions are not numbered degrees.'}
        </p>
        <div className={styles.triadsRow}>
          {diatonicTriads.map(({ chord, degree, isTonic, isRelativeMajor }) => {
            const isSelected = selectedChord?.name === chord.name;
            const degreeLabel = scaleIsDiatonic
              ? getDegreeLabel(chord, degree, isTonic, isRelativeMajor)
              : isTonic
                ? 'ding'
                : '';
            return (
              <button
                key={chord.name}
                type="button"
                className={`${styles.triadTile} ${isSelected ? styles.triadTileSelected : ''}`}
                onClick={() => handleChordClick(chord)}
                aria-pressed={isSelected}
              >
                <span className={styles.triadName}>{chord.displayName}</span>
                {degreeLabel && (
                  <span className={styles.triadDegree}>{degreeLabel}</span>
                )}
                <span className={styles.triadNotes}>
                  {chord.notes.join(' ')}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    ),
    [diatonicTriads, scaleIsDiatonic, selectedChord, handleChordClick]
  );

  const renderAdvanced = useCallback(
    () => (
      <div className={styles.advancedSection}>
        <p className={styles.sectionDescription}>
          7ths, 9ths, sus chords, add chords, and other handpan-friendly
          voicings, grouped by root.
        </p>
        <div className={styles.chordGroups}>
          {addedNoteChords.map(({ root, chords }) => (
            <div key={root} className={styles.chordGroup}>
              <h4 className={styles.groupTitle}>{displayFlat(root)}</h4>
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
    ),
    [addedNoteChords, selectedChord, handleChordClick]
  );

  /*
   * Basic and advanced are two tabs rather than two stacked sections.
   *
   * The advanced grid renders every playable voicing — around twenty of them
   * on a nine-note pan — and expanded by default it was the largest block on
   * the page and the least useful to a beginner. Behind a labelled tab
   * carrying its own count, it costs one tap for the players who want it and
   * nothing for the ones who do not.
   */
  const tabs = useMemo<WidgetTab[]>(() => {
    const available: WidgetTab[] = [];
    if (diatonicTriads.length > 0) {
      available.push({
        id: 'basic',
        label: 'Basic',
        badge: String(diatonicTriads.length),
        render: renderBasic,
      });
    }
    if (addedNoteChords.length > 0) {
      available.push({
        id: 'advanced',
        label: 'Advanced',
        badge: String(advancedCount),
        render: renderAdvanced,
      });
    }
    return available;
  }, [
    diatonicTriads.length,
    addedNoteChords.length,
    advancedCount,
    renderBasic,
    renderAdvanced,
  ]);

  if (tabs.length === 0) {
    return (
      <p className={styles.emptyMessage}>
        No playable chords found for this handpan.
      </p>
    );
  }

  // A single group needs no tabbing; render it directly rather than showing a
  // tablist with one tab in it.
  if (tabs.length === 1) {
    return <div className={styles.chordsSection}>{tabs[0].render()}</div>;
  }

  return (
    <div className={styles.chordsSection}>
      <WidgetTabs
        tabs={tabs}
        activeId={
          tabs.some((tab) => tab.id === activeTabId) ? activeTabId : tabs[0].id
        }
        onChange={setActiveTabId}
        label="Chord groups"
        variant="pills"
      />
    </div>
  );
}
