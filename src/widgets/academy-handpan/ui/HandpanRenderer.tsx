import type { HandpanConfig, HandpanPad } from '../config/types';

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
    <div className="handpan-renderer">
      <div className="handpan-renderer__body">
        {config.layout.map((pad) => {
          const isSelected = selectedNotes.has(pad.note);
          const isActive = activeNotes.has(pad.note);
          const padClass = [
            'handpan-renderer__pad',
            isSelected && 'handpan-renderer__pad--selected',
            isActive && 'handpan-renderer__pad--active',
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
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => handlePadClick(pad)}
              aria-label={`Note ${pad.note}`}
            >
              <span className="handpan-renderer__pad-label">{pad.note}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

