// Web Audio API Sound Synthesizer with Custom Audio File & Background Music support

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.muted = false;
    
    // Configurable paths for sound scenarios
    this.audioPaths = {
      click: '/audio/click.mp3',
      tooHigh: '/audio/too_high.mp3',
      tooLow: '/audio/too_low.mp3',
      success: '/audio/success.mp3',
      bgMusic: '/audio/bg_music.mp3'
    };
    
    this.audioCache = {};
    this.bgMusicAudio = null;
    this.bgMusicInterval = null;
    this.bgMusicActive = false; // Tracks if background music should be playing
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    
    // Manage background music when mute state changes
    if (this.bgMusicActive) {
      if (this.muted) {
        this.pauseBgMusic();
      } else {
        this.resumeBgMusic();
      }
    }
    
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  /**
   * Starts background music.
   * Tries to play from file. If it fails (e.g., silent dummy or empty), falls back to synthesized ambient loop.
   */
  startBgMusic() {
    this.bgMusicActive = true;
    if (this.muted) return;
    this.init();

    const path = this.audioPaths.bgMusic;
    if (!this.bgMusicAudio) {
      this.bgMusicAudio = new Audio(path);
      this.bgMusicAudio.loop = true;
      this.bgMusicAudio.volume = 0.3; // moderate background volume
    }

    this.bgMusicAudio.currentTime = 0;
    this.bgMusicAudio.play()
      .then(() => {
        console.log(`Audio system: Playing background music from ${path}`);
      })
      .catch((err) => {
        console.warn(`Audio system: Background music file could not play. Falling back to ambient synthesizer.`, err.message);
        this.startSynthBgMusic();
      });
  }

  /**
   * Synthesizes a soft retro/ambient background music progression (C - G - Am - F)
   */
  startSynthBgMusic() {
    if (this.bgMusicInterval) return;
    this.init();

    const notes = [130.81, 196.00, 220.00, 174.61]; // C3, G3, A3, F3
    let idx = 0;

    const playStep = () => {
      if (this.muted || !this.bgMusicActive) return;

      const now = this.ctx.currentTime;
      const oscRoot = this.ctx.createOscillator();
      const oscFifth = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      oscRoot.connect(gainNode);
      oscFifth.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      oscRoot.type = 'sine';
      oscRoot.frequency.setValueAtTime(notes[idx], now);

      oscFifth.type = 'sine';
      // play a clean fifth chord above root
      oscFifth.frequency.setValueAtTime(notes[idx] * 1.5, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.015, now + 0.5); // very quiet ambient sound
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      oscRoot.start(now);
      oscRoot.stop(now + 4);
      oscFifth.start(now);
      oscFifth.stop(now + 4);

      idx = (idx + 1) % notes.length;
    };

    // Play first step immediately and setup interval
    playStep();
    this.bgMusicInterval = setInterval(playStep, 4000);
  }

  pauseBgMusic() {
    if (this.bgMusicAudio) {
      this.bgMusicAudio.pause();
    }
  }

  resumeBgMusic() {
    if (this.bgMusicAudio) {
      this.bgMusicAudio.play().catch((err) => {
        // If file resume fails, ensure synth is running
        this.startSynthBgMusic();
      });
    } else {
      this.startSynthBgMusic();
    }
  }

  stopBgMusic() {
    this.bgMusicActive = false;
    this.pauseBgMusic();
    
    if (this.bgMusicInterval) {
      clearInterval(this.bgMusicInterval);
      this.bgMusicInterval = null;
    }
  }

  stopAllScenarios() {
    for (const key in this.audioCache) {
      const audioEl = this.audioCache[key];
      audioEl.pause();
      audioEl.currentTime = 0;
    }
  }

  playScenario(key, synthCallback) {
    if (this.muted) return;
    this.init();

    const path = this.audioPaths[key];
    let audioEl = this.audioCache[key];

    if (!audioEl) {
      audioEl = new Audio(path);
      this.audioCache[key] = audioEl;
    }

    audioEl.currentTime = 0;
    audioEl.play()
      .then(() => {
        console.log(`Audio system: Playing '${key}' from ${path}`);
      })
      .catch((err) => {
        console.warn(`Audio system: File ${path} could not play. Falling back to synthesizer.`, err.message);
        if (synthCallback) {
          synthCallback();
        }
      });
  }

  playClick() {
    this.playScenario('click', () => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.1);
    });
  }

  playTooHigh() {
    this.playScenario('tooHigh', () => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.setValueAtTime(660, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.25);
    });
  }

  playTooLow() {
    this.playScenario('tooLow', () => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, this.ctx.currentTime);
      osc.frequency.setValueAtTime(220, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.25);
    });
  }

  playSuccess() {
    this.playScenario('success', () => {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
      
      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0, now + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.1, now + index * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.3);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.35);
      });
    });
  }
}

export const audio = new SoundEffects();
