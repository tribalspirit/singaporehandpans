import { useState, useCallback, useMemo, useEffect } from 'react';
import { getAllHandpanConfigs, getHandpanConfig } from '../config/handpans';
import HandpanRenderer from './HandpanRenderer';
import Tabs from './Tabs';
import ScalesPanel from './ScalesPanel';
import type { HandpanPad } from '../config/types';
import type { PlayableScale } from '../theory/scales';
import { initializeAudio, isAudioInitialized, playNote } from '../audio/engine';
import styles from '../styles/HandpanWidget.module.scss';

export default function HandpanWidget() {
  const configs = getAllHandpanConfigs();
  const [selectedHandpanId, setSelectedHandpanId] = useState<string>(
    configs[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'scales' | 'chords'>('scales');
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [selectedScale, setSelectedScale] = useState<PlayableScale | null>(null);

  const selectedHandpan = getHandpanConfig(selectedHandpanId);

  useEffect(() => {
    setSelectedScale(null);
    setActiveNotes(new Set());
  }, [selectedHandpanId]);

  const selectedNotes = useMemo(() => {
    const notes = new Set<string>();
    if (selectedScale) {
      selectedScale.notes.forEach((note) => notes.add(note));
    }
    return notes;
  }, [selectedScale]);

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
      try {
        await initializeAudio();
        playNote(pad.note, 500);
      } catch (retryError) {
        // Audio initialization failed
      }
    }
  }, []);

  const handleScaleSelect = useCallback((scale: PlayableScale | null) => {
    setSelectedScale(scale);
  }, []);

  if (!selectedHandpan) {
    return <div>No handpan configuration available</div>;
  }

  const tabs = [
    { id: 'scales', label: 'Scales & Modes' },
    { id: 'chords', label: 'Chords' },
  ];

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
            onChange={(e) => {
              setSelectedHandpanId(e.target.value);
            }}
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
        <div className={styles.handpanSection}>
          <HandpanRenderer
            key={selectedHandpanId}
            config={selectedHandpan}
            selectedNotes={selectedNotes}
            activeNotes={activeNotes}
            onPadClick={handlePadClick}
          />
        </div>
        <div className={styles.panelsSection}>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'scales' | 'chords')}
          />
          {activeTab === 'scales' && (
            <ScalesPanel
              key={selectedHandpanId}
              availableNotes={selectedHandpan.notes}
              selectedScale={selectedScale}
              onScaleSelect={handleScaleSelect}
              onActiveNotesChange={setActiveNotes}
            />
          )}
          {activeTab === 'chords' && (
            <div className={styles.placeholder}>
              Chords panel coming soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

