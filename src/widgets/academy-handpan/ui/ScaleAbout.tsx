import React, { useId, useState } from 'react';
import styles from '../styles/ScaleAbout.module.scss';

interface ScaleAboutProps {
  name: string;
  aliases?: string[];
  description: string;
  moodTags: string[];
}

export default function ScaleAbout({
  name,
  aliases,
  description,
  moodTags,
}: ScaleAboutProps) {
  const layoutNoteId = useId();
  const [isLayoutNoteOpen, setIsLayoutNoteOpen] = useState(false);

  return (
    <div className={styles.about}>
      <div className={styles.heading}>
        <h3 className={styles.scaleName}>{name}</h3>
        {aliases && aliases.length > 0 && (
          <p className={styles.aliases}>Also called {aliases.join(', ')}</p>
        )}
      </div>

      <p className={styles.description}>{description}</p>

      {moodTags.length > 0 && (
        <ul className={styles.moodTags}>
          {moodTags.map((tag) => (
            <li key={tag} className={styles.moodTag}>
              {tag}
            </li>
          ))}
        </ul>
      )}

      {/*
        A disclosure, not a hover tooltip.
        
        This carries the one caveat that stops someone mis-learning their own
        instrument, and on :hover alone it never appeared for the third to half
        of visitors on touch. The text stays in the accessibility tree at all
        times via aria-describedby — collapsing hides it visually only — so a
        screen reader announces the caveat on reaching the button, without
        having to discover that activating it reveals more.
      */}
      <div className={styles.layoutNote}>
        <button
          type="button"
          className={styles.layoutNoteToggle}
          aria-expanded={isLayoutNoteOpen}
          aria-controls={layoutNoteId}
          aria-describedby={layoutNoteId}
          onClick={() => setIsLayoutNoteOpen((open) => !open)}
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
          className={`${styles.layoutNoteText} ${isLayoutNoteOpen ? '' : styles.layoutNoteTextCollapsed}`}
        >
          This virtual handpan layout is representative. Actual note positions
          vary depending on the maker and the specific model, so check your own
          instrument before committing a position to memory.
        </p>
      </div>
    </div>
  );
}
