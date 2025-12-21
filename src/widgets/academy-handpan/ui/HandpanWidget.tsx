import { useState, useCallback } from 'react';
import { getAllHandpanConfigs, getHandpanConfig } from '../config/handpans';
import HandpanRenderer from './HandpanRenderer';
import type { HandpanPad } from '../config/types';
import { initializeAudio, isAudioInitialized, playNote } from '../audio/engine';
import styles from '../styles/HandpanWidget.module.scss';

export default function HandpanWidget() {
  const configs = getAllHandpanConfigs();
  const [selectedHandpanId, setSelectedHandpanId] = useState<string>(
    configs[0]?.id || ''
  );
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());

  const selectedHandpan = getHandpanConfig(selectedHandpanId);

  const handlePadClick = useCallback(async (pad: HandpanPad) => {
    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }

      playNote(pad.note, 500);

      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.add(pad.note);
        return next;
      });

      setTimeout(() => {
        setActiveNotes((prev) => {
          const next = new Set(prev);
          next.delete(pad.note);
          return next;
        });
      }, 300);
    } catch (error) {
      console.error('Error playing note:', error);
    }
  }, []);

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
            onChange={(e) => setSelectedHandpanId(e.target.value)}
            className={styles.select}
          >
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.content}>
        <HandpanRenderer
          config={selectedHandpan}
          activeNotes={activeNotes}
          onPadClick={handlePadClick}
        />
      </div>
    </div>
  );
}

