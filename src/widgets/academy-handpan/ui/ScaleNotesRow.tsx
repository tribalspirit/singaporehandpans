import React from 'react';
import { usePlayback } from './usePlayback';
import styles from '../styles/ScaleNotesRow.module.scss';

interface ScaleNotesRowProps {
  /** Already sorted by pitch; this component does not reorder. */
  notes: ReadonlyArray<string>;
  onNoteClick: (note: string) => void;
}

export default function ScaleNotesRow({
  notes,
  onNoteClick,
}: ScaleNotesRowProps) {
  const { state } = usePlayback();

  return (
    <div className={styles.notesSection}>
      <p className={styles.hint}>
        Every note on your pan, low to high. Tap one to hear it and light it up
        on the instrument.
      </p>
      <div className={styles.notesList}>
        {notes.map((note) => {
          const isActive = state.activeNote === note;
          return (
            <button
              key={note}
              type="button"
              className={`${styles.noteBadge} ${isActive ? styles.noteBadgeActive : ''}`}
              onClick={() => onNoteClick(note)}
              aria-label={`Play ${note}`}
            >
              {note}
            </button>
          );
        })}
      </div>
    </div>
  );
}
