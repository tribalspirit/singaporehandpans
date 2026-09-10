import React from 'react';
import type { HandpanConfig, HandpanPad } from '../config/types';
import { parseNote } from '../theory/normalize';
import {
  buildPadIdentities,
  padAccessibleName,
  padVisibleLabel,
  type NotationMode,
} from '../core/notation/padLabel';
import styles from '../styles/HandpanRenderer.module.scss';

interface HandpanRendererProps {
  config: HandpanConfig;
  selectedNotes?: Set<string>;
  activeNotes?: Set<string>;
  onPadClick?: (pad: HandpanPad) => void;
  showDebugGrid?: boolean;
  notation?: NotationMode;
}

function getPadSizeMultiplier(note: string): number {
  try {
    const { octave } = parseNote(note);
    if (octave === null) return 1;

    const baseOctave = 4;
    const octaveDiff = octave - baseOctave;
    return 1 - octaveDiff * 0.2;
  } catch {
    return 1;
  }
}

export default function HandpanRenderer({
  config,
  selectedNotes = new Set(),
  activeNotes = new Set(),
  onPadClick,
  showDebugGrid = false,
  notation = 'note',
}: HandpanRendererProps) {
  const padIdentities = buildPadIdentities(config.layout, config.notes);
  const layoutNoteId = `handpan-layout-note-${config.id}`;
  const handlePadClick = (pad: HandpanPad) => {
    if (onPadClick) {
      onPadClick(pad);
    }
  };

  return (
    <div className={styles.handpanRenderer}>
      <div className={styles.body} aria-describedby={layoutNoteId}>
        {showDebugGrid && (
          <>
            <div className={styles.debugCenter} />
            <div className={styles.debugCircle1} />
            <div className={styles.debugCircle2} />
            <div className={styles.debugCircle3} />
            <div className={styles.debugCrosshairH} />
            <div className={styles.debugCrosshairV} />
          </>
        )}
        {config.layout.map((pad) => {
          const identity = padIdentities.get(pad.id);
          const isSelected = selectedNotes.has(pad.note);
          const isActive = activeNotes.has(pad.note);
          const sizeMultiplier = getPadSizeMultiplier(pad.note);
          const adjustedRadius = pad.r * sizeMultiplier;
          const padClassNames = [
            styles.pad,
            isSelected ? styles.padSelected : '',
            isActive ? styles.padActive : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={pad.id}
              type="button"
              className={padClassNames}
              style={{
                left: `${pad.x * 100}%`,
                top: `${pad.y * 100}%`,
                width: `${adjustedRadius * 100}%`,
                height: `${adjustedRadius * 100}%`,
              }}
              onClick={() => handlePadClick(pad)}
              aria-label={padAccessibleName(pad, identity)}
            >
              <span className={styles.padLabel}>
                {padVisibleLabel(pad, identity, notation)}
              </span>
              {showDebugGrid && (
                <>
                  <span className={styles.debugPadId}>{pad.id}</span>
                  <span className={styles.debugPadNote}>{pad.note}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {/*
        Tone-field positions here are computed, not sourced from a maker's
        drawing or photograph. Saying so plainly keeps the diagram useful for
        learning the note order without implying it depicts a real instrument's
        physical layout.
      */}
      <p id={layoutNoteId} className={styles.layoutNote}>
        Schematic layout &mdash; pad order is illustrative, not a verified maker
        layout.
      </p>
    </div>
  );
}
