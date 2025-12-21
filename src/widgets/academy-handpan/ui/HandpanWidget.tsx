import { useState } from 'react';
import { getAllHandpanConfigs, getHandpanConfig } from '../config/handpans';
import HandpanRenderer from './HandpanRenderer';
import type { HandpanPad } from '../config/types';
import styles from '../styles/HandpanWidget.module.scss';

export default function HandpanWidget() {
  const configs = getAllHandpanConfigs();
  const [selectedHandpanId, setSelectedHandpanId] = useState<string>(
    configs[0]?.id || ''
  );

  const selectedHandpan = getHandpanConfig(selectedHandpanId);

  const handlePadClick = (pad: HandpanPad) => {
    console.log('Pad clicked:', pad.note);
  };

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
        <HandpanRenderer config={selectedHandpan} onPadClick={handlePadClick} />
      </div>
    </div>
  );
}

