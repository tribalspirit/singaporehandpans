import type { HandpanConfig, HandpanPad } from '../config/types';
import styles from '../styles/HandpanRenderer.module.scss';

interface HandpanRendererProps {
  config: HandpanConfig;
  selectedNotes?: Set<string>;
  activeNotes?: Set<string>;
  onPadClick?: (pad: HandpanPad) => void;
}

export default function HandpanRenderer({
  config,
  selectedNotes = new Set(),
  activeNotes = new Set(),
  onPadClick,
}: HandpanRendererProps) {
  const handlePadClick = (pad: HandpanPad) => {
    if (onPadClick) {
      onPadClick(pad);
    }
  };

  return (
    <div className={styles.handpanRenderer}>
      <div className={styles.body}>
        {config.layout.map((pad) => {
          const isSelected = selectedNotes.has(pad.note);
          const isActive = activeNotes.has(pad.note);
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
                width: `${pad.r * 100}%`,
                height: `${pad.r * 100}%`,
              }}
              onClick={() => handlePadClick(pad)}
              aria-label={`Note ${pad.note}`}
            >
              <span className={styles.padLabel}>{pad.note}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

