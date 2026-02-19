"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import {
  MSME_CHALLENGE_OPTIONS,
  MSME_PRIMARY_FOCUS_OPTIONS,
  MSME_YEARS_OPERATING_OPTIONS,
  MSME_PRIMARY_CONSTRAINT_OPTIONS,
  MSME_DEMAND_SENTIMENT_OPTIONS,
  MSME_DECISION_HORIZON_OPTIONS,
} from "@/lib/intake-constants";
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
        <h2 className="text-xl font-semibold text-ink">Challenges</h2>
        <p className="text-sm text-ink-muted">
          Which of these feel most true right now?
        </p>
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
        <div className="pt-2">
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

  if (stepId === "msme_context") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">Context</h2>
        <p className="text-sm text-ink-muted">A few more details help us tailor your snapshot.</p>

        <div className="space-y-4">
          <div>
            <Label>How long has this business been running?</Label>
            <Select
              value={value.years_operating ?? ""}
              onValueChange={(v) => onChange({ ...value, years_operating: v || undefined })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {MSME_YEARS_OPERATING_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>What&apos;s the single biggest constraint right now?</Label>
            <p className="text-xs text-ink-muted mt-0.5">Time, cash, people, or market.</p>
            <Select
              value={value.primary_constraint ?? ""}
              onValueChange={(v) => onChange({ ...value, primary_constraint: v || undefined })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {MSME_PRIMARY_CONSTRAINT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>How would you describe demand for your product or service right now?</Label>
            <p className="text-xs text-ink-muted mt-0.5">Stable, growing, declining, or unpredictable.</p>
            <Select
              value={value.demand_sentiment ?? ""}
              onValueChange={(v) => onChange({ ...value, demand_sentiment: v || undefined })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {MSME_DEMAND_SENTIMENT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "msme_focus") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">Focus</h2>
        <p className="text-sm text-ink-muted">Which area do you MOST want help with?</p>
        <div>
          <Label>Select one</Label>
          <p className="text-xs text-ink-muted mt-0.5 mb-2">
            Finance (cash flow, working capital) · Sales &amp; marketing (demand, retention) · Operations · Technology
          </p>
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
        <div className="pt-2">
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
    );
  }

  if (stepId === "msme_horizon") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">Horizon &amp; priority</h2>
        <p className="text-sm text-ink-muted">When do you need to see results or make the call?</p>

        <div>
          <Label>Time horizon (select)</Label>
          <Select
            value={value.decision_horizon ?? ""}
            onValueChange={(v) => onChange({ ...value, decision_horizon: v || undefined })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {MSME_DECISION_HORIZON_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <Label htmlFor="msme-priority">In one sentence, what would help most right now?</Label>
          <p className="text-xs text-ink-muted mt-0.5">Optional but helpful — we use this to tailor your snapshot.</p>
          <Input
            id="msme-priority"
            placeholder="e.g. get a clear plan to fix cash flow"
            value={value.priority_sentence ?? ""}
            onChange={(e) => onChange({ ...value, priority_sentence: e.target.value || undefined })}
            className="mt-1"
          />
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
        <h2 className="text-xl font-semibold text-ink">Documents</h2>
        <p className="text-sm text-ink-muted">
          Upload documents for assessment (optional). e.g. audit reports, financial statements, current reports.
        </p>
        <DocumentUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
      </div>
    );
  }

  return null;
}
