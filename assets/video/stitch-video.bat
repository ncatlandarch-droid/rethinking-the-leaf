@echo off
REM =====================================================
REM RTTL Concept Video — Stitch 6 Scenes + 6 Narrations
REM =====================================================
setlocal

set VID=assets\video
set OUT=C:\Users\Chris\Downloads\RTTL-Concept-Video.mp4

echo === Step 1: Concatenate all narration WAVs ===
(
  echo file 'narration-01-intro.wav'
  echo file 'narration-02-lavender.wav'
  echo file 'narration-03-intergenerational.wav'
  echo file 'narration-04-healing.wav'
  echo file 'narration-05-community.wav'
  echo file 'narration-06-legacy.wav'
) > %VID%\narration-list.txt

ffmpeg -y -f concat -safe 0 -i %VID%\narration-list.txt -c:a pcm_s16le %VID%\narration-full.wav
echo Narration combined.

echo === Step 2: Concatenate all video clips ===
(
  echo file '01-aerial-estate.mp4'
  echo file '02-lavender-elder.mp4'
  echo file '03-intergenerational.mp4'
  echo file '04-cedar-sauna.mp4'
  echo file '05-community-table.mp4'
  echo file '06-legacy-sunrise.mp4'
) > %VID%\video-list.txt

ffmpeg -y -f concat -safe 0 -i %VID%\video-list.txt -c copy %VID%\video-concat.mp4
echo Videos concatenated.

echo === Step 3: Loop video to match narration length ===
REM Get narration duration and loop video to fill it
for /f "tokens=*" %%a in ('ffprobe -v error -show_entries format^=duration -of csv^=p^=0 %VID%\narration-full.wav') do set DURATION=%%a
echo Narration duration: %DURATION%s

ffmpeg -y -stream_loop -1 -i %VID%\video-concat.mp4 -i %VID%\narration-full.wav -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k -t %DURATION% -shortest -movflags +faststart %OUT%

echo.
echo =====================================================
echo DONE! Final video saved to:
echo %OUT%
echo =====================================================
