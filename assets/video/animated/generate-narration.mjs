/**
 * RTTL Animated Concept Video — Narration Generator
 * Generates 6 narration WAVs using Gemini TTS (Zephyr voice)
 */
import https from 'https';
import fs from 'fs';

const API_KEY = process.env.GEMINI_API_KEY;
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const VOICE = 'Zephyr'; // Deep warm male voice

const segments = [
  { id: '01', text: `Imagine sixty-six acres of Virginia countryside... transformed into something that heals a community. This is ReThinking The Leaf — an agrotherapy estate where lavender fields, intergenerational programs, and a self-sustaining circular system come together on historically significant Black-owned land.` },
  { id: '02', text: `At the heart of it all... lavender. Rows upon rows of Lavandula angustifolia, grown right here in Brunswick County. From these fields come essential oils, body butters, and wellness products — handcrafted on-site. And alongside them, hemp — cultivated for health, for healing, and for building generational wealth.` },
  { id: '03', text: `But this isn't just a farm. It's a bridge between generations. Elders sharing decades of wisdom with young people hungry to learn. Grandmothers teaching recipes passed down through centuries. Teenagers discovering purpose with their hands in the soil. Here, knowledge flows both ways — and everyone grows.` },
  { id: '04', text: `Healing happens in many forms on this land. A cedar sauna where community elders find relief and restoration. Gardens overflowing with fresh vegetables — grown right here, served right here. And a long table where neighbors sit together, share a meal, and remember what community truly means.` },
  { id: '05', text: `In Brunswick County — one of the most underserved communities in Virginia — this campus becomes a beacon. A place where seniors are welcomed with dignity. Where young people are trained in real skills — agriculture, food production, land stewardship. Where the cycle of poverty is replaced by a cycle of purpose.` },
  { id: '06', text: `The farm feeds the facility. The facility funds the farm. The training programs staff both. And the community heals together. This is the vision of ReThinking The Leaf. And with your support... it's already taking root.` },
];

const OUTPUT_DIR = 'C:\\Users\\Chris\\Desktop\\WEBSITES\\ReThinking the Leaf Farm Website\\assets\\video\\animated';

async function generateWAV(text, outputPath) {
  const body = JSON.stringify({
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } }
      }
    }
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${TTS_MODEL}:generateContent?key=${API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const audioB64 = json.candidates[0].content.parts[0].inlineData.data;
          fs.writeFileSync(outputPath, Buffer.from(audioB64, 'base64'));
          resolve(outputPath);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('🎙️  Generating narration (Zephyr voice)...\n');
  for (const seg of segments) {
    const out = `${OUTPUT_DIR}\\narration-${seg.id}.wav`;
    console.log(`🎙️  Segment ${seg.id}...`);
    await generateWAV(seg.text, out);
    const sizeMB = (fs.statSync(out).size / 1024 / 1024).toFixed(2);
    console.log(`✅  Saved narration-${seg.id}.wav (${sizeMB} MB)`);
  }
  console.log('\n🏁  All narration segments generated!');
})();
