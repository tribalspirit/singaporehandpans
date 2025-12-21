import * as Tone from 'tone';

let isInitialized = false;
let synth: Tone.PolySynth | null = null;

export async function initializeAudio(): Promise<void> {
  if (isInitialized && synth) {
    // Check if context is actually running
    if (Tone.context.state === 'running') {
      return;
    }
  }

  // Start the audio context
  await Tone.start();
  
  // Verify the context started
  if (Tone.context.state !== 'running') {
    throw new Error('Audio context failed to start. User interaction may be required.');
  }
  
  // Create or recreate synth
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
}

export function isAudioInitialized(): boolean {
  return isInitialized;
}

export function playNote(note: string, durationMs: number = 500): void {
  if (!isInitialized || !synth) {
    throw new Error('Audio not initialized. Call initializeAudio() first.');
  }

  const duration = Tone.Time(durationMs / 1000).toSeconds();
  synth.triggerAttackRelease(note, duration);
}

export function playChord(notes: string[], durationMs: number = 1000): void {
  if (!isInitialized || !synth) {
    throw new Error('Audio not initialized. Call initializeAudio() first.');
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

  const duration = Tone.Time(noteDurationMs / 1000).toSeconds();
  const start = startTime !== undefined ? Tone.Time(startTime).toSeconds() : Tone.now();

  notes.forEach((note, index) => {
    const time = start + index * duration;
    synth?.triggerAttackRelease(note, duration, time);
  });
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

