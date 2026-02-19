"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { DocumentUpload, type UploadedFile } from "@/components/diagnostic/DocumentUpload";
import { MSME_CHALLENGE_OPTIONS, MSME_PRIMARY_FOCUS_OPTIONS } from "@/lib/intake-constants";
import type { MSMEAnswers, StepId } from "@/lib/intake-types";
import { Check } from "lucide-react";

interface StepMSMEQuestionsProps {
  stepId: StepId;
  value: Partial<MSMEAnswers> & { uploadedFiles?: UploadedFile[] };
  onChange: (patch: Partial<MSMEAnswers> & { uploadedFiles?: UploadedFile[] }) => void;
}

export function StepMSMEQuestions({ stepId, value, onChange }: StepMSMEQuestionsProps) {
  const challenges = value.challenges ?? [];
  const toggleChallenge = (v: string) => {
    const next = challenges.includes(v)
      ? challenges.filter((c) => c !== v)
      : [...challenges, v];
    onChange({ ...value, challenges: next });
  };

  if (stepId === "msme_challenges") {
    return (
      <div className="space-y-6">
        <p className="text-sm text-ink-muted">
          We want to make sure we understand the situation correctly.
        </p>
        <h2 className="text-xl font-semibold text-ink">
          Which of these feel most true right now?
        </h2>
        <div className="grid gap-2">
          {MSME_CHALLENGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleChallenge(opt.value)}
              className={`flex items-center justify-between gap-2 p-3 rounded-lg border text-left transition-colors ${
                challenges.includes(opt.value)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              {challenges.includes(opt.value) && (
                <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />
              )}
            </button>
          ))}
        </div>
        <div>
          <Label htmlFor="msme-notes">Anything else? (optional)</Label>
          <div className="flex gap-2 items-start mt-1">
            <Textarea
              id="msme-notes"
              placeholder="Add context in your own words"
              value={value.challengesNotes ?? ""}
              onChange={(e) => onChange({ ...value, challengesNotes: e.target.value })}
              rows={3}
              className="resize-none flex-1"
            />
            <VoiceInputButton
              onTranscription={(text) =>
                onChange({
                  ...value,
                  challengesNotes:
                    (value.challengesNotes ?? "") + (value.challengesNotes ? " " : "") + text,
                })
              }
              beforeText={value.challengesNotes ?? ""}
              aria-label="Speak to add context"
            />
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "msme_focus") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">Where do you want to focus first?</h2>
        <p className="text-sm text-ink-muted">We&apos;ll use this to prioritise the main area.</p>
        <div className="space-y-4">
          <div>
            <Label>Primary focus (select)</Label>
            <Select
              value={value.primaryFocus ?? ""}
              onValueChange={(v) => onChange({ ...value, primaryFocus: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {MSME_PRIMARY_FOCUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="msme-focus-notes">Describe in your own words (optional)</Label>
            <div className="flex gap-2 items-start mt-1">
              <Textarea
                id="msme-focus-notes"
                placeholder="What would help most right now?"
                value={value.primaryFocusNotes ?? ""}
                onChange={(e) => onChange({ ...value, primaryFocusNotes: e.target.value })}
                rows={3}
                className="resize-none flex-1"
              />
              <VoiceInputButton
                onTranscription={(text) =>
                  onChange({
                    ...value,
                    primaryFocusNotes:
                      (value.primaryFocusNotes ?? "") + (value.primaryFocusNotes ? " " : "") + text,
                  })
                }
                beforeText={value.primaryFocusNotes ?? ""}
                aria-label="Speak to describe what would help most"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "msme_docs") {
    const uploadedFiles = value.uploadedFiles ?? [];
    const setUploadedFiles = (files: UploadedFile[]) =>
      onChange({ ...value, uploadedFiles: files, documentNames: files.map((f) => f.file.name) });
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">Upload documents for assessment (optional)</h2>
        <p className="text-sm text-ink-muted">
          e.g. audit reports, financial statements, current reports.
        </p>
        <DocumentUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
      </div>
    );
  }

  return null;
}
