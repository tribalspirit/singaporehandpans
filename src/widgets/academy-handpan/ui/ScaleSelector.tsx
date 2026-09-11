import React, { useEffect, useId, useRef, useState } from 'react';
import type { NotationMode } from '../core/notation/padLabel';
import type { PitchClass } from '../config/types';
import type { FamilyPreviewOption } from '../config/handpanSelectorModel';
import styles from '../styles/ScaleSelector.module.scss';

const NOTATION_OPTIONS: ReadonlyArray<{ value: NotationMode; label: string }> =
  [
    { value: 'note', label: 'Notes' },
    { value: 'number', label: 'Numbers' },
  ];

interface ScaleSelectorProps {
  summary: string;
  familyOptions: ReadonlyArray<FamilyPreviewOption>;
  familyId: string;
  onFamilyChange: (familyId: string) => void;
  keyOptions: ReadonlyArray<PitchClass>;
  selectedKey: PitchClass;
  onKeyChange: (key: PitchClass) => void;
  noteCountOptions: ReadonlyArray<number>;
  selectedNoteCount: number;
  onNoteCountChange: (noteCount: number) => void;
  notation: NotationMode;
  onNotationChange: (notation: NotationMode) => void;
  onPreviewFamily: (option: FamilyPreviewOption) => void;
  /**
   * Starts fetching the audio module. Wired to the preview buttons only —
   * picking a family or a pad label makes no sound and must not pull ~340 KB
   * for someone browsing the catalogue.
   */
  onWarmAudio: () => void;
  previewingFamilyId: string | null;
  /** Set when a family switch could not keep the user's key. */
  notice: string | null;
}

/**
 * One line describing the instrument, with the configuration behind a
 * disclosure.
 *
 * Family, key and pad count used to be three equally weighted selects — the
 * first thing on the page, above the instrument, before anything had made a
 * sound. A beginner has no basis for any of those choices yet. Collapsed to a
 * sentence they can read ("D Kurd · 9 notes"), configuration becomes something
 * they go looking for rather than a toll gate.
 */
export default function ScaleSelector({
  summary,
  familyOptions,
  familyId,
  onFamilyChange,
  keyOptions,
  selectedKey,
  onKeyChange,
  noteCountOptions,
  selectedNoteCount,
  onNoteCountChange,
  notation,
  onNotationChange,
  onPreviewFamily,
  onWarmAudio,
  previewingFamilyId,
  notice,
}: ScaleSelectorProps) {
  const sheetId = useId();
  const notationLabelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Escape closes the sheet and returns focus to the control that opened it,
  // which is the only way back for a keyboard user.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className={styles.selector}>
      <div className={styles.summaryRow}>
        <p className={styles.summary}>
          <span className={styles.summaryLabel}>Your handpan</span>
          <span className={styles.summaryValue}>{summary}</span>
        </p>
        <button
          ref={toggleRef}
          type="button"
          className={styles.changeButton}
          aria-expanded={isOpen}
          aria-controls={sheetId}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? 'Done' : 'Change'}
        </button>
      </div>

      {/*
        Announced politely rather than silently applied. Switching family keeps
        the user's key wherever the new family publishes it; when it cannot,
        saying so is the difference between a considered fallback and the page
        appearing to lose their place.
      */}
      <p className={styles.notice} role="status" aria-live="polite">
        {notice}
      </p>

      <div
        ref={sheetRef}
        id={sheetId}
        className={styles.sheet}
        hidden={!isOpen}
      >
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Key</legend>
          <div className={styles.chipRow}>
            {keyOptions.map((key) => (
              <button
                key={key}
                type="button"
                className={`${styles.chip} ${key === selectedKey ? styles.chipActive : ''}`}
                aria-pressed={key === selectedKey}
                onClick={() => onKeyChange(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>
            Family <span className={styles.groupHint}>tap ▶ to preview</span>
          </legend>
          <ul className={styles.familyList}>
            {familyOptions.map((option) => {
              const isSelected = option.id === familyId;
              const isPreviewing = option.id === previewingFamilyId;
              return (
                <li key={option.id} className={styles.familyRow}>
                  <button
                    type="button"
                    className={styles.previewButton}
                    onClick={() => onPreviewFamily(option)}
                    onPointerDown={onWarmAudio}
                    onFocus={onWarmAudio}
                    aria-label={`Preview ${option.name}`}
                    data-playing={isPreviewing || undefined}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <polygon points="6 4 20 12 6 20 6 4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`${styles.familyChoice} ${isSelected ? styles.familyChoiceActive : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => onFamilyChange(option.id)}
                  >
                    <span className={styles.familyName}>{option.name}</span>
                    {option.mood && (
                      <span className={styles.familyMood}>{option.mood}</span>
                    )}
                    <span className={styles.familyCheck} aria-hidden="true">
                      {isSelected ? '✓' : ''}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Notes on your pan</legend>
          <div className={styles.chipRow}>
            {noteCountOptions.map((count) => (
              <button
                key={count}
                type="button"
                className={`${styles.chip} ${count === selectedNoteCount ? styles.chipActive : ''}`}
                aria-pressed={count === selectedNoteCount}
                onClick={() => onNoteCountChange(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </fieldset>

        {/*
          Two mutually exclusive options, so a segmented pair of radios rather
          than a dropdown: both choices stay visible and switching takes one
          click instead of open-then-pick. Native radios keep the arrow-key
          behaviour and grouping semantics a custom toggle would reimplement.
        */}
        <div className={styles.group}>
          <span className={styles.groupTitle} id={notationLabelId}>
            Pad labels
          </span>
          <div
            className={styles.notationToggle}
            role="radiogroup"
            aria-labelledby={notationLabelId}
          >
            {NOTATION_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={[
                  styles.notationOption,
                  notation === option.value ? styles.notationOptionActive : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <input
                  type="radio"
                  name="notation"
                  value={option.value}
                  checked={notation === option.value}
                  onChange={() => onNotationChange(option.value)}
                  className={styles.notationInput}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.sheetFooter}>
          <button
            type="button"
            className={styles.doneButton}
            onClick={() => {
              setIsOpen(false);
              toggleRef.current?.focus();
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
