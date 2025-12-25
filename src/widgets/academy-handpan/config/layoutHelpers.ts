import type { HandpanPad } from './types';
import { note } from '@tonaljs/core';

const INSCRIBED_CIRCLE_RADIUS = 0.32;
const BASE_NOTE_RADIUS = 0.12;
const DING_RADIUS = 0.20;
const CENTER_X = 0.5;
const CENTER_Y = 0.5;
const START_ANGLE_DEG = 90;
const TILT_ANGLE_DEG = 10;
const PITCH_SIZE_MULTIPLIER = 0.002;
const MIN_SIZE_MULTIPLIER = 0.7;

function getNotePitch(noteStr: string): number {
  try {
    const parsed = note(noteStr);
    return parsed.midi !== null ? parsed.midi : 0;
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

function calculateNoteRadius(noteStr: string, basePitch: number): number {
  const pitch = getNotePitch(noteStr);
  const pitchDiff = pitch - basePitch;
  const sizeMultiplier = Math.max(MIN_SIZE_MULTIPLIER, 1 - pitchDiff * PITCH_SIZE_MULTIPLIER);
  return BASE_NOTE_RADIUS * sizeMultiplier;
}

function calculateEqualRingAngles(ringNoteCount: number): number[] {
  if (ringNoteCount === 0) return [];
  if (ringNoteCount === 1) {
    return [(START_ANGLE_DEG + TILT_ANGLE_DEG) % 360];
  }
  
  const startDeg = (START_ANGLE_DEG + TILT_ANGLE_DEG) % 360;
  const stepDeg = 360 / ringNoteCount;
  const angles: number[] = [];
  
  for (let i = 0; i < ringNoteCount; i++) {
    const angle = (startDeg + i * stepDeg) % 360;
    angles.push(angle);
  }
  
  return angles;
}

interface Slot {
  index: number;
  angleDeg: number;
  x: number;
  y: number;
}

function buildRingSlots(ringNoteCount: number): Slot[] {
  const angles = calculateEqualRingAngles(ringNoteCount);
  return angles.map((angleDeg, index) => {
    const { x, y } = polarToCartesian(CENTER_X, CENTER_Y, INSCRIBED_CIRCLE_RADIUS, angleDeg);
    return { index, angleDeg, x, y };
  });
}

function createZigZagSlotOrder(ringNoteCount: number): number[] {
  if (ringNoteCount === 0) return [];
  if (ringNoteCount === 1) return [0];
  
  const slots = buildRingSlots(ringNoteCount);
  const leftSlots = slots.filter(s => s.x < CENTER_X).sort((a, b) => b.y - a.y);
  const rightSlots = slots.filter(s => s.x >= CENTER_X).sort((a, b) => b.y - a.y);
  
  const order: number[] = [];
  let leftIndex = 0;
  let rightIndex = 0;
  
  for (let sortedIndex = 0; sortedIndex < ringNoteCount; sortedIndex++) {
    const isLeft = sortedIndex % 2 === 0;
    
    if (isLeft && leftIndex < leftSlots.length) {
      order.push(leftSlots[leftIndex].index);
      leftIndex++;
    } else if (!isLeft && rightIndex < rightSlots.length) {
      order.push(rightSlots[rightIndex].index);
      rightIndex++;
    } else {
      if (leftIndex < leftSlots.length) {
        order.push(leftSlots[leftIndex].index);
        leftIndex++;
      } else if (rightIndex < rightSlots.length) {
        order.push(rightSlots[rightIndex].index);
        rightIndex++;
      }
    }
  }
  
  return order;
}

export function generateHandpanLayout(
  notes: string[],
  dingNote: string,
  slotOrderOverride?: number[]
): HandpanPad[] {
  const dingPad: HandpanPad = {
    id: 'ding',
    note: dingNote,
    x: CENTER_X,
    y: CENTER_Y,
    r: DING_RADIUS,
    role: 'ding',
  };

  const ringNotes = notes.filter((n) => n !== dingNote);
  const sortedRingNotes = [...ringNotes].sort((a, b) => {
    const pitchA = getNotePitch(a);
    const pitchB = getNotePitch(b);
    if (pitchA !== pitchB) return pitchA - pitchB;
    return a.localeCompare(b);
  });

  const ringNoteCount = sortedRingNotes.length;
  const basePitch = sortedRingNotes.length > 0 ? getNotePitch(sortedRingNotes[0]) : 60;
  const slots = buildRingSlots(ringNoteCount);
  const zigZagOrder = slotOrderOverride || createZigZagSlotOrder(ringNoteCount);

  const ringPads: HandpanPad[] = sortedRingNotes.map((noteStr, sortedIndex) => {
    const slotIndex = zigZagOrder[sortedIndex] ?? sortedIndex;
    const slot = slots[slotIndex];
    const noteRadius = calculateNoteRadius(noteStr, basePitch);
    const isBottomNote = sortedIndex === 0 && slot.y > CENTER_Y + 0.1;

    return {
      id: `pad-${sortedIndex + 1}`,
      note: noteStr,
      x: slot.x,
      y: slot.y,
      r: noteRadius,
      role: isBottomNote ? 'bottom' : 'ring',
    };
  });

  return [dingPad, ...ringPads];
}

export function sortPadsByPitch(pads: HandpanPad[]): HandpanPad[] {
  return [...pads].sort((a, b) => {
    const pitchA = getNotePitch(a.note);
    const pitchB = getNotePitch(b.note);
    if (pitchA !== pitchB) return pitchA - pitchB;
    return a.id.localeCompare(b.id);
  });
}
