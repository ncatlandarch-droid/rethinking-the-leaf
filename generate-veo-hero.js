/**
 * Generate Veo hero video — slow walk through Virginia lavender fields
 */
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const API_KEY = 'AIzaSyArHzKOWk6878FD7WLAG114TiAyFVkfq5I';
const OUTPUT_DIR = 'c:\\Users\\Chris\\Desktop\\WEBSITES\\ReThinking the Leaf Farm Website\\images';
const REF_IMAGE_PATH = path.join(OUTPUT_DIR, 'hero-lavender.png');

async function generateVideo() {
  console.log('🎬 Starting Veo 3.1 video generation...');
  console.log('   Location: Lawrenceville, Virginia');
  console.log('   Style: Slow cinematic first-person walk');
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Ultra cinematic first-person POV video of very slowly walking through rows of blooming purple lavender at golden hour. The camera glides forward at a peaceful, meditative pace — much slower than normal walking speed. 

The background shows flat Virginia Piedmont terrain with a dense tree line of mature oaks, loblolly pines, and sweetgum trees. No mountains — this is rural Lawrenceville, Virginia. Flat farmland and forest.

Dynamic cinematic lighting: warm golden sunlight filters through the tree canopy creating dramatic god rays and volumetric light shafts. Lens flare dances across the frame as the camera slowly moves. Dappled light plays across the lavender blooms. The light shifts and breathes naturally as the camera passes through shadows and sunlit patches.

Shallow depth of field with beautiful bokeh. Lavender stalks gently sway in a soft breeze as the camera passes. Fireflies or pollen particles catch the light. Rich warm color grading. No people visible anywhere. Empty peaceful estate. Dreamy, ethereal, premium atmosphere. 8K cinematic quality.`;

  const imageData = fs.readFileSync(REF_IMAGE_PATH);
  const base64Image = imageData.toString('base64');

  console.log('📤 Submitting to Veo 3.1...');
  
  const operation = await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt: prompt,
    image: {
      imageBytes: base64Image,
      mimeType: 'image/png'
    },
    config: {
      aspectRatio: '16:9',
      numberOfVideos: 1,
    }
  });
  
  console.log('⏳ Generating video (typically 1-3 minutes)...');
  
  let op = operation;
  let count = 0;
  while (!op.done) {
    await new Promise(r => setTimeout(r, 10000));
    count++;
    op = await ai.operations.get({ operation: op });
    console.log(`   Rendering... ${count * 10}s`);
  }
  
  console.log('✅ Generation complete!');
  
  if (op.response?.generatedVideos?.length > 0) {
    const video = op.response.generatedVideos[0];
    const videoUri = video.video?.uri;
    
    if (videoUri) {
      const separator = videoUri.includes('?') ? '&' : '?';
      const authUri = `${videoUri}${separator}key=${API_KEY}`;
      
      console.log(`📥 Downloading video...`);
      const response = await fetch(authUri);
      const buf = Buffer.from(await response.arrayBuffer());
      
      if (buf.length > 10000) {
        const outPath = path.join(OUTPUT_DIR, 'hero-video.mp4');
        fs.writeFileSync(outPath, buf);
        console.log(`🎥 Saved: ${outPath} (${(buf.length/1024/1024).toFixed(2)} MB)`);
      } else {
        // Retry without key
        const res2 = await fetch(videoUri);
        const buf2 = Buffer.from(await res2.arrayBuffer());
        const outPath = path.join(OUTPUT_DIR, 'hero-video.mp4');
        fs.writeFileSync(outPath, buf2);
        console.log(`🎥 Saved: ${outPath} (${(buf2.length/1024/1024).toFixed(2)} MB)`);
      }
    }
  } else {
    console.log('⚠️ No video in response');
  }
}

generateVideo().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
