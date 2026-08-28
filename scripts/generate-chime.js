import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Synthesizes the 11:11 peaceful crystal harmonic chime into a PCM 16-bit 44.1kHz WAV buffer
 * Solfeggio / Harmonic crystal chime: 528Hz (Love/Miracle tone), 660Hz, 792Hz, 1056Hz, 1320Hz
 */
function generateChimeWav() {
  const sampleRate = 44100;
  const durationSeconds = 3.5;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const numChannels = 1; // mono
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = numSamples * numChannels * bytesPerSample;

  // 1. Synthesize audio samples
  const samples = new Float32Array(numSamples);
  const harmonics = [
    { freq: 528, delay: 0.00, weight: 0.35, decay: 1.1, type: 'sine' },
    { freq: 660, delay: 0.08, weight: 0.28, decay: 1.0, type: 'triangle' },
    { freq: 792, delay: 0.16, weight: 0.24, decay: 0.9, type: 'triangle' },
    { freq: 1056, delay: 0.24, weight: 0.18, decay: 0.8, type: 'sine' },
    { freq: 1320, delay: 0.32, weight: 0.14, decay: 0.7, type: 'sine' },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const h of harmonics) {
      if (t < h.delay) continue;
      const tRel = t - h.delay;

      // Soft attack (50ms)
      const attack = Math.min(1.0, tRel / 0.05);
      // Exponential peaceful decay
      const decay = Math.exp(-tRel / h.decay);
      const envelope = attack * decay;

      let wave = 0;
      const phase = 2 * Math.PI * h.freq * tRel;
      if (h.type === 'sine') {
        wave = Math.sin(phase);
      } else {
        // Softened triangle wave
        wave = Math.asin(Math.sin(phase)) * (2 / Math.PI);
      }

      // Add a touch of shimmer (octave overtone)
      const shimmer = 0.15 * Math.sin(2 * Math.PI * (h.freq * 2) * tRel) * Math.exp(-tRel / (h.decay * 0.6));

      sample += (wave + shimmer) * envelope * h.weight;
    }

    samples[i] = sample;
  }

  // Normalize samples to prevent clipping and ensure comfortable listening volume
  let maxAmp = 0;
  for (let i = 0; i < numSamples; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAmp) maxAmp = abs;
  }

  const targetPeak = 0.85;
  const gain = maxAmp > 0 ? targetPeak / maxAmp : 1.0;

  // 2. Build 44-byte WAV RIFF Header + PCM data
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 'fmt ' chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20); // PCM audio format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // byte rate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // block align
  buffer.writeUInt16LE(bitsPerSample, 34);

  // 'data' chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write PCM 16-bit signed integers
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] * gain));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.floor(intSample), offset);
    offset += 2;
  }

  return buffer;
}

const wavBuffer = generateChimeWav();

// 1. Write to public/chime.wav
const publicPath = path.join(rootDir, 'public', 'chime.wav');
fs.writeFileSync(publicPath, wavBuffer);
console.log(`✨ Successfully generated public/chime.wav (${(wavBuffer.length / 1024).toFixed(1)} KB)`);

// 2. Write to android-widget-template/res/raw/chime.wav
const templateRawDir = path.join(rootDir, 'android-widget-template', 'res', 'raw');
fs.mkdirSync(templateRawDir, { recursive: true });
fs.writeFileSync(path.join(templateRawDir, 'chime.wav'), wavBuffer);
console.log(`✨ Successfully generated android-widget-template/res/raw/chime.wav`);

// 3. Write to android/app/src/main/res/raw/chime.wav if android directory exists
const androidRawDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'raw');
if (fs.existsSync(path.join(rootDir, 'android'))) {
  fs.mkdirSync(androidRawDir, { recursive: true });
  fs.writeFileSync(path.join(androidRawDir, 'chime.wav'), wavBuffer);
  console.log(`✨ Successfully copied to android/app/src/main/res/raw/chime.wav`);
}
