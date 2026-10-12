import { AmbientSoundType } from './pomodoro-types';

/**
 * Trình phát âm thanh nền tập trung hoàn toàn Offline sử dụng Web Audio API native.
 * Không cần tải bất kỳ tệp MP3 nào, không tốn băng thông internet, hoạt động 100% khi mất mạng.
 */
class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private currentType: AmbientSoundType = 'none';
  private currentVolume: number = 0.5;

  private initContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(console.warn);
    }
    return this.ctx;
  }

  /**
   * Tạo bộ nhớ đệm Pink Noise (âm thanh ấm, dễ chịu hơn White Noise)
   */
  private createPinkNoiseBuffer(ctx: AudioContext, seconds: number = 5): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    return buffer;
  }

  /**
   * Bắt đầu phát âm thanh nền
   */
  public play(type: AmbientSoundType, volume: number = 0.5): void {
    if (typeof window === 'undefined') return;
    this.stop();

    if (type === 'none') {
      this.currentType = 'none';
      return;
    }

    try {
      const ctx = this.initContext();
      this.currentType = type;
      this.currentVolume = volume;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
      this.gainNode = gain;

      if (type === 'rain') {
        // TIẾNG MƯA: Pink Noise qua Low-pass Filter 1000Hz
        const buffer = this.createPinkNoiseBuffer(ctx, 4);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, ctx.currentTime);
        this.filterNode = filter;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start();
        this.noiseNode = source;
      } else if (type === 'ocean') {
        // TIẾNG SÓNG BIỂN: Pink noise kết hợp dao động LFO chu kỳ 8 giây (vỗ bờ - rút ra)
        const buffer = this.createPinkNoiseBuffer(ctx, 6);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, ctx.currentTime);
        this.filterNode = filter;

        // LFO điều chế tần số lọc tạo nhịp sóng
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8.3 giây mỗi đợt sóng
        lfoGain.gain.setValueAtTime(350, ctx.currentTime);

        lfo.connect(filter.frequency);
        lfo.start();
        this.lfoNode = lfo;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start();
        this.noiseNode = source;
      } else if (type === 'whitenoise') {
        // TIẾNG ỒN TRẮNG TĨNH LẶNG (WHITE NOISE)
        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.15;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        filter.Q.setValueAtTime(1.2, ctx.currentTime);
        this.filterNode = filter;

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start();
        this.noiseNode = source;
      }
    } catch (e) {
      console.warn('Không thể khởi tạo Web Audio Ambient Sound:', e);
    }
  }

  /**
   * Thay đổi âm lượng
   */
  public setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.currentVolume * 0.4, this.ctx.currentTime);
    }
  }

  /**
   * Dừng âm thanh nền
   */
  public stop(): void {
    try {
      if (this.lfoNode) {
        this.lfoNode.stop();
        this.lfoNode.disconnect();
        this.lfoNode = null;
      }
      if (this.noiseNode && 'stop' in this.noiseNode) {
        (this.noiseNode as AudioScheduledSourceNode).stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.filterNode) {
        this.filterNode.disconnect();
        this.filterNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      this.currentType = 'none';
    } catch {
      // Bỏ qua lỗi ngắt kết nối
    }
  }

  /**
   * Phát tiếng chuông thiền thông báo hoàn thành phiên (Zen Chime)
   */
  public playCompletionChime(): void {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // Hợp âm kép thư giãn (528Hz & 792Hz)
      const frequencies = [528, 792];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25 / (idx + 1), now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.6);
      });
    } catch (e) {
      console.warn('Không thể phát chuông báo:', e);
    }
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public getCurrentVolume(): number {
    return this.currentVolume;
  }
}

export const ambientSound = new AmbientSoundEngine();
