# Voice reference

`giannis.wav` is a short, clean recording of Giannis's voice (mono, 24 kHz),
used as the reference clip for OpenVoice V2 voice cloning. The voiceover
generator extracts a speaker embedding ("tone color") from this file and
applies it to the synthesized narration so the shorts are narrated in
Giannis's own voice.

Extracted from a 24.8 s phone video (audio track only, high-pass filtered at
80 Hz to remove low rumble). Replace this file with a longer/cleaner take to
improve cloning quality — no code changes needed, the generator reads whatever
`giannis.wav` contains.
