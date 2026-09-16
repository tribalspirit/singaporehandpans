import React, { useId, useState } from 'react';
import styles from '../styles/LayoutNote.module.scss';

/**
 * The caveat that the pan diagram is representative, not a maker's drawing.
 *
 * It sits with the pan rather than in the scale's About panel, because it is a
 * statement about *this diagram* and needs to be reachable from the view that
 * shows it. Inside a tab it was absent from the page until someone opened that
 * tab — so the default view presented a plausible-looking instrument with no
 * indication that its note positions are computed.
 *
 * A disclosure, not a hover tooltip: on :hover alone it never appeared on
 * touch. The text stays in the accessibility tree at all times via
 * aria-describedby — collapsing hides it visually only — so a screen reader
 * announces the caveat on reaching the button, without the reader having to
 * discover that activating it reveals more.
 */
export default function LayoutNote() {
  const layoutNoteId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.layoutNote}>
      <button
        type="button"
        className={styles.layoutNoteToggle}
        aria-expanded={isOpen}
        aria-controls={layoutNoteId}
        aria-describedby={layoutNoteId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        About this layout
      </button>
      <p
        id={layoutNoteId}
        className={`${styles.layoutNoteText} ${isOpen ? '' : styles.layoutNoteTextCollapsed}`}
      >
        This virtual handpan layout is representative. Actual note positions
        vary depending on the maker and the specific model, so check your own
        instrument before committing a position to memory.
      </p>
    </div>
  );
}
