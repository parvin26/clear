"use client";

import { useState, useCallback, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "@/lib/voice-recorder";
import { transcribeAudio } from "@/lib/api";
import { cn } from "@/lib/utils";

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

  const startRecording = useCallback(async () => {
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

  const stopRecording = useCallback(async () => {
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
      // Log for debugging; don't put long/technical text into the input
      console.warn("Voice transcription failed:", status, detail || e);
      let userMessage: string;
      if (status === 503 || /not configured|WISPR_API_KEY/i.test(detail)) {
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
