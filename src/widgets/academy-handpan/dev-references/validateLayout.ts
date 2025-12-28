import { HANDPAN_CONFIGS } from '../config/handpans';
import type { HandpanPad } from '../config/types';

const OVERLAP_THRESHOLD = 0.05;
const CENTER_TOLERANCE = 0.05;

function distance(pad1: HandpanPad, pad2: HandpanPad): number {
  const dx = pad1.x - pad2.x;
  const dy = pad1.y - pad2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPadRadius(pad: HandpanPad): number {
  return pad.r;
}

function checkOverlap(pad1: HandpanPad, pad2: HandpanPad): boolean {
  const dist = distance(pad1, pad2);
  const radius1 = getPadRadius(pad1);
  const radius2 = getPadRadius(pad2);
  return dist < radius1 + radius2 + OVERLAP_THRESHOLD;
}

function findDing(pads: HandpanPad[]): HandpanPad | undefined {
  return pads.find((pad) => pad.id === 'ding' || pad.role === 'ding');
}

function validateLayout(configId: string, pads: HandpanPad[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const pad of pads) {
    if (pad.x < 0 || pad.x > 1 || pad.y < 0 || pad.y > 1) {
      errors.push(`Pad ${pad.id}: coordinates out of bounds (x: ${pad.x}, y: ${pad.y})`);
    }

    if (pad.r <= 0 || pad.r > 1) {
      errors.push(`Pad ${pad.id}: invalid radius (r: ${pad.r})`);
    }
  }

  const ding = findDing(pads);
  if (!ding) {
    errors.push('No ding pad found (id="ding" or role="ding")');
  } else {
    const centerX = 0.5;
    const centerY = 0.5;
    const distFromCenter = Math.sqrt(
      Math.pow(ding.x - centerX, 2) + Math.pow(ding.y - centerY, 2)
    );
    if (distFromCenter > CENTER_TOLERANCE) {
      errors.push(
        `Ding pad is not near center (distance: ${distFromCenter.toFixed(3)}, expected < ${CENTER_TOLERANCE})`
      );
    }
  }

  for (let i = 0; i < pads.length; i++) {
    for (let j = i + 1; j < pads.length; j++) {
      if (checkOverlap(pads[i], pads[j])) {
        errors.push(
          `Pads ${pads[i].id} and ${pads[j].id} overlap (distance: ${distance(pads[i], pads[j]).toFixed(3)})`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAllLayouts(): void {
  console.log('Validating all handpan layouts...\n');

  for (const config of HANDPAN_CONFIGS) {
    const result = validateLayout(config.id, config.layout);
    
    if (result.valid) {
      console.log(`✓ ${config.name} (${config.id}): Valid`);
    } else {
      console.error(`✗ ${config.name} (${config.id}): Invalid`);
      result.errors.forEach((error) => {
        console.error(`  - ${error}`);
      });
    }
  }
}

if (require.main === module) {
  validateAllLayouts();
}


