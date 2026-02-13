/**
 * Record microphone audio as 16kHz mono WAV (base64) for Wispr Flow.
 * Uses Web Audio API; no external dependencies.
 */
const SAMPLE_RATE = 16000;

function floatTo16BitPCM(float32Array: Float32Array): Int16Array {
  const int16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function writeWavHeader(dataLength: number, numChannels: number, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = dataLength * bytesPerSample;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  write(36, "data");
  view.setUint32(40, dataSize, true);
  return buffer;
}

export interface VoiceRecorderResult {
  base64: string;
  durationMs: number;
}

function resampleTo16k(float32: Float32Array, sourceSampleRate: number): Float32Array {
  if (sourceSampleRate === SAMPLE_RATE) return float32;
  const ratio = sourceSampleRate / SAMPLE_RATE;
  const outLength = Math.floor(float32.length / ratio);
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const srcIndex = i * ratio;
    const lo = Math.floor(srcIndex);
    const hi = Math.min(lo + 1, float32.length - 1);
    const frac = srcIndex - lo;
    out[i] = float32[lo] * (1 - frac) + float32[hi] * frac;
  }
  return out;
}

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private startTime = 0;
  private sourceSampleRate = SAMPLE_RATE;

  async start(): Promise<void> {
    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.context = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.sourceSampleRate = this.context.sampleRate;
    this.source = this.context.createMediaStreamSource(this.stream);
    const bufferSize = 4096;
    this.processor = this.context.createScriptProcessor(bufferSize, 1, 1);
    this.source.connect(this.processor);
    this.processor.connect(this.context.destination);
    this.processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);
      this.chunks.push(new Float32Array(input));
    };
    this.startTime = Date.now();
  }

  stop(): VoiceRecorderResult {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    const durationMs = Date.now() - this.startTime;
    const totalLength = this.chunks.reduce((acc, c) => acc + c.length, 0);
    const all = new Float32Array(totalLength);
    let offset = 0;
    for (const c of this.chunks) {
      all.set(c, offset);
      offset += c.length;
    }
    const at16k = resampleTo16k(all, this.sourceSampleRate);
    const pcm = floatTo16BitPCM(at16k);
    const header = writeWavHeader(pcm.length, 1, SAMPLE_RATE);
    const wav = new Uint8Array(header.byteLength + pcm.byteLength);
    wav.set(new Uint8Array(header), 0);
    wav.set(new Uint8Array(pcm.buffer), header.byteLength);
    const binary = Array.from(wav)
      .map((b) => String.fromCharCode(b))
      .join("");
    const base64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(wav).toString("base64");
    return { base64, durationMs };
  }
}
