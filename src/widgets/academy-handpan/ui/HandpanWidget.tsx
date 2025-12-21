import { useState } from 'react';
import { getAllHandpanConfigs, getHandpanConfig } from '../config/handpans';
import type { HandpanConfig } from '../config/types';

export default function HandpanWidget() {
  const configs = getAllHandpanConfigs();
  const [selectedHandpanId, setSelectedHandpanId] = useState<string>(
    configs[0]?.id || ''
  );

  const selectedHandpan = getHandpanConfig(selectedHandpanId);

  if (!selectedHandpan) {
    return <div>No handpan configuration available</div>;
  }

  return (
    <div className="handpan-widget">
      <div className="handpan-widget__header">
        <h2 className="handpan-widget__title">Handpan Memorization</h2>
        <div className="handpan-widget__selector">
          <label htmlFor="handpan-select" className="handpan-widget__label">
            Select Handpan:
          </label>
          <select
            id="handpan-select"
            value={selectedHandpanId}
            onChange={(e) => setSelectedHandpanId(e.target.value)}
            className="handpan-widget__select"
          >
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="handpan-widget__content">
        <div className="handpan-widget__placeholder">
          Handpan visualization will be rendered here
        </div>
      </div>
    </div>
  );
}

