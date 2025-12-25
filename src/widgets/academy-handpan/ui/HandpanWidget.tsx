import { useState, useCallback, useMemo, useEffect } from 'react';
import { getAllHandpanConfigs, getHandpanConfig } from '../config/handpans';
import HandpanRenderer from './HandpanRenderer';
import ScaleInfoPanel from './ScaleInfoPanel';
import ChordsSection from './ChordsSection';
import type { HandpanPad } from '../config/types';
import type { PlayableChord } from '../theory/chords';
import type { PlaybackMode } from './ChordsSection';
import { initializeAudio, isAudioInitialized, playNote } from '../audio/engine';
import styles from '../styles/HandpanWidget.module.scss';

export default function HandpanWidget() {
  const configs = getAllHandpanConfigs();
  const [selectedHandpanId, setSelectedHandpanId] = useState<string>(
    configs[0]?.id || ''
  );
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [selectedChord, setSelectedChord] = useState<PlayableChord | null>(
    null
  );
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('arpeggio');
  const [arpeggioBpm, setArpeggioBpm] = useState<number>(120);

  const selectedHandpan = getHandpanConfig(selectedHandpanId);
  const selectedScaleInfo = useMemo(() => {
    if (!selectedHandpan) return null;
    return {
      name: selectedHandpan.scaleName,
      aliases: selectedHandpan.scaleAliases,
      description: selectedHandpan.scaleDescription,
      moodTags: selectedHandpan.scaleMoodTags,
    };
  }, [selectedHandpanId]);

  useEffect(() => {
    setSelectedChord(null);
    setActiveNotes(new Set());
  }, [selectedHandpanId]);

  const selectedNotes = useMemo(() => {
    const notes = new Set<string>();
    if (selectedChord) {
      selectedChord.notes.forEach((note) => notes.add(note));
    }
    return notes;
  }, [selectedChord]);

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

  const handleChordSelect = useCallback((chord: PlayableChord | null) => {
    setSelectedChord(chord);
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
            onChange={(e) => {
              setSelectedHandpanId(e.target.value);
            }}
            className={styles.select}
            aria-label="Select handpan type"
          >
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.topRow}>
        <div className={styles.handpanSection}>
          <HandpanRenderer
            key={selectedHandpanId}
            config={selectedHandpan}
            selectedNotes={selectedNotes}
            activeNotes={activeNotes}
            onPadClick={handlePadClick}
          />
        </div>
        <div className={styles.scaleInfoSection}>
          <ScaleInfoPanel
            key={`${selectedHandpanId}-${selectedHandpan.scaleName}-${selectedHandpan.scaleDescription}`}
            scaleInfo={selectedScaleInfo}
            scaleNotes={selectedHandpan.notes}
            onActiveNotesChange={setActiveNotes}
          />
        </div>
      </div>
      <div className={styles.chordsSectionWrapper}>
        <ChordsSection
          key={selectedHandpanId}
          availableNotes={selectedHandpan.notes}
          selectedChord={selectedChord}
          onChordSelect={handleChordSelect}
          onActiveNotesChange={setActiveNotes}
          playbackMode={playbackMode}
          onPlaybackModeChange={setPlaybackMode}
          arpeggioBpm={arpeggioBpm}
          onArpeggioBpmChange={setArpeggioBpm}
        />
      </div>
    </div>
  );
}
