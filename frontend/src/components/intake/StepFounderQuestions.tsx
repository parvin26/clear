"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentUpload, type UploadedFile } from "@/components/diagnostic/DocumentUpload";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import {
  BUSINESS_STAGE_OPTIONS,
  DECISION_HORIZON_OPTIONS,
  DIAGNOSTIC_GOAL_OPTIONS,
  MOST_URGENT_OPTIONS,
  PRIMARY_AREA_OPTIONS,
  PRIMARY_THEME_OPTIONS,
} from "@/lib/intake-constants";
import type { FounderAnswers, StepId } from "@/lib/intake-types";

interface StepFounderQuestionsProps {
  stepId: StepId;
  value: Partial<FounderAnswers> & { uploadedFiles?: UploadedFile[] };
  onChange: (patch: Partial<FounderAnswers> & { uploadedFiles?: UploadedFile[] }) => void;
}

export function StepFounderQuestions({ stepId, value, onChange }: StepFounderQuestionsProps) {
  const uploadedFiles = value.uploadedFiles ?? [];
  const setUploadedFiles = (files: UploadedFile[]) =>
    onChange({ ...value, uploadedFiles: files, documentNames: files.map((f) => f.file.name) });

  if (stepId === "founder_operating") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">Are you running an operating business?</h2>
        <p className="text-sm text-ink-muted">
          CLEAR works best when you already have revenue or active operations.
        </p>
        <div className="flex gap-4">
          {(["yes", "no"] as const).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="operating"
                checked={(value.operatingAndRevenue ?? "") === opt}
                onChange={() => onChange({ ...value, operatingAndRevenue: opt })}
                className="rounded-full border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">
                {opt === "yes" ? "Yes" : "No (idea or validation stage)"}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (stepId === "founder_stage") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">What stage is your business?</h2>
        <p className="text-sm text-ink-muted">Helps us tailor the plan to your context.</p>
        <div className="space-y-4">
          <div>
            <Label>Stage (select closest)</Label>
            <Select
              value={value.businessStageDropdown ?? ""}
              onValueChange={(v) => onChange({ ...value, businessStageDropdown: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_STAGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="founder-stage-text">Or describe in your own words</Label>
            <Input
              id="founder-stage-text"
              placeholder="e.g. Early revenue, 5–20 people, scaling"
              value={value.businessStage ?? ""}
              onChange={(e) => onChange({ ...value, businessStage: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "founder_situation") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">What&apos;s going on right now?</h2>
        <p className="text-sm text-ink-muted">Describe your situation. What feels uncertain or stuck?</p>
        <div className="space-y-4">
          <div>
            <Label>Primary area affected (select)</Label>
            <Select
              value={value.primaryAreaAffected ?? ""}
              onValueChange={(v) => onChange({ ...value, primaryAreaAffected: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_AREA_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="founder-situation">Describe in your own words *</Label>
            <div className="flex gap-2 items-start mt-1">
              <Textarea
                id="founder-situation"
                placeholder="e.g. We're growing but cash is tight. We're not sure whether to focus on cutting costs or pushing for more revenue."
                value={value.situationDescription ?? ""}
                onChange={(e) => onChange({ ...value, situationDescription: e.target.value })}
                rows={5}
                className="resize-none flex-1"
              />
              <VoiceInputButton
                onTranscription={(text) =>
                  onChange({
                    ...value,
                    situationDescription:
                      (value.situationDescription ?? "") + (value.situationDescription ? " " : "") + text,
                  })
                }
                beforeText={value.situationDescription ?? ""}
                aria-label="Speak to describe your situation"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "founder_themes") {
    const clarifiersStr = Array.isArray(value.situationClarifiers)
      ? value.situationClarifiers.join(", ")
      : "";
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">What else is relevant?</h2>
        <p className="text-sm text-ink-muted">Optional: key themes.</p>
        <div className="space-y-4">
          <div>
            <Label>Primary theme (select)</Label>
            <Select
              value={value.primaryTheme ?? ""}
              onValueChange={(v) => onChange({ ...value, primaryTheme: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_THEME_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="founder-clarifiers">Or add themes in your own words (comma-separated)</Label>
            <div className="flex gap-2 items-center mt-1">
              <Input
                id="founder-clarifiers"
                placeholder="e.g. cash flow, hiring, product-market fit"
                value={clarifiersStr}
                onChange={(e) => {
                  const arr = e.target.value
                    .split(/[,;]/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  onChange({ ...value, situationClarifiers: arr });
                }}
                className="flex-1"
              />
              <VoiceInputButton
                onTranscription={(text) => {
                  const current = value.situationClarifiers ?? [];
                  const added = text.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
                  onChange({ ...value, situationClarifiers: [...current, ...added] });
                }}
                beforeText={clarifiersStr}
                aria-label="Speak to add themes"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "founder_urgency") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">What feels most urgent?</h2>
        <p className="text-sm text-ink-muted">We&apos;ll use this to prioritise the main domain.</p>
        <div className="grid gap-2">
          {MOST_URGENT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50"
            >
              <input
                type="radio"
                name="mostUrgent"
                checked={(value.mostUrgent ?? "") === opt.value}
                onChange={() => onChange({ ...value, mostUrgent: opt.value })}
                className="rounded-full border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
        <div>
          <Label htmlFor="founder-urgency-notes">Anything else about what&apos;s urgent? (optional)</Label>
          <div className="flex gap-2 items-start mt-1">
            <Textarea
              id="founder-urgency-notes"
              placeholder="Add more context if you like"
              value={value.mostUrgentNotes ?? ""}
              onChange={(e) => onChange({ ...value, mostUrgentNotes: e.target.value })}
              rows={2}
              className="resize-none flex-1"
            />
            <VoiceInputButton
              onTranscription={(text) =>
                onChange({
                  ...value,
                  mostUrgentNotes:
                    (value.mostUrgentNotes ?? "") + (value.mostUrgentNotes ? " " : "") + text,
                })
              }
              beforeText={value.mostUrgentNotes ?? ""}
              aria-label="Speak to add context about what's urgent"
            />
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "founder_goal") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">What&apos;s your main goal for this decision?</h2>
        <p className="text-sm text-ink-muted">Helps focus the plan.</p>
        <div className="grid gap-2">
          {DIAGNOSTIC_GOAL_OPTIONS.map((opt) => (
            <label
              key={opt.value || "none"}
              className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50"
            >
              <input
                type="radio"
                name="goal"
                checked={(value.diagnosticGoal ?? "") === opt.value}
                onChange={() => onChange({ ...value, diagnosticGoal: opt.value })}
                className="rounded-full border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
        <div>
          <Label htmlFor="founder-goal-notes">Anything else about your goal? (optional)</Label>
          <div className="flex gap-2 items-start mt-1">
            <Textarea
              id="founder-goal-notes"
              placeholder="Add more context if you like"
              value={value.diagnosticGoalNotes ?? ""}
              onChange={(e) => onChange({ ...value, diagnosticGoalNotes: e.target.value })}
              rows={2}
              className="resize-none flex-1"
            />
            <VoiceInputButton
              onTranscription={(text) =>
                onChange({
                  ...value,
                  diagnosticGoalNotes:
                    (value.diagnosticGoalNotes ?? "") + (value.diagnosticGoalNotes ? " " : "") + text,
                })
              }
              beforeText={value.diagnosticGoalNotes ?? ""}
              aria-label="Speak to add context about your goal"
            />
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "founder_docs") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">Upload documents for assessment (optional)</h2>
        <p className="text-sm text-ink-muted">
          e.g. audit reports, financial statements. We&apos;ll use them to enrich your snapshot.
        </p>
        <DocumentUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
      </div>
    );
  }

  if (stepId === "founder_horizon") {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-ink">What&apos;s your decision horizon?</h2>
        <p className="text-sm text-ink-muted">When do you need to see results or make the call?</p>
        <div className="space-y-4">
          <div>
            <Label>Time horizon (select)</Label>
            <Select
              value={value.decisionHorizonDropdown ?? ""}
              onValueChange={(v) => onChange({ ...value, decisionHorizonDropdown: v })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select horizon" />
              </SelectTrigger>
              <SelectContent>
                {DECISION_HORIZON_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="founder-horizon">Or describe in your own words</Label>
            <Input
              id="founder-horizon"
              placeholder="e.g. 3 months, this quarter"
              value={value.decisionHorizon ?? ""}
              onChange={(e) => onChange({ ...value, decisionHorizon: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
