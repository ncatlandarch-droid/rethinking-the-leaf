/**
 * RTTL Animated Concept Video — Final Stitcher
 * Combines 18 video clips + 6 narration segments into one MP4
 * 
 * Architecture: Each segment has 3 video clips (a,b,c) and 1 narration WAV.
 * We first concatenate clips per segment, then overlay narration, then join all 6.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FFMPEG = 'C:\\Users\\Chris\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1-full_build\\bin\\ffmpeg.exe';
const BASE = 'C:\\Users\\Chris\\Desktop\\WEBSITES\\ReThinking the Leaf Farm Website\\assets\\video\\animated';
const OUTPUT = 'C:\\Users\\Chris\\Downloads\\RTTL-Animated-Concept-Video.mp4';

const segments = ['01', '02', '03', '04', '05', '06'];

function run(cmd) {
  console.log(`> ${cmd.slice(0, 120)}...`);
  execSync(cmd, { stdio: 'pipe', timeout: 120000 });
}

(async () => {
  console.log('\n🎬  RTTL Animated Concept Video — Final Stitch');
  console.log('━'.repeat(55));

  const segmentFiles = [];

  for (const seg of segments) {
    console.log(`\n📹  Processing segment ${seg}...`);
    
    // Step 1: Create a concat list for the 3 clips
    const concatList = path.join(BASE, `concat-${seg}.txt`);
    const clipPaths = ['a', 'b', 'c'].map(s => `file '${path.join(BASE, `${seg}${s}.mp4`)}'`);
    fs.writeFileSync(concatList, clipPaths.join('\n'));

    // Step 2: Concatenate 3 clips into one segment video
    const segVideo = path.join(BASE, `segment-${seg}-video.mp4`);
    run(`"${FFMPEG}" -y -f concat -safe 0 -i "${concatList}" -c:v libx264 -preset fast -crf 23 -r 24 -pix_fmt yuv420p -an "${segVideo}"`);
    console.log(`  ✅  Concatenated 3 clips → segment-${seg}-video.mp4`);

    // Step 3: Overlay narration onto the segment video (loop video if narration is longer, cut if shorter)
    const narration = path.join(BASE, `narration-${seg}-fixed.wav`);
    const segFinal = path.join(BASE, `segment-${seg}-final.mp4`);
    
    // Use -shortest to match to the shorter of video/audio
    run(`"${FFMPEG}" -y -stream_loop -1 -i "${segVideo}" -i "${narration}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -shortest -pix_fmt yuv420p "${segFinal}"`);
    console.log(`  ✅  Narration overlaid → segment-${seg}-final.mp4`);

    segmentFiles.push(segFinal);
  }

  // Step 4: Concatenate all 6 final segments
  console.log('\n🔗  Joining all 6 segments...');
  const finalConcat = path.join(BASE, 'concat-final.txt');
  fs.writeFileSync(finalConcat, segmentFiles.map(f => `file '${f}'`).join('\n'));
  
  run(`"${FFMPEG}" -y -f concat -safe 0 -i "${finalConcat}" -c:v libx264 -preset medium -crf 22 -c:a aac -b:a 192k -pix_fmt yuv420p "${OUTPUT}"`);

  const sizeMB = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(2);
  
  // Cleanup temp files
  console.log('\n🧹  Cleaning up temp files...');
  for (const seg of segments) {
    try { fs.unlinkSync(path.join(BASE, `concat-${seg}.txt`)); } catch {}
    try { fs.unlinkSync(path.join(BASE, `segment-${seg}-video.mp4`)); } catch {}
    try { fs.unlinkSync(path.join(BASE, `segment-${seg}-final.mp4`)); } catch {}
  }
  try { fs.unlinkSync(finalConcat); } catch {}

  console.log('\n' + '━'.repeat(55));
  console.log('🏁  FINAL VIDEO COMPLETE!');
  console.log(`📁  Saved: ${OUTPUT}`);
  console.log(`📦  Size:  ${sizeMB} MB`);
  console.log('━'.repeat(55) + '\n');
})();
