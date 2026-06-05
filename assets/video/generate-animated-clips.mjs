/**
 * RTTL Animated Concept Video — Batch Clip Generator
 * Generates 18 watercolor animation clips matched to narration
 * Run: node generate-animated-clips.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const GENERATOR = 'C:\\Users\\Chris\\.gemini\\config\\skills\\veo-video-generator\\scripts\\generate.mjs';
const OUTPUT_DIR = 'C:\\Users\\Chris\\Desktop\\WEBSITES\\ReThinking the Leaf Farm Website\\assets\\video\\animated';

// Consistent style suffix for ALL clips
const STYLE = 'Warm watercolor gouache animation style, hand-painted textures, soft earthy color palette of lavender purple, forest green, and golden amber. Gentle camera movement. No text, no logos, no watermarks.';

const clips = [
  // Segment 1: INTRO (18.3s)
  { id: '01a', prompt: `Animated aerial view slowly revealing a vast 66-acre pastoral farm estate with rolling green hills, scattered oak trees, and rows of purple lavender patches. Morning golden mist rises from the valleys. Birds fly across a pale amber sky. ${STYLE}` },
  { id: '01b', prompt: `Animated circular flow diagram coming to life organically — glowing arrows connecting lavender fields to a rustic processing barn, then to amber bottles of products, then to a community dining table, then to compost bins, then back to the fields. Each element pulses with warm light as the cycle flows. ${STYLE}` },
  { id: '01c', prompt: `Animated wide establishing shot of a complete agrotherapy estate at golden hour — scattered A-frame cabins with warm interior lights, a community center building, neat rows of lavender, a food forest with fruit trees, walking trails winding through meadows. Camera slowly pulls back to reveal the full 66-acre scale. ${STYLE}` },

  // Segment 2: LAVENDER & HEMP (19.6s)
  { id: '02a', prompt: `Animated close-up of lavender flower stalks swaying gently in a warm breeze. An elderly Black woman's weathered hand reaches tenderly to touch the purple blooms. Monarch butterflies and honeybees drift between the flowers. Soft dappled sunlight. ${STYLE}` },
  { id: '02b', prompt: `Animated interior scene of a warm rustic workshop with large windows. Hands carefully distilling lavender essential oils into amber glass bottles. Hemp leaves being pressed into cream jars on a wooden workbench. Soft golden light streams through the windows. Shelves of natural products in background. ${STYLE}` },
  { id: '02c', prompt: `Animated elderly Black woman sitting peacefully in a wooden rocking chair on a covered porch. She applies cream from a jar to her hands with a look of relief and contentment. Behind her, endless rows of lavender stretch to the horizon under a warm sunset sky. ${STYLE}` },

  // Segment 3: INTERGENERATIONAL (17.3s)
  { id: '03a', prompt: `Animated outdoor farm scene. A young Black teenage boy carries a full woven harvest basket of lavender while an elderly Black man in overalls demonstrates proper stem-cutting technique with shears. Both are smiling warmly. Green fields and blue sky behind them. ${STYLE}` },
  { id: '03b', prompt: `Animated warm kitchen interior. An elderly Black grandmother teaches a teenage Black girl how to season fresh vegetables at a large rustic wooden table. Steam rises from pots, colorful fresh produce is spread across the table. Warm ambient light, copper pots on walls. ${STYLE}` },
  { id: '03c', prompt: `Animated wide establishing shot showing the full intergenerational farm ecosystem. On the left, outdoor harvest scene with elders and youth working together. On the right through open doors, a warm kitchen with cooking activity. A stone path connects both spaces. ${STYLE}` },

  // Segment 4: HEALING (21.0s)
  { id: '04a', prompt: `Animated rustic cedar log sauna building with steam gently curling upward from ventilation slats. Surrounded by tall pine trees. An elderly Black couple wrapped in white towels sits peacefully on a wooden bench outside the entrance. Warm amber lantern light glows. ${STYLE}` },
  { id: '04b', prompt: `Animated lush garden abundance scene. Raised wooden garden beds overflowing with ripe tomatoes, leafy greens, squash, and herbs. A small glass greenhouse is visible with vertical hydroponic towers glowing green inside. Black hands gently picking cherry tomatoes. ${STYLE}` },
  { id: '04c', prompt: `Animated communal outdoor dining scene at dusk. A long rustic wooden table set under warm string lights hanging between trees. A diverse group of Black people of all ages — grandparents, parents, teenagers, children — pass ceramic bowls of food, laugh together, eat together. Golden warm evening glow. ${STYLE}` },

  // Segment 5: COMMUNITY (20.7s)
  { id: '05a', prompt: `Animated landscape view of a quiet rural Southern town with small houses along a country road, open agricultural fields, and distant tree lines. Camera slowly zooms toward a glowing agrotherapy estate campus that radiates warm golden light like a beacon for the surrounding community. ${STYLE}` },
  { id: '05b', prompt: `Animated scene of elderly Black neighbors arriving at a welcoming community center building. Some walk with wooden canes, some step out of a white passenger van. Young Black workers wearing green aprons greet them with warm embraces and wide smiles at the entrance. ${STYLE}` },
  { id: '05c', prompt: `Animated training montage scene. Three separate vignettes: a young Black woman learning to bundle lavender stems with twine, a young Black man learning vegetable prep at a kitchen counter, a young Black teen carefully planting seedlings in soil. Each is paired with an elder mentor guiding their hands. ${STYLE}` },

  // Segment 6: LEGACY (19.9s)
  { id: '06a', prompt: `Animated infographic style circular flow diagram. A red barn labeled Farm sends food arrows to a community center building. The center sends golden coin arrows back to farm equipment. A classroom sends worker arrows to both. All arrows flow in a beautiful endless cycle with glowing connections. ${STYLE}` },
  { id: '06b', prompt: `Animated multigenerational Black family standing together on a hilltop overlooking their vast farmland at sunset. Grandparents, parents in their 40s, teenagers, and young children. Wind gently moves their clothes and hair. Expressions of deep pride, purpose, and hope. ${STYLE}` },
  { id: '06c', prompt: `Animated final panoramic wide shot of the full agrotherapy estate at golden sunrise. Morning mist rises gently from lavender fields. The campus buildings glow warmly. Camera slowly pulls upward and back, revealing the vast 66-acre scale against the Virginia countryside horizon. A translucent leaf watermark fades into view in the sky. ${STYLE}` },
];

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateClip(clip) {
  const output = path.join(OUTPUT_DIR, `${clip.id}.mp4`);
  
  // Skip if already generated
  if (fs.existsSync(output) && fs.statSync(output).size > 100000) {
    console.log(`⏭️  Skipping ${clip.id} — already exists (${(fs.statSync(output).size / 1024 / 1024).toFixed(2)} MB)`);
    return;
  }

  console.log(`\n🎬  Generating clip ${clip.id}...`);
  try {
    execSync(`node "${GENERATOR}" --prompt "${clip.prompt.replace(/"/g, '\\"')}" --output "${output}" --duration 8 --aspect "16:9"`, {
      stdio: 'inherit',
      timeout: 600000 // 10 min timeout
    });
  } catch (e) {
    console.error(`❌  Failed to generate ${clip.id}: ${e.message}`);
  }
}

// Generate sequentially (Veo allows ~1 concurrent job per API key)
(async () => {
  console.log(`\n🎬  RTTL Animated Concept Video — Generating ${clips.length} clips`);
  console.log('━'.repeat(55));
  
  for (let i = 0; i < clips.length; i++) {
    console.log(`\n📊  Progress: ${i}/${clips.length} clips`);
    await generateClip(clips[i]);
  }
  
  console.log('\n' + '━'.repeat(55));
  console.log(`🏁  ALL DONE! ${clips.length} clips generated.`);
  console.log(`📁  Location: ${OUTPUT_DIR}`);
  console.log('━'.repeat(55));
})();
