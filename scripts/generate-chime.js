import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Builds a 44-byte WAV RIFF Header + PCM data
 */
function createWavBuffer(samples, sampleRate = 44100) {
  const numSamples = samples.length;
  const numChannels = 1; // mono
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = numSamples * numChannels * bytesPerSample;

  // Normalize samples to prevent clipping
  let maxAmp = 0;
  for (let i = 0; i < numSamples; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > maxAmp) maxAmp = abs;
  }
  const targetPeak = 0.88;
  const gain = maxAmp > 0 ? targetPeak / maxAmp : 1.0;

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

/**
 * Synthesizes the 11:11 peaceful crystal harmonic chime
 * Solfeggio / Harmonic crystal chime: 528Hz (Love/Miracle tone), 660Hz, 792Hz, 1056Hz, 1320Hz
 */
function generate1111ChimeWav() {
  const sampleRate = 44100;
  const durationSeconds = 3.5;
  const numSamples = Math.floor(sampleRate * durationSeconds);
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
      const attack = Math.min(1.0, tRel / 0.05);
      const decay = Math.exp(-tRel / h.decay);
      const envelope = attack * decay;

      let wave = 0;
      const phase = 2 * Math.PI * h.freq * tRel;
      if (h.type === 'sine') {
        wave = Math.sin(phase);
      } else {
        wave = Math.asin(Math.sin(phase)) * (2 / Math.PI);
      }

      const shimmer = 0.15 * Math.sin(2 * Math.PI * (h.freq * 2) * tRel) * Math.exp(-tRel / (h.decay * 0.6));
      sample += (wave + shimmer) * envelope * h.weight;
    }
    samples[i] = sample;
  }

  return createWavBuffer(samples, sampleRate);
}

/**
 * Synthesizes the dedicated 4:20 mellow chill tone
 * 432Hz deep resonant chord: 216Hz, 324Hz, 432Hz, 648Hz (Warm acoustic bamboo chime / zen bowl)
 */
function generate420ChimeWav() {
  const sampleRate = 44100;
  const durationSeconds = 3.8;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const samples = new Float32Array(numSamples);

  const notes = [
    { freq: 216, delay: 0.00, weight: 0.38, decay: 1.6, vibrato: 4.5, depth: 1.5 },
    { freq: 324, delay: 0.09, weight: 0.30, decay: 1.4, vibrato: 5.0, depth: 1.8 },
    { freq: 432, delay: 0.18, weight: 0.28, decay: 1.3, vibrato: 5.5, depth: 2.0 },
    { freq: 648, delay: 0.27, weight: 0.18, decay: 1.1, vibrato: 6.0, depth: 2.2 },
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const n of notes) {
      if (t < n.delay) continue;
      const tRel = t - n.delay;

      // Gentle warm attack (80ms)
      const attack = Math.min(1.0, tRel / 0.08);
      const decay = Math.exp(-tRel / n.decay);
      const envelope = attack * decay;

      // Subtle natural vibrato/chorus
      const vibPhase = 2 * Math.PI * n.vibrato * tRel;
      const currentFreq = n.freq + Math.sin(vibPhase) * n.depth;
      const phase = 2 * Math.PI * currentFreq * tRel;

      const primary = Math.sin(phase);
      const subHarmonic = 0.2 * Math.sin(phase * 0.5);
      const warmOvertone = 0.15 * Math.sin(phase * 2.0) * Math.exp(-tRel / (n.decay * 0.5));

      sample += (primary + subHarmonic + warmOvertone) * envelope * n.weight;
    }
    samples[i] = sample;
  }

  return createWavBuffer(samples, sampleRate);
}

// Generate 11:11 Chime
const chime1111Buffer = generate1111ChimeWav();
fs.writeFileSync(path.join(rootDir, 'public', 'chime.wav'), chime1111Buffer);

// Generate 4:20 Chime
const chime420Buffer = generate420ChimeWav();
fs.writeFileSync(path.join(rootDir, 'public', 'chime-420.wav'), chime420Buffer);

// Write to android-widget-template/res/raw/
const templateRawDir = path.join(rootDir, 'android-widget-template', 'res', 'raw');
fs.mkdirSync(templateRawDir, { recursive: true });
fs.writeFileSync(path.join(templateRawDir, 'chime.wav'), chime1111Buffer);
fs.writeFileSync(path.join(templateRawDir, 'chime_420.wav'), chime420Buffer);

console.log(`✨ Generated public/chime.wav (${(chime1111Buffer.length / 1024).toFixed(1)} KB)`);
console.log(`🌿 Generated public/chime-420.wav (${(chime420Buffer.length / 1024).toFixed(1)} KB)`);
console.log(`📱 Copied audio files to android-widget-template/res/raw/ (chime.wav, chime_420.wav)`);
