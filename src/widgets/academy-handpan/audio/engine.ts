import * as Tone from 'tone';

let isInitialized = false;
let synth: Tone.PolySynth | null = null;
let initializationPromise: Promise<void> | null = null;

export async function initializeAudio(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  if (isInitialized && synth && Tone.context.state === 'running') {
    return;
  }

  initializationPromise = (async () => {
    try {
      if (
        Tone.context.state === 'suspended' ||
        Tone.context.state === 'closed'
      ) {
        isInitialized = false;
        if (synth) {
          synth.dispose();
          synth = null;
        }
      }

      await Tone.start();

      if (Tone.context.state !== 'running') {
        await new Promise<void>((resolve) => {
          const checkState = () => {
            if (Tone.context.state === 'running') {
              resolve();
            } else {
              setTimeout(checkState, 50);
            }
          };
          setTimeout(checkState, 100);
        });
      }

      if (Tone.context.state !== 'running') {
        throw new Error(
          `Audio context failed to start. State: ${Tone.context.state}`
        );
      }

      if (synth) {
        synth.dispose();
      }

      synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sine',
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.3,
          release: 0.5,
        },
      }).toDestination();

      isInitialized = true;
    } finally {
      initializationPromise = null;
    }
  })();

  return initializationPromise;
}

export function isAudioInitialized(): boolean {
  return isInitialized;
}

export function playNote(note: string, durationMs: number = 500): void {
  if (!isInitialized || !synth) {
    throw new Error('Audio not initialized. Call initializeAudio() first.');
  }

  if (Tone.context.state === 'suspended') {
    Tone.context.resume().then(() => {
      if (synth) {
        const duration = Tone.Time(durationMs / 1000).toSeconds();
        synth.triggerAttackRelease(note, duration);
      }
    });
    return;
  }

  if (Tone.context.state !== 'running') {
    throw new Error(`Audio context not running. State: ${Tone.context.state}`);
  }

  const duration = Tone.Time(durationMs / 1000).toSeconds();
  synth.triggerAttackRelease(note, duration);
}

export function playChord(notes: string[], durationMs: number = 1000): void {
  if (!isInitialized || !synth) {
    throw new Error('Audio not initialized. Call initializeAudio() first.');
  }

  if (Tone.context.state === 'suspended') {
    Tone.context.resume().then(() => {
      if (synth) {
        const duration = Tone.Time(durationMs / 1000).toSeconds();
        synth.triggerAttackRelease(notes, duration);
      }
    });
    return;
  }

  const duration = Tone.Time(durationMs / 1000).toSeconds();
  synth.triggerAttackRelease(notes, duration);
}

export function playArpeggio(
  notes: string[],
  noteDurationMs: number = 200,
  startTime?: number
): void {
  if (!isInitialized || !synth) {
    throw new Error('Audio not initialized. Call initializeAudio() first.');
  }

  const playNotes = () => {
    if (!synth) return;
    const duration = Tone.Time(noteDurationMs / 1000).toSeconds();
    const start =
      startTime !== undefined ? Tone.Time(startTime).toSeconds() : Tone.now();

    notes.forEach((note, index) => {
      const time = start + index * duration;
      synth?.triggerAttackRelease(note, duration, time);
    });
  };

  if (Tone.context.state === 'suspended') {
    Tone.context.resume().then(playNotes);
    return;
  }

  playNotes();
}

export function stopAll(): void {
  if (synth) {
    synth.releaseAll();
  }
}

export function dispose(): void {
  if (synth) {
    synth.dispose();
    synth = null;
  }
  isInitialized = false;
}
