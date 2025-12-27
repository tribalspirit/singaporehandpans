import { useState, useCallback, useMemo, useEffect } from 'react';
import { getAllHandpanConfigs, getHandpanConfig } from '../config/handpans';
import HandpanRenderer from './HandpanRenderer';
import ScaleInfoPanel from './ScaleInfoPanel';
import ChordsSection from './ChordsSection';
import type { HandpanPad } from '../config/types';
import type { PlayableChord } from '../theory/chords';
import type { PlaybackMode } from './ChordsSection';
import { initializeAudio, isAudioInitialized, playNote } from '../audio/engine';
import { normalizeToPitchClass } from '../theory/normalize';
import type { PlaybackState } from './types';
import styles from '../styles/HandpanWidget.module.scss';

export default function HandpanWidget() {
  const configs = getAllHandpanConfigs();
  const [selectedHandpanId, setSelectedHandpanId] = useState<string>(
    configs[0]?.id || ''
  );
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    activePitchClass: null,
    activeNote: null,
    isPlaying: false,
  });
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
    setPlaybackState({
      activePitchClass: null,
      activeNote: null,
      isPlaying: false,
    });
  }, [selectedHandpanId]);

  const selectedNotes = useMemo(() => {
    const notes = new Set<string>();
    if (selectedChord && selectedHandpan) {
      const highlightPitchClasses = new Set(selectedChord.pitchClasses);
      selectedHandpan.notes.forEach((note) => {
        const pc = normalizeToPitchClass(note);
        if (highlightPitchClasses.has(pc)) {
          notes.add(note);
        }
      });
    }
    return notes;
  }, [selectedChord, selectedHandpan]);

  const activeNotes = useMemo(() => {
    const notes = new Set<string>();
    if (!selectedHandpan) return notes;
    
    // If activeNote is set, always use exact note match (for manual clicks and scale playback)
    if (playbackState.activeNote) {
      // Check if there's a pad with this exact note in the layout
      const hasPad = selectedHandpan.layout.some(pad => pad.note === playbackState.activeNote);
      if (hasPad) {
        notes.add(playbackState.activeNote);
      }
    }
    // For chord arpeggio playback (when only pitchClass is set, no activeNote), use pitch-class match (all octaves)
    else if (playbackState.activePitchClass && playbackState.isPlaying) {
      selectedHandpan.layout.forEach((pad) => {
        if (normalizeToPitchClass(pad.note) === playbackState.activePitchClass) {
          notes.add(pad.note);
        }
      });
    }
    
    return notes;
  }, [playbackState.activeNote, playbackState.activePitchClass, playbackState.isPlaying, selectedHandpan]);

  const handlePadClick = useCallback(async (pad: HandpanPad) => {
    try {
      if (!isAudioInitialized()) {
        await initializeAudio();
      }

      playNote(pad.note, 500);

      // Use exact note match for manual pad clicks
      setPlaybackState({
        activePitchClass: null, // Don't use pitch class for manual clicks
        activeNote: pad.note,   // Use exact note match
        isPlaying: false,
      });

      setTimeout(() => {
        setPlaybackState({
          activePitchClass: null,
          activeNote: null,
          isPlaying: false,
        });
      }, 500);
    } catch (error) {
      try {
        await initializeAudio();
        playNote(pad.note, 500);
        setPlaybackState({
          activePitchClass: null,
          activeNote: pad.note,
          isPlaying: false,
        });
        setTimeout(() => {
          setPlaybackState({
            activePitchClass: null,
            activeNote: null,
            isPlaying: false,
          });
        }, 500);
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
            playbackState={playbackState}
            onPlaybackStateChange={setPlaybackState}
            onChordSelect={() => setSelectedChord(null)}
            availableNotes={selectedHandpan.notes}
          />
        </div>
      </div>
      <div className={styles.chordsSectionWrapper}>
        <ChordsSection
          key={selectedHandpanId}
          availableNotes={selectedHandpan.notes}
          selectedChord={selectedChord}
          onChordSelect={handleChordSelect}
          playbackState={playbackState}
          onPlaybackStateChange={setPlaybackState}
          playbackMode={playbackMode}
          onPlaybackModeChange={setPlaybackMode}
          arpeggioBpm={arpeggioBpm}
          onArpeggioBpmChange={setArpeggioBpm}
        />
      </div>
    </div>
  );
}
