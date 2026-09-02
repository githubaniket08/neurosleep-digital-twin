/**
 * NeuroSleep Digital Twin Platform - Interactive Sound System (sound.js)
 * Generates dynamic sound synthesis (neural hum, alert sweep, UI clicks) using the Web Audio API.
 */

window.NeuroSound = (function() {
  let audioCtx = null;
  let masterGain = null;
  let ambientOsc1 = null;
  let ambientOsc2 = null;
  let noiseNode = null;
  let humFilter = null;
  let noiseGain = null;
  let isMuted = true;
  let isInitialized = false;

  /**
   * Initializes the Audio Context and builds the synthesizer graph.
   * This must be called inside a user gesture (e.g., button click).
   */
  function init() {
    if (isInitialized) return;
    
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
      
      // Master Gain
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0, audioCtx.currentTime); // Start silent
      masterGain.connect(audioCtx.destination);
      
      // 1. Create Neural Hum (Binaural beats for brainwaves: 55Hz and 59Hz -> 4Hz Delta)
      ambientOsc1 = audioCtx.createOscillator();
      ambientOsc2 = audioCtx.createOscillator();
      
      ambientOsc1.type = 'sine';
      ambientOsc2.type = 'sine';
      
      ambientOsc1.frequency.setValueAtTime(55, audioCtx.currentTime); // Left hum
      ambientOsc2.frequency.setValueAtTime(59, audioCtx.currentTime); // Right hum
      
      // Split channels for binaural effect
      const merger = audioCtx.createChannelMerger(2);
      const gainL = audioCtx.createGain();
      const gainR = audioCtx.createGain();
      
      gainL.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainR.gain.setValueAtTime(0.15, audioCtx.currentTime);
      
      ambientOsc1.connect(gainL).connect(merger, 0, 0);
      ambientOsc2.connect(gainR).connect(merger, 0, 1);
      
      // Lowpass filter to make it a deep, soothing rumble
      humFilter = audioCtx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.setValueAtTime(120, audioCtx.currentTime);
      humFilter.Q.setValueAtTime(1, audioCtx.currentTime);
      
      merger.connect(humFilter).connect(masterGain);
      
      // 2. Create Neural Noise (Pink noise source)
      noiseNode = createPinkNoiseNode();
      noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.005, audioCtx.currentTime); // Subtle baseline
      
      if (noiseNode) {
        noiseNode.connect(noiseGain);
        noiseGain.connect(humFilter);
      }
      
      // Start oscillators
      ambientOsc1.start();
      ambientOsc2.start();
      if (noiseNode) noiseNode.start();
      
      isInitialized = true;
      console.log("NeuroSound engine initialized successfully.");
    } catch (e) {
      console.error("Failed to initialize Web Audio API:", e);
    }
  }

  /**
   * Helper to create a Pink Noise AudioNode
   */
  function createPinkNoiseNode() {
    if (!audioCtx) return null;
    const bufferSize = 4 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      output[i] = pink * 0.11; // rough compensation
    }
    
    const node = audioCtx.createBufferSource();
    node.buffer = noiseBuffer;
    node.loop = true;
    return node;
  }

  /**
   * Updates sound characteristics dynamically based on simulation parameters.
   * As sleep deprivation increases, we decrease the hum pitch, increase noise, and modulate filter.
   * @param {number} severity - Damage severity index (0 to 100)
   */
  function updateState(severity) {
    if (!isInitialized || isMuted) return;
    
    const t = audioCtx.currentTime;
    const factor = severity / 100; // 0 to 1
    
    // Slide frequency down from healthy (55Hz/59Hz) to stressed (40Hz/43Hz)
    const baseFreq = 55 - 15 * factor;
    ambientOsc1.frequency.setTargetAtTime(baseFreq, t, 0.5);
    ambientOsc2.frequency.setTargetAtTime(baseFreq + 4 - 2 * factor, t, 0.5);
    
    // Increase neural noise as severity increases
    const targetNoise = 0.005 + 0.04 * factor;
    noiseGain.gain.setTargetAtTime(targetNoise, t, 0.5);
    
    // Modulate filter cutoff (open filter slightly for more high frequencies when damaged/irritated)
    const cutoff = 120 + 180 * factor;
    humFilter.frequency.setTargetAtTime(cutoff, t, 0.5);
  }

  /**
   * Toggles mute state
   */
  function toggleMute() {
    isMuted = !isMuted;
    
    if (!isInitialized) {
      init();
    }
    
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const t = audioCtx.currentTime;
    if (isMuted) {
      masterGain.gain.setTargetAtTime(0, t, 0.1);
    } else {
      masterGain.gain.setTargetAtTime(0.5, t, 0.3);
    }
    
    return isMuted;
  }

  /**
   * Plays a UI feedback sound
   */
  function playClick() {
    if (!isInitialized || isMuted) return;
    
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    
    gainNode.gain.setValueAtTime(0.08, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    
    osc.connect(gainNode).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Plays an alarm warning sweep
   */
  function playWarning() {
    if (!isInitialized || isMuted) return;
    
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.3);
    
    // Apply bandpass filter to sweeten the alarm sound
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    
    gainNode.gain.setValueAtTime(0.05, t);
    gainNode.gain.linearRampToValueAtTime(0.001, t + 0.3);
    
    osc.connect(filter).connect(gainNode).connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  /**
   * Plays a soft wave-like repair sweeps when entering recovery phase
   */
  function playRepair() {
    if (!isInitialized || isMuted) return;
    
    const t = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc1.type = 'triangle';
    osc2.type = 'triangle';
    
    osc1.frequency.setValueAtTime(220, t);
    osc1.frequency.exponentialRampToValueAtTime(440, t + 0.6);
    
    osc2.frequency.setValueAtTime(277.18, t); // C# major triad element
    osc2.frequency.exponentialRampToValueAtTime(554.37, t + 0.6);
    
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(0.12, t + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(masterGain);
    
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.62);
    osc2.stop(t + 0.62);
  }

  // Exposed API
  return {
    init,
    toggleMute,
    updateState,
    playClick,
    playWarning,
    playRepair,
    getMuted: () => isMuted,
    getInitialized: () => isInitialized
  };
})();
