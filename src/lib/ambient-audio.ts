/**
 * Ambient Audio Synthesizer - Web Audio API Pure Sound Generator
 * Sinh âm thanh tiếng ồn trắng (White Noise), tiếng ồn nâu êm dịu (Brown Noise),
 * và sóng não tập trung Alpha (10Hz) / Gamma (40Hz) không cần file mp3 ngoài.
 */

export type AmbientSoundType = 'none' | 'brown-noise' | 'rain' | 'binaural-alpha' | 'binaural-gamma';

class AmbientSoundEngine {
  private audioCtx: AudioContext | null = null;
  private currentSource: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private currentType: AmbientSoundType = 'none';
  private volume: number = 0.25;

  private initContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Phát âm thanh theo loại
   */
  public play(type: AmbientSoundType, volume = this.volume): void {
    if (type === 'none') {
      this.stop();
      return;
    }

    if (typeof window === 'undefined') return;

    this.stop();
    this.currentType = type;
    this.volume = volume;

    const ctx = this.initContext();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
    this.gainNode.connect(ctx.destination);

    if (type === 'brown-noise' || type === 'rain') {
      this.startNoise(type);
    } else if (type === 'binaural-alpha') {
      this.startBinauralBeats(200, 10); // Sóng Alpha 10Hz (Thư giãn, tập trung)
    } else if (type === 'binaural-gamma') {
      this.startBinauralBeats(240, 40); // Sóng Gamma 40Hz (Siêu tập trung, ghi nhớ cao độ)
    }
  }

  /**
   * Tạo Brown Noise hoặc âm thanh tiếng mưa giả lập
   */
  private startNoise(style: 'brown-noise' | 'rain') {
    if (!this.audioCtx || !this.gainNode) return;
    const ctx = this.audioCtx;

    // Buffer 5 giây lặp lại
    const bufferSize = ctx.sampleRate * 5;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (style === 'brown-noise') {
        // Thuật toán Brown Noise lọc tích lũy giảm tần số cao
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Tăng âm lượng cơ bản cho noise
      } else {
        // Âm thanh giả lập tiếng mưa nhẹ: White noise kết hợp bộ lọc ngẫu nhiên
        output[i] = (lastOut + 0.05 * white) / 1.05;
        lastOut = output[i];
        output[i] *= 2.8;
      }
    }

    const whiteNoiseSource = ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    // Bộ lọc Low-pass Filter làm ấm và mềm âm thanh
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(style === 'brown-noise' ? 450 : 800, ctx.currentTime);

    whiteNoiseSource.connect(filter);
    filter.connect(this.gainNode);
    whiteNoiseSource.start(0);

    this.currentSource = whiteNoiseSource;
  }

  /**
   * Tạo sóng Binaural Beats (2 tần số khác nhau giữa tai trái và tai phải)
   */
  private startBinauralBeats(baseFreq: number, beatFreq: number) {
    if (!this.audioCtx || !this.gainNode) return;
    const ctx = this.audioCtx;

    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();

    oscLeft.type = 'sine';
    oscRight.type = 'sine';

    oscLeft.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    oscRight.frequency.setValueAtTime(baseFreq + beatFreq, ctx.currentTime);

    // Kênh stereo trái - phải
    const merger = ctx.createChannelMerger(2);

    oscLeft.connect(merger, 0, 0); // Kênh 0: Tai trái
    oscRight.connect(merger, 0, 1); // Kênh 1: Tai phải

    merger.connect(this.gainNode);

    oscLeft.start(0);
    oscRight.start(0);

    this.currentSource = {
      disconnect: () => {
        try {
          oscLeft.stop();
          oscRight.stop();
          oscLeft.disconnect();
          oscRight.disconnect();
          merger.disconnect();
        } catch (_) {}
      },
    } as any;
  }

  /**
   * Cập nhật âm lượng
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  /**
   * Dừng âm thanh
   */
  public stop(): void {
    if (this.currentSource) {
      try {
        if ('stop' in this.currentSource) {
          (this.currentSource as any).stop();
        }
        this.currentSource.disconnect();
      } catch (_) {}
      this.currentSource = null;
    }
    this.currentType = 'none';
  }
}

// Singleton instance
export const ambientAudio = new AmbientSoundEngine();
