/**
 * LofiOfflineEngine - Trình tạo và phát nhạc Lofi thuần Web Audio API 100% Offline
 * Hoạt động hoàn toàn không cần internet, không cần tải file ngoài.
 * Mô phỏng chất âm Lofi Soul/Chill Beats của kênh ggg. (@triplegdot):
 * - Hợp âm Rhodes Jazz (7th, 9th, 11th) với hiệu ứng Tape Flutter & Low-pass ấm
 * - Tiếng nổ lách tách của đĩa than (Vinyl crackle) & băng từ (Tape hiss)
 * - Nhịp trống Lofi Hip-Hop thư giãn (Boom-Bap Kick, Rimshot Snare, Swung Hi-hat)
 */

export interface OfflineLofiTrackInfo {
  id: string;
  title: string;
  subTitle: string;
  bpm: number;
  mood: string;
  keyName: string;
}

export const OFFLINE_LOFI_TRACKS: OfflineLofiTrackInfo[] = [
  {
    id: 'off-1',
    title: 'honeycomb latte.',
    subTitle: 'Lofi Soul 🍯 • Hợp âm Rhodes & Tiếng đĩa than ấm',
    bpm: 70,
    mood: 'Soulful & Cozy',
    keyName: 'Eb Major',
  },
  {
    id: 'off-2',
    title: 'earth matcha.',
    subTitle: 'Chill Beats 🍵 • Giai điệu mượt mà, thư giãn sâu',
    bpm: 68,
    mood: 'Relaxing & Mellow',
    keyName: 'F Major',
  },
  {
    id: 'off-3',
    title: 'matcha affogato.',
    subTitle: 'Sweet Lofi 🍦 • Hợp âm Jazz cà phê ấm cúng',
    bpm: 72,
    mood: 'Sweet & Warm',
    keyName: 'C Minor',
  },
  {
    id: 'off-4',
    title: 'sakura matcha.',
    subTitle: 'Peaceful Zen 🌸 • Giai điệu nhẹ nhàng thanh tịnh',
    bpm: 65,
    mood: 'Peaceful & Gentle',
    keyName: 'Db Major',
  },
  {
    id: 'off-5',
    title: 'ocean soda.',
    subTitle: 'Deep Focus 🌊 • Âm sắc trôi dạt êm đềm cho sự tập trung',
    bpm: 60,
    mood: 'Deep Concentration',
    keyName: 'C Major',
  },
];

// Định nghĩa các hợp âm mẫu theo tần số (Hz)
const CHORD_PROGRESSIONS: Record<string, number[][]> = {
  // Track 1: Ebmaj9 (Eb3, G3, Bb3, D4, F4), Cm9 (C3, Eb3, G3, Bb3, D4), Fm9 (F3, Ab3, C4, Eb4, G4), Bb13 (Bb2, Ab3, C4, D4, G4)
  'off-1': [
    [155.56, 196.0, 233.08, 293.66, 349.23],
    [130.81, 155.56, 196.0, 233.08, 293.66],
    [174.61, 207.65, 261.63, 311.13, 392.0],
    [116.54, 207.65, 261.63, 293.66, 392.0],
  ],
  // Track 2: Fmaj7 (F3, A3, C4, E4), Em7 (E3, G3, B3, D4), Dm7 (D3, F3, A3, C4), Cmaj7 (C3, E3, G3, B3)
  'off-2': [
    [174.61, 220.0, 261.63, 329.63],
    [164.81, 196.0, 246.94, 293.66],
    [146.83, 174.61, 220.0, 261.63],
    [130.81, 164.81, 196.0, 246.94],
  ],
  // Track 3: Abmaj7 (Ab3, C4, Eb4, G4), G7#9 (G3, B3, F4, Bb4), Cm9 (C3, Eb3, G3, D4), Eb7 (Eb3, G3, Bb3, Db4)
  'off-3': [
    [207.65, 261.63, 311.13, 392.0],
    [196.0, 246.94, 349.23, 466.16],
    [130.81, 155.56, 196.0, 293.66],
    [155.56, 196.0, 233.08, 277.18],
  ],
  // Track 4: Dbmaj7 (Db3, F3, Ab3, C4), Bbm7 (Bb2, Db3, F3, Ab3), Ebm9 (Eb3, Gb3, Bb3, F4), Ab7sus (Ab2, Db3, Eb3, Gb3)
  'off-4': [
    [138.59, 174.61, 207.65, 261.63],
    [116.54, 138.59, 174.61, 207.65],
    [155.56, 185.0, 233.08, 349.23],
    [103.83, 138.59, 155.56, 185.0],
  ],
  // Track 5: Cmaj9 (C3, E3, G3, B3, D4), Am9 (A2, C3, E3, G3, B3), Fmaj9 (F2, A2, C3, E3, G3), G6 (G2, B2, D3, E3)
  'off-5': [
    [130.81, 164.81, 196.0, 246.94, 293.66],
    [110.0, 130.81, 164.81, 196.0, 246.94],
    [87.31, 110.0, 130.81, 164.81, 196.0],
    [98.0, 123.47, 146.83, 164.81],
  ],
};

export class LofiOfflineEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private vinylNode: AudioBufferSourceNode | null = null;
  private isPlaying: boolean = false;
  private currentTrackId: string = 'off-1';
  private volume: number = 0.6;
  private intervalId: number | null = null;
  private stepCount: number = 0;
  private currentChordIndex: number = 0;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(console.warn);
    }
    return this.ctx;
  }

  /**
   * Tạo tiếng đĩa than cổ điển (Vinyl Crackle & Tape Hiss)
   */
  private createVinylCrackleBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Nền tape hiss êm
      const hiss = (Math.random() * 2 - 1) * 0.02;

      // Tiếng lách tách ngẫu nhiên của rãnh đĩa than
      let pop = 0;
      if (Math.random() < 0.0004) {
        pop = (Math.random() * 2 - 1) * 0.45;
      }
      data[i] = hiss + pop;
    }

    return buffer;
  }

  /**
   * Đánh 1 hợp âm Rhodes Piano ấm áp
   */
  private playRhodesChord(ctx: AudioContext, frequencies: number[], durationSec: number): void {
    const master = this.masterGain;
    if (!master) return;
    const now = ctx.currentTime;

    frequencies.forEach((freq, i) => {
      // 2 Oscillators: Triangle (ấm) + Sine (trong trẻo)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc2.type = 'sine';

      // Nhẹ nhàng detune tạo độ dày chorus Lofi
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.002, now);

      // Lowpass Filter để tạo chất âm mờ ấm đặc trưng Lofi
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, now);
      filter.frequency.exponentialRampToValueAtTime(520, now + durationSec);

      const noteGain = ctx.createGain();
      // Âm lượng giảm nhẹ cho các nốt cao hơn để cân bằng
      const baseGain = 0.12 / Math.sqrt(i + 1);

      noteGain.gain.setValueAtTime(0.001, now);
      // Attack nhanh nhẹn
      noteGain.gain.linearRampToValueAtTime(baseGain, now + 0.04);
      // Decay và Release mượt mà
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(master);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSec + 0.1);
      osc2.stop(now + durationSec + 0.1);
    });
  }

  /**
   * Tiếng Bass Sub êm dịu theo nốt gốc
   */
  private playSubBass(ctx: AudioContext, rootFreq: number, durationSec: number): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    // Đưa xuống quãng 8 thấp hơn
    osc.frequency.setValueAtTime(rootFreq * 0.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + durationSec + 0.1);
  }

  /**
   * Tiếng Kick Boom-Bap Lofi
   */
  private playKick(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    // Pitch envelope rớt nhanh từ 140Hz xuống 45Hz
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Tiếng Snare / Rimshot lọc ấm
   */
  private playSnare(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    // Noise burst
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.15);
  }

  /**
   * Tiếng Hi-hat khẽ khàng nhẹ nhàng
   */
  private playHiHat(ctx: AudioContext, accent = false): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(accent ? 0.08 : 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 0.05);
  }

  /**
   * Bắt đầu chơi bản nhạc Lofi Offline
   */
  public playTrack(trackId: string = 'off-1'): void {
    if (typeof window === 'undefined') return;
    this.stop();

    const trackInfo = OFFLINE_LOFI_TRACKS.find((t) => t.id === trackId) || OFFLINE_LOFI_TRACKS[0];
    this.currentTrackId = trackInfo.id;
    this.isPlaying = true;

    try {
      const ctx = this.initContext();

      // Master Gain
      const master = ctx.createGain();
      master.gain.setValueAtTime(this.volume, ctx.currentTime);
      master.connect(ctx.destination);
      this.masterGain = master;

      // Khởi động lớp tiếng đĩa than ngầm
      const vinylBuffer = this.createVinylCrackleBuffer(ctx, 4);
      const vinylSource = ctx.createBufferSource();
      vinylSource.buffer = vinylBuffer;
      vinylSource.loop = true;

      const vinylFilter = ctx.createBiquadFilter();
      vinylFilter.type = 'bandpass';
      vinylFilter.frequency.setValueAtTime(2500, ctx.currentTime);
      vinylFilter.Q.setValueAtTime(0.8, ctx.currentTime);

      const vinylGain = ctx.createGain();
      vinylGain.gain.setValueAtTime(0.25, ctx.currentTime);

      vinylSource.connect(vinylFilter);
      vinylFilter.connect(vinylGain);
      vinylGain.connect(master);

      vinylSource.start();
      this.vinylNode = vinylSource;

      // Nhịp tempo: mỗi phách (beat) = 60 / bpm (giây)
      // Mỗi ô nhịp có 4 phách, mỗi phách có 2 bước 8th-note
      const stepIntervalMs = (60 / trackInfo.bpm / 2) * 1000;
      this.stepCount = 0;
      this.currentChordIndex = 0;

      const chords = CHORD_PROGRESSIONS[this.currentTrackId] || CHORD_PROGRESSIONS['off-1'];

      // Chơi hợp âm đầu tiên ngay lập tức
      this.playRhodesChord(ctx, chords[0], (60 / trackInfo.bpm) * 3.8);
      this.playSubBass(ctx, chords[0][0], (60 / trackInfo.bpm) * 3.8);

      // Loop vòng lặp Sequencer
      this.intervalId = window.setInterval(() => {
        if (!this.isPlaying) return;
        const stepInMeasure = this.stepCount % 8; // 8 bước mỗi ô nhịp 4/4 (8th-notes)

        // Hợp âm đổi mỗi ô nhịp (8 bước)
        if (stepInMeasure === 0) {
          this.currentChordIndex = (this.currentChordIndex + 1) % chords.length;
          const currentChord = chords[this.currentChordIndex];
          const chordDuration = (60 / trackInfo.bpm) * 3.8;
          this.playRhodesChord(ctx, currentChord, chordDuration);
          this.playSubBass(ctx, currentChord[0], chordDuration);
        }

        // Nhịp trống Lofi Hip-Hop:
        // Phách 1 (step 0): Kick
        if (stepInMeasure === 0) {
          this.playKick(ctx);
        }
        // Phách 2 (step 2): Hi-hat nhẹ
        if (stepInMeasure === 2) {
          this.playHiHat(ctx, false);
        }
        // Phách 3 (step 4): Snare + Kick nhấp phụ
        if (stepInMeasure === 4) {
          this.playSnare(ctx);
        }
        // Phách 3+ (step 5 hoặc 6): Kick rải nhẹ
        if (stepInMeasure === 6) {
          this.playKick(ctx);
        }
        // Hi-hat rải đều trên các phách chẵn/lẻ
        if (stepInMeasure % 2 === 1) {
          this.playHiHat(ctx, stepInMeasure === 5);
        }

        this.stepCount++;
      }, stepIntervalMs);
    } catch (e) {
      console.warn('Lỗi khi phát Lofi Offline:', e);
    }
  }

  /**
   * Dừng chơi nhạc
   */
  public stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.vinylNode) {
      try {
        this.vinylNode.stop();
        this.vinylNode.disconnect();
      } catch {
        // Bỏ qua nếu đã ngắt
      }
      this.vinylNode = null;
    }

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // Bỏ qua
      }
      this.masterGain = null;
    }

    this.isPlaying = false;
    this.stepCount = 0;
  }

  /**
   * Đổi âm lượng
   */
  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTrackId(): string {
    return this.currentTrackId;
  }

  public getVolume(): number {
    return this.volume;
  }
}

export const lofiOfflineEngine = new LofiOfflineEngine();
