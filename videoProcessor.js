const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const execAsync = promisify(exec);

/**
 * Downloads a video from a URL to a local temp file.
 */
async function downloadVideo(videoUrl, outPath) {
  const writer = fs.createWriteStream(outPath);
  const response = await axios.get(videoUrl, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

/**
 * Extracts N evenly-spaced frames from a video using ffmpeg.
 * Requires ffmpeg installed on the host (apt install ffmpeg / included in most PaaS buildpacks).
 * Returns an array of absolute file paths to the extracted JPEG frames.
 */
async function extractFrames(videoPath, outDir, frameCount = 5) {
  fs.mkdirSync(outDir, { recursive: true });

  // Get video duration first
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
  );
  const duration = parseFloat(stdout.trim()) || 5;

  const framePaths = [];
  for (let i = 0; i < frameCount; i++) {
    const timestamp = ((i + 1) * duration) / (frameCount + 1);
    const outFile = path.join(outDir, `frame_${i}.jpg`);
    await execAsync(
      `ffmpeg -y -ss ${timestamp.toFixed(2)} -i "${videoPath}" -frames:v 1 -q:v 2 "${outFile}"`
    );
    if (fs.existsSync(outFile)) framePaths.push(outFile);
  }
  return framePaths;
}

module.exports = { downloadVideo, extractFrames };
