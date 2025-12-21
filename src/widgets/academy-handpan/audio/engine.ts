import * as Tone from 'tone';

let isInitialized = false;
let synth: Tone.PolySynth | null = null;

export async function initializeAudio(): Promise<void> {
  console.log('initializeAudio called, current state:', {
    isInitialized,
    contextState: Tone.context.state,
    hasSynth: !!synth
  });

  // If already initialized and context is running, return early
  if (isInitialized && synth && Tone.context.state === 'running') {
    console.log('Audio already initialized and running');
    return;
  }

  // Reset state if context is not running
  if (Tone.context.state !== 'running') {
    isInitialized = false;
    if (synth) {
      synth.dispose();
      synth = null;
    }
  }

  // Start the audio context
  console.log('Starting Tone context...');
  await Tone.start();
  console.log('Tone.start() completed, context state:', Tone.context.state);
  
  // Verify the context started
  if (Tone.context.state !== 'running') {
    console.error('Audio context failed to start, state:', Tone.context.state);
    throw new Error(`Audio context failed to start. State: ${Tone.context.state}`);
  }
  
  // Create or recreate synth
  if (synth) {
    synth.dispose();
  }
  
  console.log('Creating PolySynth...');
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
  console.log('PolySynth created and connected');

  isInitialized = true;
  console.log('Audio initialization complete');
}

export function isAudioInitialized(): boolean {
  return isInitialized;
}

export function playNote(note: string, durationMs: number = 500): void {
  console.log('playNote called:', note, 'duration:', durationMs);
  if (!isInitialized || !synth) {
    console.error('Audio not initialized!', { isInitialized, hasSynth: !!synth });
    throw new Error('Audio not initialized. Call initializeAudio() first.');
  }

  if (Tone.context.state !== 'running') {
    console.error('Audio context not running!', Tone.context.state);
    throw new Error(`Audio context not running. State: ${Tone.context.state}`);
  }

  const duration = Tone.Time(durationMs / 1000).toSeconds();
  console.log('Triggering note:', note, 'duration (seconds):', duration);
  synth.triggerAttackRelease(note, duration);
  console.log('Note triggered');
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

