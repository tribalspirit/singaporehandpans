import type { HandpanConfig, HandpanPad } from '../config/types';
import { parseNote } from '../theory/normalize';
import styles from '../styles/HandpanRenderer.module.scss';

interface HandpanRendererProps {
  config: HandpanConfig;
  selectedNotes?: Set<string>;
  activeNotes?: Set<string>;
  onPadClick?: (pad: HandpanPad) => void;
  showDebugGrid?: boolean;
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
}: HandpanRendererProps) {
  const handlePadClick = (pad: HandpanPad) => {
    if (onPadClick) {
      onPadClick(pad);
    }
  };

  return (
    <div className={styles.handpanRenderer}>
      <div className={styles.body}>
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
          const isSelected = selectedNotes.has(pad.note);
          const isActive = activeNotes.has(pad.note);
          const sizeMultiplier = getPadSizeMultiplier(pad.note);
          const adjustedRadius = pad.r * sizeMultiplier;
          
          const padClass = [
            styles.pad,
            isSelected && styles.padSelected,
            isActive && styles.padActive,
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={pad.id}
              type="button"
              className={padClass}
              style={{
                left: `${pad.x * 100}%`,
                top: `${pad.y * 100}%`,
                width: `${adjustedRadius * 100}%`,
                height: `${adjustedRadius * 100}%`,
              }}
              onClick={() => handlePadClick(pad)}
              aria-label={`Note ${pad.note}`}
            >
              <span className={styles.padLabel}>{pad.note}</span>
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
    </div>
  );
}

