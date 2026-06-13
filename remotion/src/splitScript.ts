// Breaks a script paragraph into short caption-sized chunks for on-screen text.
export function splitIntoCaptions(script: string, maxWords = 9): string[] {
  const sentences = script
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const chunks: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.split(' ');
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(' '));
    }
  }
  return chunks;
}
