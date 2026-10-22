/**
 * Dual Sound Engine:
 * 1. Plays real user MP3 audio assets (/audio/*.mp3)
 * 2. Background Music (BGM) player: Kelas_Gueh_Chill_Cheerful_BGM_60s.mp3 with toggle
 * 3. Fallback to Web Audio API synthesis if file is unavailable or network is offline
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private bgmAudio: HTMLAudioElement | null = null;
  private isBgmPlaying: boolean = false;

  constructor() {
    const saved = localStorage.getItem('kelasgue_sfx');
    this.soundEnabled = saved !== null ? saved === 'true' : true;

    const savedBgm = localStorage.getItem('kelasgue_bgm');
    const shouldPlayBgm = savedBgm === 'true';

    if (typeof window !== 'undefined') {
      try {
        this.bgmAudio = new Audio('/audio/Kelas_Gueh_Chill_Cheerful_BGM_60s.mp3');
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = 0.28; // Pleasant background volume
        if (shouldPlayBgm) {
          // Play upon first user interaction
          const playOnGesture = () => {
            if (this.soundEnabled && !this.isBgmPlaying) {
              this.startBgm();
            }
            window.removeEventListener('click', playOnGesture);
          };
          window.addEventListener('click', playOnGesture);
        }
      } catch {
        // Audio element not supported
      }
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('kelasgue_sfx', String(enabled));
    if (!enabled && this.isBgmPlaying) {
      this.pauseBgm();
    }
  }

  public toggle(): boolean {
    const next = !this.soundEnabled;
    this.setEnabled(next);
    if (next) {
      this.playClick();
    }
    return next;
  }

  // BGM controls
  public getIsBgmPlaying(): boolean {
    return this.isBgmPlaying;
  }

  public toggleBgm(): boolean {
    if (this.isBgmPlaying) {
      this.pauseBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  public startBgm(): void {
    if (!this.bgmAudio) return;
    this.bgmAudio.play().then(() => {
      this.isBgmPlaying = true;
      localStorage.setItem('kelasgue_bgm', 'true');
    }).catch(() => {
      this.isBgmPlaying = false;
    });
  }

  public pauseBgm(): void {
    if (!this.bgmAudio) return;
    this.bgmAudio.pause();
    this.isBgmPlaying = false;
    localStorage.setItem('kelasgue_bgm', 'false');
  }

  /**
   * Helper to play MP3 with automatic synthesizer fallback
   */
  private playAudioFile(path: string, fallback: () => void): void {
    if (!this.soundEnabled) return;
    try {
      const audio = new Audio(path);
      audio.volume = 0.5;
      audio.play().catch(() => {
        fallback();
      });
    } catch {
      fallback();
    }
  }

  /**
   * 01_button_tap.mp3 / Web Audio API triangle tap
   */
  public playClick(): void {
    this.playAudioFile('/audio/01_button_tap.mp3', () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } catch {}
    });
  }

  /**
   * 04_page_switch_whoosh.mp3 / Web Audio API noise rustle
   */
  public playPaperRustle(): void {
    this.playAudioFile('/audio/04_page_switch_whoosh.mp3', () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, ctx.currentTime);
        filter.Q.setValueAtTime(1.8, ctx.currentTime);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        whiteNoise.start();
        whiteNoise.stop(ctx.currentTime + 0.08);
      } catch {}
    });
  }

  /**
   * 02_success_chime.mp3 / Web Audio API dual tone coin pop
   */
  public playCoinChime(): void {
    this.playAudioFile('/audio/02_success_chime.mp3', () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(987, now);
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.18);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1318, now + 0.07);
        gain2.gain.setValueAtTime(0.22, now + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.35);
      } catch {}
    });
  }

  /**
   * 05_reminder_ping.mp3 / gentle sine toggle
   */
  public playToggle(): void {
    this.playAudioFile('/audio/05_reminder_ping.mp3', () => {
      const ctx = this.initCtx();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.035);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.035);
      } catch {}
    });
  }

  /**
   * 03_new_notification.mp3 / notification chime
   */
  public playNotification(): void {
    this.playAudioFile('/audio/03_new_notification.mp3', () => {
      this.playCoinChime();
    });
  }
}

export const sfx = new SoundEngine();
