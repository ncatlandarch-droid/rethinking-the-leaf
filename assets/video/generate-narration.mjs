#!/usr/bin/env node
/**
 * RTTL Narration Generator — Gemini TTS
 * Generates WAV narration using Zephyr voice (deep male)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-preview-tts';
const VOICE = 'Zephyr'; // Deep male, authoritative
const OUTPUT_DIR = path.resolve('assets/video');

// Narration segments — timed to match video scenes
const segments = [
  {
    id: '01-intro',
    text: `Imagine sixty-six acres of purpose. A place where lavender fields stretch across rolling Virginia hills. Where the output of one element becomes the input of another. Nothing wasted. Everything regenerated. This is ReThinking The Leaf.`
  },
  {
    id: '02-lavender',
    text: `Lavender is not just a crop here. It is medicine. Clinical research shows lavender aromatherapy reduces agitation in dementia patients. It improves sleep in those over sixty-five. Combined with hemp-infused creams produced right here on the estate, residents find relief from chronic pain, naturally.`
  },
  {
    id: '03-intergenerational',
    text: `Young people and elders work side by side. Youth harvest and carry. Elders bundle, sort, and teach. In the kitchen, youth prepare and serve while elders share recipes and seasoning wisdom passed down through generations. This is how farming communities have always worked.`
  },
  {
    id: '04-healing',
    text: `Cedar saunas warm the body and heal the soul. Farm-to-table meals made from vegetables grown in the food forest, the raised beds, and the hydroponic lab. No one eats alone here. Everyone sits at the same table. This is not a facility where people go to wait. This is a place where people come to live.`
  },
  {
    id: '05-community',
    text: `Brunswick County is one of the most underserved communities in Virginia. Every grant dollar, every donation, every hour of volunteer work goes directly to serving the people who need it most. Medicaid-funded beds so no one is turned away. Community meals for neighborhood seniors. Youth trained and paid to work alongside residents.`
  },
  {
    id: '06-legacy',
    text: `The farm feeds the facility. The facility funds the farm. The training programs staff both. On historically significant Black-owned land, a new generation is learning to build generational wealth through agriculture, healthcare, and community. This is ReThinking The Leaf. And we are just getting started.`
  }
];

function pcmToWav(pcmBuffer, sampleRate = 24000) {
  const dataSize = pcmBuffer.length;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);      // PCM
  wav.writeUInt16LE(1, 22);      // Mono
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(wav, 44);
  return wav;
}

function generateTTS(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } }
        }
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const audioPart = json.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (!audioPart) { reject(new Error('No audio in response: ' + data.substring(0, 200))); return; }
          const pcm = Buffer.from(audioPart.inlineData.data, 'base64');
          const mime = audioPart.inlineData.mimeType || '';
          const rateMatch = mime.match(/rate=(\d+)/);
          const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000;
          resolve({ pcm, sampleRate });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  console.log('RTTL Narration Generator');
  console.log('Voice: Zephyr (deep male)');
  console.log('Segments:', segments.length);
  console.log('---');

  for (const seg of segments) {
    const outPath = path.join(OUTPUT_DIR, `narration-${seg.id}.wav`);
    console.log(`Generating: ${seg.id}...`);
    try {
      const { pcm, sampleRate } = await generateTTS(seg.text);
      const wav = pcmToWav(pcm, sampleRate);
      fs.writeFileSync(outPath, wav);
      const durSec = (pcm.length / 2 / sampleRate).toFixed(1);
      console.log(`  Saved: ${outPath} (${(wav.length/1024).toFixed(0)}KB, ~${durSec}s)`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\nAll narration segments generated!');
}

main();
