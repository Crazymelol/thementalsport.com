// ElevenLabs text-to-speech, used by render-queue.ts to generate narration
// for each short in Giannis's cloned voice.
//
// Auth: ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID (the voice_id of the cloned
// voice in ElevenLabs' Voice Lab). If either is unset, `voiceoverEnabled` is
// false and render-queue.ts falls back to the original silent, text-timed
// layout.
//
// Generated clips are cached under remotion/public/audio/<itemId>/ so they're
// produced once (by whichever poster workflow renders the item first) and
// reused — including by other platforms' on-demand renders — once committed.

import fs from 'fs';
import path from 'path';
import {parseFile} from 'music-metadata';
import type {AudioSegment} from './types';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

export const voiceoverEnabled = Boolean(ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID);

async function synthesize(text: string, outPath: string): Promise<void> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    throw new Error('ElevenLabs credentials not configured');
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {stability: 0.5, similarity_boost: 0.75},
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${await res.text()}`);
  }

  fs.writeFileSync(outPath, Buffer.from(await res.arrayBuffer()));
}

// Returns a cached narration clip for one segment of a short (generating it
// via ElevenLabs on first use), as a staticFile()-relative path plus its
// duration in frames.
export async function getOrCreateSegment(
  itemId: string,
  name: string,
  text: string,
  publicDir: string,
  fps: number,
): Promise<AudioSegment> {
  const relPath = path.posix.join('audio', itemId, `${name}.mp3`);
  const filePath = path.join(publicDir, 'audio', itemId, `${name}.mp3`);
  fs.mkdirSync(path.dirname(filePath), {recursive: true});

  if (!fs.existsSync(filePath)) {
    console.log(`  Synthesizing voiceover: ${itemId}/${name}.mp3`);
    await synthesize(text, filePath);
  }

  const {format} = await parseFile(filePath);
  if (!format.duration) {
    throw new Error(`Could not determine duration of ${filePath}`);
  }

  return {src: relPath, durationInFrames: Math.ceil(format.duration * fps)};
}
