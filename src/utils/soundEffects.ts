/**
 * Sound Engine with 35 UI Sound Effects Pack + Animated Intro SFX + BGM
 * Grounded in README_PETUNJUK.txt
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
        // Preferred new BGM file with fallback
        this.bgmAudio = new Audio('/audio/Kelas_Gueh_Chill_Cheerful_BGM_60s-1.mp3');
        this.bgmAudio.loop = true;
        this.bgmAudio.volume = 0.28;
        this.bgmAudio.onerror = () => {
          this.bgmAudio = new Audio('/audio/Kelas_Gueh_Chill_Cheerful_BGM_60s.mp3');
          this.bgmAudio.loop = true;
          this.bgmAudio.volume = 0.28;
        };

        if (shouldPlayBgm) {
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
   * Helper to play audio file with volume and Web Audio API synthesizer fallback
   */
  private playAudio(path: string, volume = 0.45, fallbackSynth?: () => void): void {
    if (!this.soundEnabled) return;
    try {
      const audio = new Audio(path);
      audio.volume = volume;
      audio.play().catch(() => {
        if (fallbackSynth) fallbackSynth();
      });
    } catch {
      if (fallbackSynth) fallbackSynth();
    }
  }

  /**
   * 01_ui_tap.mp3 - Klik tombol umum (singkat, bersih, ringan)
   */
  public playClick(): void {
    this.playAudio('/audio/01_ui_tap.mp3', 0.4, () => {
      this.playAudio('/audio/01_button_tap.mp3', 0.4);
    });
  }

  /**
   * 02_option_select.mp3 - Memilih opsi, tab, atau mode
   */
  public playOptionSelect(): void {
    this.playAudio('/audio/02_option_select.mp3', 0.4, () => {
      this.playToggle();
    });
  }

  /**
   * 03_card_open.mp3 - Membuka modal atau detail
   */
  public playCardOpen(): void {
    this.playAudio('/audio/03_card_open.mp3', 0.45);
  }

  /**
   * 04_card_close.mp3 - Menutup modal atau panel
   */
  public playCardClose(): void {
    this.playAudio('/audio/04_card_close.mp3', 0.4);
  }

  /**
   * 17_money_ching.mp3 - Uang masuk / pemasukan baru kas dicatat
   */
  public playMoneyIncome(): void {
    this.playAudio('/audio/17_money_ching.mp3', 0.5, () => {
      this.playAudio('/audio/02_success_chime.mp3', 0.5);
    });
  }

  /**
   * 18_expense_added.mp3 - Pengeluaran kas dicatat
   */
  public playExpenseAdded(): void {
    this.playAudio('/audio/18_expense_added.mp3', 0.45);
  }

  /**
   * 19_budget_goal.mp3 - Target kas semester tercapai
   */
  public playBudgetGoal(): void {
    this.playAudio('/audio/19_budget_goal.mp3', 0.5);
  }

  /**
   * 20_payment_confirmed.mp3 - Centang checklist konfirmasi bayar iuran
   */
  public playPaymentConfirmed(): void {
    this.playAudio('/audio/20_payment_confirmed.mp3', 0.45, () => {
      this.playAudio('/audio/02_success_chime.mp3', 0.4);
    });
  }

  /**
   * 21_file_upload.mp3 - Upload foto nota kuitansi
   */
  public playFileUpload(): void {
    this.playAudio('/audio/21_file_upload.mp3', 0.45);
  }

  /**
   * 22_file_download.mp3 - Cetak dokumen PDF / download rekap
   */
  public playFileDownload(): void {
    this.playAudio('/audio/22_file_download.mp3', 0.45);
  }

  /**
   * 23_search_found.mp3 - Pencarian mutasi atau anggota
   */
  public playSearchFound(): void {
    this.playAudio('/audio/23_search_found.mp3', 0.35);
  }

  /**
   * 24_filter_applied.mp3 - Terapkan filter
   */
  public playFilterApplied(): void {
    this.playAudio('/audio/24_filter_applied.mp3', 0.4);
  }

  /**
   * 28_warning.mp3 - Peringatan
   */
  public playWarning(): void {
    this.playAudio('/audio/28_warning.mp3', 0.45);
  }

  /**
   * 29_delete_confirm.mp3 - Menghapus transaksi kas
   */
  public playDeleteConfirm(): void {
    this.playAudio('/audio/29_delete_confirm.mp3', 0.45);
  }

  /**
   * 32_sync_complete.mp3 - Sinkronisasi realtime Supabase selesai
   */
  public playSyncComplete(): void {
    this.playAudio('/audio/32_sync_complete.mp3', 0.45);
  }

  /**
   * Kelas_Gueh_Animated_Intro_SFX.mp3 - Audio opening intro
   */
  public playIntro(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const audio = new Audio('/audio/Kelas_Gueh_Animated_Intro_SFX.mp3');
        audio.volume = 0.55;
        audio.play().then(() => {
          audio.onended = () => resolve();
        }).catch(() => resolve());
      } catch {
        resolve();
      }
    });
  }

  // Backward compatibility methods
  public playPaperRustle(): void {
    this.playOptionSelect();
  }

  public playCoinChime(): void {
    this.playMoneyIncome();
  }

  public playToggle(): void {
    this.playOptionSelect();
  }

  public playSuccess(): void {
    this.playMoneyIncome();
  }

  public playLevelUp(): void {
    this.playMoneyIncome();
  }

  public playNotification(): void {
    this.playSyncComplete();
  }
}

export const sfx = new SoundEngine();
