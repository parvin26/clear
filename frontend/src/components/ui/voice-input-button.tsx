"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "@/lib/voice-recorder";
import { transcribeAudio } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Window with optional Web Speech API (non-standard, not in DOM typings). */
type WindowWithSpeech = Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };

/** Result item from Web Speech API. */
interface WebSpeechResultItem {
  isFinal: boolean;
  0: { transcript: string };
  length: number;
}
/** Minimal type for Web Speech recognition instance (browser API, not in DOM typings). */
interface WebSpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort?(): void;
  onresult: ((event: { resultIndex: number; results: { length: number; [key: number]: WebSpeechResultItem } }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

/** True when SpeechRecognition is available (Chrome, Edge, Safari). */
function isWebSpeechAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as WindowWithSpeech;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export interface VoiceInputButtonProps {
  /** Called with transcribed text when recording ends and API returns. */
  onTranscription: (text: string) => void;
  /** Optional: text before cursor (for context). */
  beforeText?: string;
  /** Optional: text after cursor (for context). */
  afterText?: string;
  /** Disabled when e.g. chat is loading. */
  disabled?: boolean;
  /** Size variant. */
  size?: "default" | "sm" | "lg" | "icon";
  /** Extra class for the button. */
  className?: string;
  /** Accessible label. */
  "aria-label"?: string;
}

export function VoiceInputButton({
  onTranscription,
  beforeText,
  afterText,
  disabled = false,
  size = "icon",
  className,
  "aria-label": ariaLabel = "Record voice message",
}: VoiceInputButtonProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const recognitionRef = useRef<WebSpeechRecognitionInstance | null>(null);
  const transcriptsRef = useRef<string[]>([]);
  const useWebSpeech = isWebSpeechAvailable();

  // Backend path: record WAV → POST /api/transcribe (OpenAI or Wispr)
  const startRecordingBackend = useCallback(async () => {
    if (recording || transcribing || disabled) return;
    try {
      const recorder = new VoiceRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setRecording(true);
    } catch (e) {
      console.error("Failed to start recording:", e);
      onTranscription("[Could not access microphone. Please check permissions.]");
    }
  }, [recording, transcribing, disabled, onTranscription]);

  const stopRecordingBackend = useCallback(async () => {
    if (!recording) return;
    const recorder = recorderRef.current;
    if (!recorder) {
      setRecording(false);
      return;
    }
    recorderRef.current = null;
    const { base64, durationMs } = recorder.stop();
    setRecording(false);
    if (durationMs < 500) {
      onTranscription("[Recording too short. Please speak for at least a second.]");
      return;
    }
    setTranscribing(true);
    try {
      const { text } = await transcribeAudio({
        audioBase64: base64,
        language: ["en"],
        beforeText,
        afterText,
      });
      if (text) onTranscription(text);
    } catch (e: unknown) {
      const res = e && typeof e === "object" && "response" in e
        ? (e as { response?: { status?: number; data?: { detail?: string } } }).response
        : null;
      const detail = res?.data?.detail ?? "";
      const status = res?.status;
      console.warn("Voice transcription failed:", status, detail || e);
      let userMessage: string;
      if (status === 503 || /not configured|OPENAI_API_KEY|WISPR_API_KEY/i.test(detail)) {
        userMessage = "[Voice input is not set up on this server. You can type instead.]";
      } else if (status === 502 && detail) {
        const short = detail.length > 120 ? detail.slice(0, 117) + "..." : detail;
        userMessage = `[Voice input failed: ${short}]`;
      } else {
        userMessage = "[Voice input failed. You can type instead.]";
      }
      onTranscription(userMessage);
    } finally {
      setTranscribing(false);
    }
  }, [recording, beforeText, afterText, onTranscription]);

  // Web Speech path: browser STT when available (no backend call)
  const startRecordingWebSpeech = useCallback(() => {
    if (recording || transcribing || disabled) return;
    const w = typeof window !== "undefined" ? (window as WindowWithSpeech) : null;
    const SpeechRecognitionCtor = w?.SpeechRecognition ?? w?.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor || typeof SpeechRecognitionCtor !== "function") return;
    transcriptsRef.current = [];
    const recognition = new (SpeechRecognitionCtor as new () => WebSpeechRecognitionInstance)();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event: { resultIndex: number; results: { length: number; [key: number]: WebSpeechResultItem } }) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal && transcript) transcriptsRef.current.push(transcript);
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setRecording(false);
      setTranscribing(false);
      const text = transcriptsRef.current.join(" ").trim();
      if (text) onTranscription(text);
      else onTranscription("[No speech detected. Try again or type.]");
    };
    recognition.onerror = (event: { error: string }) => {
      recognitionRef.current = null;
      setRecording(false);
      setTranscribing(false);
      console.warn("Web Speech error:", event.error);
      onTranscription("[Voice recognition failed. Try again or type.]");
    };
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setRecording(true);
    } catch (e) {
      console.error("Web Speech start failed:", e);
      onTranscription("[Could not start voice recognition. Try again or type.]");
    }
  }, [recording, transcribing, disabled, onTranscription]);

  const stopRecordingWebSpeech = useCallback(() => {
    if (!recording) return;
    const rec = recognitionRef.current;
    if (rec) {
      rec.stop();
      recognitionRef.current = null;
    }
    setRecording(false);
  }, [recording]);

  const startRecording = useCallback(() => {
    if (useWebSpeech) startRecordingWebSpeech();
    else startRecordingBackend();
  }, [useWebSpeech, startRecordingWebSpeech, startRecordingBackend]);

  const stopRecording = useCallback(() => {
    if (useWebSpeech) stopRecordingWebSpeech();
    else stopRecordingBackend();
  }, [useWebSpeech, stopRecordingWebSpeech, stopRecordingBackend]);

  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        try { rec.abort?.(); } catch { /* noop */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleClick = useCallback(() => {
    if (recording) stopRecording();
    else startRecording();
  }, [recording, startRecording, stopRecording]);

  const busy = recording || transcribing;

  return (
    <Button
      type="button"
      variant={recording ? "destructive" : "outline"}
      size={size}
      disabled={disabled || transcribing}
      onClick={handleClick}
      className={cn(className)}
      aria-label={recording ? "Stop recording" : ariaLabel}
    >
      {transcribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : recording ? (
        <Square className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
