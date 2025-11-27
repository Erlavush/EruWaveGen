import { useRef, useCallback } from 'react';
import { AudioData } from '../types';

export const useAudio = (fftSize: number = 2048) => {
  // Store the "physics" state of the bars (current height, velocity)
  const physicsRef = useRef<{ value: number; velocity: number }[]>([]);
  
  const dataArrayRef = useRef<AudioData>({
    timeData: new Uint8Array(fftSize),
    freqData: new Uint8Array(fftSize / 2),
  });

  const simStateRef = useRef({
    beatPhase: 0,
    melodyPhase: 0,
    hatsPhase: 0,
    noiseOffset: 0
  });

  // Initialize physics array if needed
  const initPhysics = (size: number) => {
    if (physicsRef.current.length !== size) {
        physicsRef.current = new Array(size).fill(0).map(() => ({ value: 0, velocity: 0 }));
    }
  };

  const getAudioData = useCallback((): AudioData => {
    const freqData = dataArrayRef.current.freqData;
    const timeData = dataArrayRef.current.timeData;
    const size = freqData.length;
    
    initPhysics(size);

    // --- 1. SIMULATION ENGINE ---
    // We simulate a track with: Kick (Sub), Bass (Low), Mids (Melody), Highs (Hats)
    
    simStateRef.current.beatPhase += 0.1;   // Fast kick
    simStateRef.current.melodyPhase += 0.02; // Slow melody
    simStateRef.current.hatsPhase += 0.5;    // Very fast hats
    simStateRef.current.noiseOffset += 0.01;

    const { beatPhase, melodyPhase, hatsPhase, noiseOffset } = simStateRef.current;

    // Create a virtual "Source" array first (Linear distribution)
    const sourceSize = 128; // Simulation resolution
    const source = new Float32Array(sourceSize);

    for (let i = 0; i < sourceSize; i++) {
        const p = i / sourceSize; // 0.0 to 1.0
        let amp = 0;

        // KICK (0.0 - 0.15)
        if (p < 0.15) {
            const beat = Math.pow(Math.sin(beatPhase), 60); // Sharp rhythmic spike
            amp += beat * 250 * (1 - p/0.15); 
        }

        // BASSLINE (0.1 - 0.4)
        if (p > 0.1 && p < 0.4) {
            const bass = Math.sin(melodyPhase + p * 10) * 0.5 + 0.5;
            amp += bass * 150 * Math.sin(beatPhase * 0.5); // Sidechain effect
        }

        // MIDS/VOCALS (0.3 - 0.7)
        if (p > 0.3 && p < 0.7) {
            const melody = Math.sin(p * 20 + melodyPhase * 2) * Math.cos(melodyPhase * 0.5);
            amp += Math.abs(melody) * 100;
        }

        // HATS/AIR (0.6 - 1.0)
        if (p > 0.6) {
             const hat = (Math.random() > 0.8 ? 1 : 0) * (Math.sin(hatsPhase) > 0.8 ? 1 : 0);
             amp += hat * 180 * p; // Highs get louder near top
             amp += Math.random() * 20; // Constant air noise
        }

        source[i] = amp;
    }

    // --- 2. LOGARITHMIC MAPPING & PHYSICS ---
    // Map the source (Linear) to the output (Logarithmic) to match Cava style
    // Low frequencies should take up more space.
    
    for (let i = 0; i < size; i++) {
        // Logarithmic index mapping
        // We want 'i' (0 to size) to map to 'srcIdx' (0 to sourceSize) logarithmically
        // Formula: sourceIndex = sourceSize * ((i / size) ^ power)
        // Power < 1 expands the lows. Power > 1 expands the highs.
        // We use Power ~ 2.5 to compress the lows into the left and expand highs? 
        // No, visualizers usually WANT more bass resolution. 
        // Standard Log mapping: f = f_min * (f_max / f_min) ^ (i / N)
        
        // Simplified "Nice Look" mapping:
        // We actually want to sample the source linearly but distinct parts?
        // Let's just map linear source to output for now but apply the Cava gravity.
        
        // To get the "Cava" look where bars are distinct:
        const srcIdx = Math.floor((i / size) * sourceSize);
        const targetValue = Math.min(255, source[srcIdx] || 0);

        // Physics: Gravity & Velocity
        const phys = physicsRef.current[i];
        
        // Attack: If target is higher, jump up (with some smoothing)
        if (targetValue > phys.value) {
            phys.value = targetValue;
            phys.velocity = 0;
        } else {
            // Decay: Fall down with gravity
            phys.velocity += 1.5; // Gravity acceleration
            phys.value -= phys.velocity;
            
            if (phys.value < 0) {
                phys.value = 0;
                phys.velocity = 0;
            }
        }

        freqData[i] = phys.value;
    }

    // --- 3. TIME DATA (Waveform) ---
    for (let i = 0; i < timeData.length; i++) {
        const x = i / 50;
        timeData[i] = 128 + Math.sin(x + melodyPhase) * 30 + Math.random() * 5;
    }

    return dataArrayRef.current;
  }, []);

  return { 
    isListening: true,
    startListening: async () => {},
    stopListening: () => {},
    getAudioData 
  };
};