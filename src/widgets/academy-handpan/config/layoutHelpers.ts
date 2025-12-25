import type { HandpanPad } from './types';
import { parseNote } from '../theory/normalize';

function getNotePitch(note: string): number {
  try {
    const parsed = parseNote(note);
    if (parsed.octave === null) return 0;
    return parsed.octave * 12 + (parsed.pitchClass.charCodeAt(0) - 65);
  } catch {
    return 0;
  }
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleDeg: number): { x: number; y: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad),
  };
}

export function calculateRingLayout(
  notes: string[],
  centerX: number = 0.5,
  centerY: number = 0.5,
  baseRadius: number = 0.32,
  startAngle: number = 270
): Array<{ note: string; x: number; y: number }> {
  const sortedNotes = [...notes].sort((a, b) => getNotePitch(a) - getNotePitch(b));
  const angleStep = 360 / sortedNotes.length;
  
  return sortedNotes.map((note, index) => {
    const angle = startAngle + index * angleStep;
    const { x, y } = polarToCartesian(centerX, centerY, baseRadius, angle);
    return { note, x, y };
  });
}

export function sortPadsByPitch(pads: HandpanPad[]): HandpanPad[] {
  return [...pads].sort((a, b) => {
    const pitchA = getNotePitch(a.note);
    const pitchB = getNotePitch(b.note);
    if (pitchA !== pitchB) return pitchA - pitchB;
    return a.id.localeCompare(b.id);
  });
}

