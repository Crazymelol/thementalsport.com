"use client";

// Browser-native voice: speech-to-text via the Web Speech API
// (SpeechRecognition) and text-to-speech via speechSynthesis. No installs,
// no cloud audio service — it runs in the browser. Support varies by browser
// (Chrome/Edge are best); we degrade gracefully to text when unsupported.

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal shapes for the non-standard Web Speech API.
type SpeechRecognitionResultLike = { 0: { transcript: string }; isFinal: boolean };
type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
  resultIndex: number;
};
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
};

function getRecognitionCtor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoice() {
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [interim, setInterim] = useState("");

  const recogRef = useRef<RecognitionLike | null>(null);
  const onFinalRef = useRef<((text: string) => void) | null>(null);

  useEffect(() => {
    setSttSupported(getRecognitionCtor() !== null);
    setTtsSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback((onFinal: (text: string) => void) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    // Cancel any in-flight speech so Mina doesn't talk over the user.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
    const recog = new Ctor();
    recog.lang = "en-US";
    recog.continuous = false;
    recog.interimResults = true;
    onFinalRef.current = onFinal;

    recog.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interimText += res[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) {
        setInterim("");
        onFinalRef.current?.(finalText.trim());
        recog.stop();
      }
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);

    recogRef.current = recog;
    setInterim("");
    setListening(true);
    recog.start();
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const clean = text.trim();
      if (!clean) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);

      // Pick a British English voice to match her JARVIS-like character.
      // Voices load asynchronously, so this may be empty on the very first
      // call; it fills in on subsequent calls once the list is ready.
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => /en-GB/i.test(v.lang) && /(male|daniel|arthur|george|oliver)/i.test(v.name)) ??
        voices.find((v) => /en-GB/i.test(v.lang)) ??
        voices.find((v) => /\bUK\b|British/i.test(v.name));
      if (preferred) u.voice = preferred;
      u.lang = preferred?.lang ?? "en-GB";

      u.rate = 0.98; // measured, composed — not rushed
      u.pitch = 0.92; // a touch lower; calm and assured
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [],
  );

  const cancelSpeak = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }, []);

  // Stop everything on unmount.
  useEffect(() => () => {
    recogRef.current?.stop();
    cancelSpeak();
  }, [cancelSpeak]);

  return { sttSupported, ttsSupported, listening, speaking, interim, start, stop, speak, cancelSpeak };
}
