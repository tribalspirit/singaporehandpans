import type * as ToneModule from 'tone';
import { getTone, peekTone } from './engine';
import { playNote } from './engine';
import { normalizeToPitchClass } from '../theory/normalize';

export type ArpeggioDirection = 'up' | 'down' | 'updown';

export interface PlaybackStep {
  note: string; // e.g. 'D4'
  pitchClass: string; // e.g. 'D'
  index: number;
}

export interface ArpeggioOptions {
  notes: string[];
  bpm: number;
  direction?: ArpeggioDirection;
  onStep?: (step: PlaybackStep) => void;
  onComplete?: () => void;
}

let currentArpeggio: {
  notes: string[];
  direction: ArpeggioDirection;
  onStep?: (step: PlaybackStep) => void;
  onComplete?: () => void;
  scheduledEvents: ToneModule.ToneEvent[];
} | null = null;

function getOrderedNotes(
  notes: string[],
  direction: ArpeggioDirection
): string[] {
  const ordered = [...notes];

  if (direction === 'down') {
    return ordered.reverse();
  } else if (direction === 'updown') {
    return [...ordered, ...ordered.slice(1, -1).reverse()];
  }

  return ordered;
}

export function playArpeggio(options: ArpeggioOptions): void {
  const Tone = getTone();
  stopArpeggio();

  const { notes, bpm, direction = 'up', onStep, onComplete } = options;

  if (notes.length === 0) {
    return;
  }

  const startArpeggio = () => {
    Tone.Transport.bpm.value = bpm;
    const orderedNotes = getOrderedNotes(notes, direction);
    const noteDuration = Tone.Time('4n').toSeconds();
    const scheduledEvents: ToneModule.ToneEvent[] = [];

    orderedNotes.forEach((note, index) => {
      const event = new Tone.ToneEvent((_time) => {
        try {
          playNote(note, noteDuration * 1000);
        } catch (_error) {
          // Silently ignore playback errors
        }
        if (onStep) {
          onStep({
            note,
            pitchClass: normalizeToPitchClass(note),
            index,
          });
        }
      });

      event.start(index * noteDuration);
      scheduledEvents.push(event);
    });

    const totalDuration = orderedNotes.length * noteDuration;
    const completeEvent = new Tone.ToneEvent(() => {
      if (onComplete) {
        onComplete();
      }
      currentArpeggio = null;
    });

    completeEvent.start(totalDuration);
    scheduledEvents.push(completeEvent);

    currentArpeggio = {
      notes: orderedNotes,
      direction,
      onStep,
      onComplete,
      scheduledEvents,
    };

    Tone.Transport.start();
  };

  if (Tone.context.state === 'suspended') {
    Tone.context.resume().then(startArpeggio);
  } else {
    startArpeggio();
  }
}

export function stopArpeggio(): void {
  const Tone = peekTone();
  if (!Tone) {
    currentArpeggio = null;
    return;
  }
  if (currentArpeggio) {
    currentArpeggio.scheduledEvents.forEach((event) => {
      event.dispose();
    });
    currentArpeggio = null;
  }
  Tone.Transport.stop();
  Tone.Transport.cancel();
}

export function isArpeggioPlaying(): boolean {
  const Tone = peekTone();
  if (!Tone) {
    return false;
  }
  return currentArpeggio !== null && Tone.Transport.state === 'started';
}
