import React from 'react';
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
    </div>
  );
}
