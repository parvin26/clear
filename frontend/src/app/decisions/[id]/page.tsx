"use client";

import { useEffect, useState, useCallback, type ReactNode, type ReactElement } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import {
  getDecision,
  listDecisions,
  listLedgerEvents,
  listEvidenceLinks,
  finalizeDecision,
  signOffDecision,
  updateDecisionExecution,
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  patchArtifactPartial,
  createOutcomeReview,
  listOutcomeReviews,
  getReadiness,
  decisionChatStart,
  decisionChatSeed,
  decisionChatMessage,
  commitExecutionPlan,
  addEvidenceLink,
  uploadEvidenceFile,
  getEvidenceFileUrl,
  getViewingRole,
  getEnterpriseTimeline,
  getEnterpriseActivation,
  inviteEnterpriseMember,
  inviteAdvisorToDecision,
  listDecisionComments,
  createDecisionComment,
  type DecisionOut,
  type LedgerEventOut,
  type EvidenceLinkOut,
  type MilestoneOut,
  type OutcomeReviewOut,
  type ReadinessOut,
  type OutcomeReviewCreateBody,
  type TimelineItem,
  type DecisionCommentOut,
} from "@/lib/clear-api";
import { computeActivationProgress, mapEnterpriseActivationToProgress } from "@/lib/activation";
import { ActivationChecklist } from "@/components/activation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Lock, PenLine, Plus, Check, Pencil, Trash2, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackOpenedDecisionWorkspace, trackReturnedToPreviousDecision } from "@/lib/diagnostic-analytics";

/** Snapshot shape for overview tab (avoids unknown inference from Record<string, unknown>). */
interface DecisionSnapshotShape {
  decision_statement?: string;
  why_now?: string[];
  key_constraints?: string[];
  success_metric?: string;
  timeframe?: string;
}

function OverviewSnapshotCard({ snapshot }: { snapshot: DecisionSnapshotShape }): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {snapshot.decision_statement != null && snapshot.decision_statement !== "" ? (
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Decision</p>
            <p className="text-ink">{snapshot.decision_statement}</p>
          </div>
        ) : null}
        {snapshot.why_now?.length ? (
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Why now</p>
            <ul className="list-disc pl-4 text-ink">{snapshot.why_now.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        ) : null}
        {snapshot.key_constraints?.length ? (
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Key constraints</p>
            <ul className="list-disc pl-4 text-ink">{snapshot.key_constraints.map((c, i) => <li key={i}>{c}</li>)}</ul>
          </div>
        ) : null}
        {snapshot.success_metric != null && snapshot.success_metric !== "" ? (
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">How success looks</p>
            <p className="text-ink">{snapshot.success_metric}</p>
          </div>
        ) : null}
        {snapshot.timeframe != null && snapshot.timeframe !== "" ? (
          <div>
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-1">Timeframe</p>
            <p className="text-ink">{snapshot.timeframe}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Extract user-facing message from API errors (axios + FastAPI detail). */
function getApiErrorMessage(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { detail?: string | unknown } } };
  if (err?.response?.data?.detail != null) {
    const d = err.response.data.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map((x: { msg?: string }) => x?.msg ?? String(x)).join(", ");
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

/** Info icon + optional expandable help text for a section. */
function SectionInfo({
  id,
  openId,
  setOpenId,
  title,
  content,
}: {
  id: string;
  openId: string | null;
  setOpenId: (v: string | null) => void;
  title: ReactNode;
  content: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {title}
        <button
          type="button"
          aria-label="What's this?"
          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => setOpenId(openId === id ? null : id)}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
      {openId === id && (
        <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          {content}
        </div>
      )}
    </div>
  );
}

function MilestoneEditRow({
  milestone,
  onSave,
  onCancel,
}: {
  milestone: MilestoneOut;
  onSave: (body: { milestone_name?: string; responsible_person?: string | null; due_date?: string | null; status?: string; notes?: string | null }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(milestone.milestone_name);
  const [person, setPerson] = useState(milestone.responsible_person ?? "");
  const [due, setDue] = useState(milestone.due_date ? milestone.due_date.toString().slice(0, 10) : "");
  const [notes, setNotes] = useState(milestone.notes ?? "");
  return (
    <div className="flex flex-col gap-2 w-full">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Milestone name" />
      <Input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Responsible person" />
      <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} placeholder="Due date" />
      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" rows={2} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ milestone_name: name.trim(), responsible_person: person.trim() || null, due_date: due || null, notes: notes.trim() || null })}>Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function DecisionWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const decisionId = params.id as string;
  const fromDiagnostic = searchParams.get("from_diagnostic") === "1";
  const [decision, setDecision] = useState<DecisionOut | null>(null);
  const [ledger, setLedger] = useState<LedgerEventOut[]>([]);
  const [evidence, setEvidence] = useState<EvidenceLinkOut[]>([]);
  const [milestones, setMilestones] = useState<MilestoneOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [executionSaving, setExecutionSaving] = useState(false);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
  const [readiness, setReadiness] = useState<ReadinessOut | null>(null);
  const [outcomeReviews, setOutcomeReviews] = useState<OutcomeReviewOut[]>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [artifactSaving, setArtifactSaving] = useState(false);
  const [showOutcomeReviewModal, setShowOutcomeReviewModal] = useState(false);
  const [outcomeReviewForm, setOutcomeReviewForm] = useState<OutcomeReviewCreateBody>({
    summary: "",
    what_worked: "",
    what_did_not_work: "",
    key_learnings: "",
    assumptions_validated: "",
    assumptions_broken: "",
    readiness_impact: "zero",
    main_constraint: "",
    keep_raise_reduce_stop: "",
  });
  const [outcomeReviewSubmitting, setOutcomeReviewSubmitting] = useState(false);
  const [newEvidenceType, setNewEvidenceType] = useState<string>("document");
  const [newEvidenceRef, setNewEvidenceRef] = useState("");
  const [evidenceAdding, setEvidenceAdding] = useState(false);
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const [evidenceUploadType, setEvidenceUploadType] = useState<string>("document");
  const [evidenceSelectedFileName, setEvidenceSelectedFileName] = useState<string | null>(null);
  const [openInfoId, setOpenInfoId] = useState<string | null>(null);
  const [commitMustDoIds, setCommitMustDoIds] = useState<string[]>([]);
  const [commitNote, setCommitNote] = useState("");
  const [commitSubmitting, setCommitSubmitting] = useState(false);
  const [viewingRole, setViewingRole] = useState<string | null>(null);
  const [viewingEmail, setViewingEmail] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [comments, setComments] = useState<DecisionCommentOut[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [commentAuthorEmail, setCommentAuthorEmail] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"advisor" | "capital_partner">("advisor");
  const [inviteRoleLabel, setInviteRoleLabel] = useState(""); // e.g. CFO, board member (for advisor)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteSending, setInviteSending] = useState(false);
  const [activationProgress, setActivationProgress] = useState<ReturnType<typeof computeActivationProgress> | null>(null);

  const load = useCallback(() => {
    if (!decisionId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getDecision(decisionId),
      listLedgerEvents(decisionId),
      listEvidenceLinks(decisionId),
      listMilestones(decisionId),
      getReadiness(decisionId).catch(() => null),
      listOutcomeReviews(decisionId).catch(() => []),
    ])
      .then(([d, l, e, m, r, o]) => {
        setDecision(d);
        setLedger(l);
        setEvidence(e);
        setMilestones(m);
        setReadiness(r ?? null);
        setOutcomeReviews(Array.isArray(o) ? o : []);
      })
      .catch(() => setError("Failed to load decision"))
      .finally(() => setLoading(false));
  }, [decisionId]);

  function loadMilestonesOnly() {
    if (!decisionId) return;
    listMilestones(decisionId).then(setMilestones).catch(() => {});
  }

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("tab") !== "chat" || !decisionId || chatStarted) return;
    const fromDiag = searchParams.get("from_diagnostic") === "1";
    const seededKey = "clear_chat_seeded_" + decisionId;
    setChatStarted(true);
    if (fromDiag && typeof localStorage !== "undefined" && !localStorage.getItem(seededKey)) {
      decisionChatSeed(decisionId)
        .then((r) => {
          setChatInitialMessage(r.initial_message);
          localStorage.setItem(seededKey, "1");
        })
        .then(() => decisionChatStart(decisionId))
        .then((res) => setChatSessionId(res.session_id))
        .catch(() => {
          setActionError("Failed to seed chat");
          setChatStarted(false);
        });
    } else {
      decisionChatStart(decisionId)
        .then((res) => {
          setChatSessionId(res.session_id);
          setChatInitialMessage((prev) => prev ?? res.initial_assistant_message);
        })
        .catch(() => {
          setActionError("Failed to start chat");
          setChatStarted(false);
        });
    }
  }, [decisionId, searchParams.get("tab"), chatStarted]);

  useEffect(() => {
    if (!decisionId) return;
    if (fromDiagnostic) {
      trackOpenedDecisionWorkspace(decisionId);
    } else {
      trackReturnedToPreviousDecision(decisionId);
    }
  }, [decisionId, fromDiagnostic]);

  useEffect(() => {
    if (!decisionId) return;
    const token = searchParams.get("token");
    getViewingRole(decisionId, token ?? null).then((r) => {
      if (r.role) setViewingRole(r.role);
      if (r.email) setViewingEmail(r.email);
    }).catch(() => {});
  }, [decisionId, searchParams.get("token")]);

  useEffect(() => {
    if (!decision?.enterprise_id) return;
    getEnterpriseTimeline(decision.enterprise_id).then(setTimeline).catch(() => []);
  }, [decision?.enterprise_id]);

  useEffect(() => {
    if (!decision?.enterprise_id || !decisionId) return;
    getEnterpriseActivation(decision.enterprise_id)
      .then((a) =>
        setActivationProgress(mapEnterpriseActivationToProgress(a, decisionId))
      )
      .catch(() => {});
  }, [decision?.enterprise_id, decisionId]);

  useEffect(() => {
    if (!decisionId) return;
    listDecisionComments(decisionId).then(setComments).catch(() => []);
  }, [decisionId, decision]);

  useEffect(() => {
    if (!decisionId) return;
    listDecisions({ limit: 10 })
      .then((list) => {
        return Promise.all([
          Promise.all(list.map((d) => getDecision(d.decision_id))),
          Promise.all(
            list.map((d) =>
              listMilestones(d.decision_id).then((ms) => ms.map((m) => ({ ...m, decision_id: d.decision_id })))
            )
          ),
        ]).then(([details, milestoneChunks]) => {
          const byId: Record<string, DecisionOut> = {};
          list.forEach((d, i) => {
            byId[d.decision_id] = details[i];
          });
          const allMilestones = (milestoneChunks as { decision_id: string; id: number }[][]).flat();
          setActivationProgress(computeActivationProgress(list, byId, allMilestones));
        });
      })
      .catch(() => setActivationProgress(null));
  }, [decisionId]);

  const canEdit = viewingRole === "founder" || !viewingRole;
  const canCommit = canEdit;
  const canInvite = canEdit && decision?.enterprise_id;

  async function handleInvite() {
    if (!decision?.enterprise_id || !inviteEmail.trim()) return;
    setInviteSending(true);
    setActionError(null);
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      if (inviteRole === "advisor") {
        const res = await inviteAdvisorToDecision(
          decisionId,
          { name: inviteName.trim() || undefined, email: inviteEmail.trim(), role: inviteRoleLabel.trim() || "Advisor" },
          baseUrl
        );
        setInviteUrl(res.invite_url);
      } else {
        const res = await inviteEnterpriseMember(decision.enterprise_id, { email: inviteEmail.trim(), role: inviteRole }, baseUrl);
        setInviteUrl(res.invite_url);
      }
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Invite failed"));
    } finally {
      setInviteSending(false);
    }
  }

  async function handleAddComment() {
    if (!decisionId || !commentContent.trim()) return;
    setCommentSubmitting(true);
    setActionError(null);
    try {
      await createDecisionComment(decisionId, {
        content: commentContent.trim(),
        author_email: commentAuthorEmail.trim() || viewingEmail || "guest",
        author_role: viewingRole ?? undefined,
      });
      setCommentContent("");
      listDecisionComments(decisionId).then(setComments);
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Comment failed"));
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleFinalize() {
    if (!decisionId) return;
    setActionError(null);
    setBusy(true);
    try {
      await finalizeDecision(decisionId);
      load();
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Finalize failed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOff() {
    if (!decisionId) return;
    setActionError(null);
    const actorId = window.prompt("Sign-off: enter your identifier (e.g. name or email):");
    if (actorId == null || !actorId.trim()) return;
    setBusy(true);
    try {
      await signOffDecision(decisionId, { actor_id: actorId.trim() });
      load();
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Sign-off failed"));
    } finally {
      setBusy(false);
    }
  }

  async function saveExecution(body: { responsible_owner?: string | null; expected_outcome?: string | null; outcome_review_reminder?: boolean; outcome_review_notes?: string | null }) {
    if (!decisionId) return;
    setExecutionSaving(true);
    setActionError(null);
    try {
      const updated = await updateDecisionExecution(decisionId, body);
      setDecision(updated);
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to save"));
    } finally {
      setExecutionSaving(false);
    }
  }

  async function handleAddMilestone() {
    if (!decisionId || !newMilestoneName.trim()) return;
    setActionError(null);
    try {
      await createMilestone(decisionId, { milestone_name: newMilestoneName.trim(), status: "pending" });
      setNewMilestoneName("");
      loadMilestonesOnly();
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to add milestone"));
    }
  }

  async function handleUpdateMilestone(milestoneId: number, body: { milestone_name?: string; responsible_person?: string | null; due_date?: string | null; status?: string; notes?: string | null }) {
    if (!decisionId) return;
    setActionError(null);
    try {
      await updateMilestone(decisionId, milestoneId, body);
      setEditingMilestoneId(null);
      loadMilestonesOnly();
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to update milestone"));
    }
  }

  async function handleDeleteMilestone(milestoneId: number) {
    if (!decisionId) return;
    if (!confirm("Delete this milestone?")) return;
    setActionError(null);
    try {
      await deleteMilestone(decisionId, milestoneId);
      setEditingMilestoneId(null);
      loadMilestonesOnly();
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to delete milestone"));
    }
  }

  const artifactData = decision?.latest_artifact as Record<string, unknown> | null | undefined;
  const governance = (artifactData?.governance as Record<string, unknown> | undefined) || {};
  const emr = (artifactData?.emr as Record<string, unknown> | undefined) || {};
  const capabilityGaps = (artifactData?.capability_gaps as unknown[]) || [];
  const emrMilestones = (emr.milestones as { id?: string; title?: string; description?: string; owner?: string; due_date?: string; status?: string }[]) || [];
  const emrMetrics = (emr.metrics as { id?: string; name?: string; definition?: string; target_value?: string; unit?: string; actual_value?: string; source?: string; input_type?: string }[]) || [];
  const emrConfig = (emr.config as { cadence?: string; next_review_date?: string | null; horizon_label?: string }) || {};
  const nextReviewDate = emrConfig.next_review_date ?? null;
  const now = new Date();
  const nextReviewDue = nextReviewDate ? now >= new Date(nextReviewDate) : false;
  const planCommitted = artifactData?.plan_committed === true;
  const mustDoRecommendedIds = (emr.must_do_recommended_ids as string[]) || [];
  const lastCycleSummary = artifactData?.last_cycle_summary as {
    cycle_number?: number;
    milestones_completed?: number;
    milestones_total?: number;
    readiness_before?: string;
    readiness_after?: string;
    next_cycle_focus?: string;
  } | null | undefined;

  const overviewSnapshot: DecisionSnapshotShape | null =
    artifactData != null && artifactData.decision_snapshot != null
      ? (artifactData.decision_snapshot as DecisionSnapshotShape)
      : null;

  async function cycleApprovalStatus() {
    if (!decisionId || !artifactData) return;
    const status = (governance.approval_status as string) || "draft";
    const next = status === "draft" ? "pending_approval" : status === "pending_approval" ? "approved" : "draft";
    setActionError(null);
    setArtifactSaving(true);
    try {
      const updated = await patchArtifactPartial(decisionId, {
        governance: { ...governance, approval_status: next },
      });
      setDecision(updated);
      getReadiness(decisionId).then(setReadiness).catch(() => {});
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to update governance"));
    } finally {
      setArtifactSaving(false);
    }
  }

  async function patchEmr(partial: Record<string, unknown>) {
    if (!decisionId) return;
    setActionError(null);
    setArtifactSaving(true);
    try {
      const updated = await patchArtifactPartial(decisionId, {
        emr: { ...emr, ...partial },
      });
      setDecision(updated);
      getReadiness(decisionId).then(setReadiness).catch(() => {});
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to update EMR"));
    } finally {
      setArtifactSaving(false);
    }
  }

  async function sendChatMessage() {
    if (!decisionId || !chatSessionId || !chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: msg }]);
    setChatSending(true);
    try {
      const res = await decisionChatMessage(decisionId, { session_id: chatSessionId, message: msg });
      setChatMessages((prev) => [...prev, { role: "assistant", content: res.assistant_message }]);
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to send message"));
      setChatMessages((prev) => prev.slice(0, -1));
    } finally {
      setChatSending(false);
    }
  }

  async function submitOutcomeReview() {
    if (!decisionId) return;
    setOutcomeReviewSubmitting(true);
    setActionError(null);
    try {
      await createOutcomeReview(decisionId, outcomeReviewForm);
      setShowOutcomeReviewModal(false);
      setOutcomeReviewForm({ summary: "", what_worked: "", what_did_not_work: "", key_learnings: "", assumptions_validated: "", assumptions_broken: "", readiness_impact: "zero" });
      const list = await listOutcomeReviews(decisionId);
      setOutcomeReviews(list);
      getDecision(decisionId).then(setDecision);
      getReadiness(decisionId).then(setReadiness).catch(() => {});
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to save outcome review"));
    } finally {
      setOutcomeReviewSubmitting(false);
    }
  }

  async function handleAddEvidence() {
    if (!decisionId || !newEvidenceRef.trim()) return;
    setActionError(null);
    setEvidenceAdding(true);
    try {
      const ref = newEvidenceRef.trim();
      const isUrl = /^https?:\/\//i.test(ref);
      await addEvidenceLink(decisionId, {
        decision_id: decisionId,
        evidence_type: newEvidenceType,
        source_ref: isUrl ? { system: "object_store", uri: ref } : { system: "db", id: ref },
        source_table: isUrl ? null : "documents",
        source_id: isUrl ? null : ref.slice(0, 255),
      });
      setNewEvidenceRef("");
      const list = await listEvidenceLinks(decisionId);
      setEvidence(list);
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to add evidence link"));
    } finally {
      setEvidenceAdding(false);
    }
  }

  async function handleUploadEvidence(file: File | null) {
    if (!decisionId || !file) return;
    setActionError(null);
    setEvidenceSelectedFileName(file.name);
    setEvidenceUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("evidence_type", evidenceUploadType);
      await uploadEvidenceFile(decisionId, formData);
      const list = await listEvidenceLinks(decisionId);
      setEvidence(list);
    } catch (e: unknown) {
      setActionError(getApiErrorMessage(e, "Failed to upload evidence file"));
    } finally {
      setEvidenceUploading(false);
      setEvidenceSelectedFileName(null);
    }
  }

  if (loading && !decision) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (error || !decision) {
    return (
      <Shell>
        <div className="text-center py-12">
          <p className="text-destructive">{error || "Decision not found"}</p>
          <Link href="/decisions">
            <Button variant="outline" className="mt-4">Back to list</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const artifact = decision.latest_artifact;
  const isDraft = decision.current_status === "draft";
  const isFinalized = decision.current_status === "finalized";
  const canFinalize = isDraft && artifact;
  const canSignOff = isFinalized;

  return (
    <Shell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <Link href="/decisions" className="text-sm text-muted-foreground hover:underline">← Decisions</Link>
            <h1 className="text-2xl font-semibold tracking-tight mt-1 truncate">
              Decision {decision.decision_id.slice(0, 8)}…
            </h1>
            <p className="text-sm text-ink-muted truncate mt-0.5">
              {(artifactData?.decision_snapshot as { decision_statement?: string } | undefined)?.decision_statement?.slice(0, 80) ?? decision.decision_id}
              {(artifactData?.decision_snapshot as { decision_statement?: string } | undefined)?.decision_statement && (artifactData?.decision_snapshot as { decision_statement?: string }).decision_statement!.length > 80 ? "…" : ""}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {artifactData?.decision_context != null ? (
                <Badge variant="outline">
                  {String((artifactData.decision_context as Record<string, unknown>)?.primary_domain ?? "-")}
                </Badge>
              ) : null}
              {readiness != null ? <Badge variant="secondary">{String(readiness.band)}</Badge> : null}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {viewingRole && (
              <Badge variant="outline">Viewing as: {viewingRole}</Badge>
            )}
            <Badge variant={isDraft ? "secondary" : "default"}>{decision.current_status}</Badge>
          </div>
        </div>

        {actionError && (
          <p className="text-destructive text-sm">{actionError}</p>
        )}

        {activationProgress && !activationProgress.allComplete && (
          <div className="mb-6">
            <ActivationChecklist
              progress={activationProgress}
              firstDecisionId={decisionId}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {canFinalize && (
            <Button onClick={handleFinalize} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Finalize (lock artifact)
            </Button>
          )}
          {canSignOff && (
            <Button onClick={handleSignOff} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PenLine className="w-4 h-4 mr-2" />}
              Sign off (acknowledge)
            </Button>
          )}
        </div>

        <Tabs
          value={["overview", "execution", "chat", "history", "timeline"].includes(searchParams.get("tab") ?? "") ? searchParams.get("tab")! : "overview"}
          onValueChange={(v) => router.replace(`/decisions/${decisionId}?tab=${v}`)}
        >
          <TabsList className="sticky top-[57px] z-10 bg-background/95 backdrop-blur border-b border-border rounded-b-none w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            {decision.enterprise_id != null && (
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="overview" className="space-y-4 pt-4">
            {/* @ts-expect-error TS2322 - overviewSnapshot from artifact cast is ReactNode at runtime */}
            {overviewSnapshot != null ? <OverviewSnapshotCard snapshot={overviewSnapshot} /> : null}
            {/* Synthesis summary */}
            {(artifactData?.synthesis_summary || artifactData?.decision_context) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Synthesis summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><span className="font-medium text-ink-muted">Primary domain:</span> {(artifactData?.decision_context as { primary_domain?: string })?.primary_domain ?? (artifactData?.synthesis_summary as { primary_domain?: string })?.primary_domain ?? "-"}</p>
                  <p><span className="font-medium text-ink-muted">Secondary domains:</span> {(artifactData?.synthesis_summary as { secondary_domains?: string[] })?.secondary_domains?.join(", ") ?? "-"}</p>
                  <p><span className="font-medium text-ink-muted">Recommended next step:</span> {(artifactData?.synthesis_summary as { recommended_next_step?: string })?.recommended_next_step ?? "-"}</p>
                </CardContent>
              </Card>
            )}
            {/* Last cycle at a glance */}
            {lastCycleSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Last cycle at a glance</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p>Milestones completed: {lastCycleSummary.milestones_completed ?? 0} of {lastCycleSummary.milestones_total ?? 0}.</p>
                  <p>Readiness: {lastCycleSummary.readiness_before ?? "-"} → {lastCycleSummary.readiness_after ?? "-"}.</p>
                  {lastCycleSummary.next_cycle_focus && <p>Next cycle focus: {lastCycleSummary.next_cycle_focus}</p>}
                </CardContent>
              </Card>
            )}
            {(!artifactData?.decision_snapshot && !artifactData?.synthesis_summary && !lastCycleSummary) && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-sm">No overview data yet. Run a diagnostic or add an artifact.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="execution" className="space-y-4">
            {actionError && <p className="text-destructive text-sm">{actionError}</p>}
            {lastCycleSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Last cycle at a glance</CardTitle>
                  <p className="text-xs text-muted-foreground">Summary from your most recent outcome review.</p>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Milestones:</span> {lastCycleSummary.milestones_completed ?? 0} of {lastCycleSummary.milestones_total ?? 0} completed
                  </p>
                  <p>
                    <span className="font-medium">Readiness:</span> {lastCycleSummary.readiness_before ?? "-"} → {lastCycleSummary.readiness_after ?? "-"}
                  </p>
                  {lastCycleSummary.next_cycle_focus && (
                    <p>
                      <span className="font-medium">Next cycle focus:</span> {lastCycleSummary.next_cycle_focus}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            {(!capabilityGaps.length || !emrMilestones.length || !emrMetrics.length) && (
              <p className="text-amber-600 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                Readiness to approve: add at least one capability gap, one milestone, and one metric for a complete picture.
              </p>
            )}
            <Card>
              <CardHeader>
                <SectionInfo
                  id="exec-emr-milestones"
                  openId={openInfoId}
                  setOpenId={setOpenInfoId}
                  title={<CardTitle className="text-base">EMR: Milestones</CardTitle>}
                  content="What it's for: Track key steps to execute this decision (from diagnostic or added by you). Use it: Update status (pending → in progress → done) as work progresses; changes are saved to the artifact."
                />
                <p className="text-xs text-muted-foreground">From artifact; status: pending → in_progress → done.</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {emrMilestones.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No EMR milestones yet. Run a diagnostic to bootstrap.</p>
                ) : (
                  <ul className="space-y-2">
                    {emrMilestones.map((m) => (
                      <li key={m.id || ""} className="border rounded-md p-2 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">{m.title ?? "-"}</span>
                        <span className="text-muted-foreground">{m.owner ?? ""}</span>
                        <span className="text-muted-foreground">{m.due_date ? new Date(m.due_date).toLocaleDateString() : ""}</span>
                        <Select
                          value={(m.status ?? "pending").toString().toLowerCase()}
                          onValueChange={(v) => {
                            const current = (m.status ?? "pending").toString().toLowerCase();
                            if (v === current) return;
                            const list = emrMilestones.map((x) => (x.id === m.id ? { ...x, status: v } : x));
                            patchEmr({ milestones: list });
                          }}
                        >
                          <SelectTrigger className="w-[140px] h-8"> <SelectValue /> </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <SectionInfo
                  id="exec-emr-metrics"
                  openId={openInfoId}
                  setOpenId={setOpenInfoId}
                  title={<CardTitle className="text-base">EMR: Metrics</CardTitle>}
                  content="What it's for: Measures that show whether the decision is on track. Use it: Enter actual values as data comes in; target and source are set from the diagnostic or here."
                />
                <p className="text-xs text-muted-foreground">Target and actual; source: manual or integrated.</p>
              </CardHeader>
              <CardContent>
                {emrMetrics.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No EMR metrics yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {emrMetrics.map((met) => {
                      const inputType = (met.input_type === "number" ? "number" : "text") as "number" | "text";
                      return (
                        <li key={met.id || ""} className="flex flex-wrap items-center gap-2 border-b pb-2">
                          <span className="font-medium">{met.name ?? "-"}</span>
                          <span className="text-muted-foreground">Target: {met.target_value ?? "-"}{met.unit ? ` ${met.unit}` : ""}</span>
                          <Input
                            type={inputType}
                            className="w-24 h-8"
                            placeholder="Actual"
                            defaultValue={met.actual_value ?? ""}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              const list = emrMetrics.map((x) => (x.id === met.id ? { ...x, actual_value: v || undefined } : x));
                              patchEmr({ metrics: list });
                            }}
                          />
                          {met.unit ? <span className="text-muted-foreground text-xs">{met.unit}</span> : null}
                          <span className="text-muted-foreground text-xs">{met.source ?? "manual"}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <SectionInfo
                  id="exec-emr-config"
                  openId={openInfoId}
                  setOpenId={setOpenInfoId}
                  title={<CardTitle className="text-base">EMR: Config</CardTitle>}
                  content="What it's for: How often you review progress and when the next review is due. Use it: Set the next review date; when it's passed, the Outcome review section will prompt you to add a review."
                />
                <p className="text-xs text-muted-foreground">Cadence and next review date. {!planCommitted && "EMR is draft until you commit the plan below."}</p>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <span className="text-sm">Cadence: {(emrConfig.cadence as string) || "monthly"}</span>
                <Label className="text-sm">Next review:</Label>
                <Input
                  type="date"
                  className="w-40"
                  value={nextReviewDate ? nextReviewDate.slice(0, 10) : ""}
                  onChange={(e) => patchEmr({ config: { ...emrConfig, next_review_date: e.target.value || null } })}
                />
              </CardContent>
            </Card>
            {!planCommitted && emrMilestones.length > 0 && canCommit && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Must‑do milestones</CardTitle>
                  <p className="text-xs text-muted-foreground">Checkbox selection for up to 3 must‑dos.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label>Must-do milestones (pick up to 3)</Label>
                    <div className="flex flex-wrap gap-3">
                      {emrMilestones.map((m) => {
                        const id = m.id ?? "";
                        const checked = commitMustDoIds.includes(id);
                        const canAdd = checked || commitMustDoIds.length < 3;
                        return (
                          <label key={id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!canAdd && !checked}
                              onChange={() => setCommitMustDoIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev))}
                            />
                            <span>{m.title ?? id}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label>Commitment note (optional)</Label>
                    <Input
                      placeholder="One line commitment"
                      value={commitNote}
                      onChange={(e) => setCommitNote(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!decisionId) return;
                      setCommitSubmitting(true);
                      setActionError(null);
                      try {
                        await commitExecutionPlan(decisionId, {
                          must_do_milestone_ids: commitMustDoIds.slice(0, 3),
                          commit_note: commitNote.trim() || null,
                        });
                        load();
                        setCommitNote("");
                        setCommitMustDoIds([]);
                      } catch (e: unknown) {
                        setActionError(getApiErrorMessage(e, "Failed to commit plan"));
                      } finally {
                        setCommitSubmitting(false);
                      }
                    }}
                    disabled={commitSubmitting}
                  >
                    {commitSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Commit this plan
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Outcome reviews</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {nextReviewDue ? "Review date has passed. Capture what worked and what you learned." : "Add a review when the review date is reached."}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {nextReviewDue && (
                  <>
                    {!showOutcomeReviewModal ? (
                      <Button type="button" onClick={() => setShowOutcomeReviewModal(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Add outcome review
                      </Button>
                    ) : (
                      <div className="border rounded-md p-4 space-y-3 bg-muted/30">
                        <h4 className="font-semibold text-ink">Record what happened in this cycle</h4>
                        <Label>Summary</Label>
                        <Textarea
                          placeholder="Brief summary"
                          value={outcomeReviewForm.summary ?? ""}
                          onChange={(e) => setOutcomeReviewForm((f) => ({ ...f, summary: e.target.value }))}
                          rows={2}
                        />
                        <Label>What worked</Label>
                        <Textarea
                          placeholder="What worked"
                          value={outcomeReviewForm.what_worked ?? ""}
                          onChange={(e) => setOutcomeReviewForm((f) => ({ ...f, what_worked: e.target.value }))}
                          rows={2}
                        />
                        <Label>What did not work</Label>
                        <Textarea
                          placeholder="What did not work"
                          value={outcomeReviewForm.what_did_not_work ?? ""}
                          onChange={(e) => setOutcomeReviewForm((f) => ({ ...f, what_did_not_work: e.target.value }))}
                          rows={2}
                        />
                        <Label>Key learnings</Label>
                        <Textarea
                          placeholder="Key learnings"
                          value={outcomeReviewForm.key_learnings ?? ""}
                          onChange={(e) => setOutcomeReviewForm((f) => ({ ...f, key_learnings: e.target.value }))}
                          rows={2}
                        />
                        <Label>Assumptions validated</Label>
                        <Textarea
                          placeholder="Assumptions validated"
                          value={outcomeReviewForm.assumptions_validated ?? ""}
                          onChange={(e) => setOutcomeReviewForm((f) => ({ ...f, assumptions_validated: e.target.value }))}
                          rows={1}
                        />
                        <Label>Assumptions broken</Label>
                        <Textarea
                          placeholder="Assumptions broken"
                          value={outcomeReviewForm.assumptions_broken ?? ""}
                          onChange={(e) => setOutcomeReviewForm((f) => ({ ...f, assumptions_broken: e.target.value }))}
                          rows={1}
                        />
                        <div>
                          <Label>Readiness impact</Label>
                          <Select
                            value={outcomeReviewForm.readiness_impact ?? "zero"}
                            onValueChange={(v) => setOutcomeReviewForm((f) => ({ ...f, readiness_impact: v }))}
                          >
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minus_one">−1</SelectItem>
                              <SelectItem value="zero">0</SelectItem>
                              <SelectItem value="plus_one">+1</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Main constraint</Label>
                          <Input
                            placeholder="What was the main constraint?"
                            value={outcomeReviewForm.main_constraint ?? ""}
                            onChange={(e) => setOutcomeReviewForm((f) => ({ ...f, main_constraint: e.target.value || undefined }))}
                          />
                        </div>
                        <div>
                          <Label>Next cycle decision</Label>
                          <Select
                            value={outcomeReviewForm.keep_raise_reduce_stop ?? ""}
                            onValueChange={(v) => setOutcomeReviewForm((f) => ({ ...f, keep_raise_reduce_stop: v || undefined }))}
                          >
                            <SelectTrigger className="w-40"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="keep">Keep</SelectItem>
                              <SelectItem value="raise">Raise</SelectItem>
                              <SelectItem value="reduce">Reduce</SelectItem>
                              <SelectItem value="stop">Stop</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" onClick={submitOutcomeReview} disabled={outcomeReviewSubmitting}>
                            {outcomeReviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                            Save review
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setShowOutcomeReviewModal(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {outcomeReviews.length > 0 && (
                  <ul className="space-y-2 text-sm">
                    {outcomeReviews.map((r) => (
                      <li key={r.id} className="border rounded-md p-2">
                        <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                        {r.summary && <p className="mt-1">{r.summary}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <SectionInfo
                  id="exec-responsible-owner"
                  openId={openInfoId}
                  setOpenId={setOpenInfoId}
                  title={<CardTitle className="text-base">Responsible owner</CardTitle>}
                  content="What it's for: The person accountable for moving this decision to execution. Use it: Enter name or email; this is for clarity and handover."
                />
                <p className="text-xs text-muted-foreground">Person accountable for moving this decision to execution.</p>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Name or email"
                  defaultValue={decision.responsible_owner ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim() || null;
                    if (v !== (decision.responsible_owner ?? null)) saveExecution({ responsible_owner: v });
                  }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <SectionInfo
                  id="exec-expected-outcome"
                  openId={openInfoId}
                  setOpenId={setOpenInfoId}
                  title={<CardTitle className="text-base">Expected outcome</CardTitle>}
                  content="What it's for: What success looks like when the decision is implemented. Use it: Describe the outcome in a few lines so the team knows the goal."
                />
                <p className="text-xs text-muted-foreground">What success looks like when this decision is implemented.</p>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe the expected outcome..."
                  rows={3}
                  defaultValue={decision.expected_outcome ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim() || null;
                    if (v !== (decision.expected_outcome ?? null)) saveExecution({ expected_outcome: v });
                  }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <SectionInfo
                  id="exec-db-milestones"
                  openId={openInfoId}
                  setOpenId={setOpenInfoId}
                  title={<CardTitle className="text-base">Execution milestones</CardTitle>}
                  content="What it's for: Optional list of milestones stored in the database (separate from EMR milestones in the artifact). Use it: Add, edit, or mark complete; useful for task-level tracking."
                />
                <p className="text-xs text-muted-foreground">Create, edit, and mark milestones complete.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="New milestone name"
                    value={newMilestoneName}
                    onChange={(e) => setNewMilestoneName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
                  />
                  <Button type="button" size="sm" onClick={handleAddMilestone} disabled={!newMilestoneName.trim()}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
                {milestones.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No milestones yet. Add one above.</p>
                ) : (
                  <ul className="space-y-2">
                    {milestones.map((m) => (
                      <li key={m.id} className="border rounded-md p-3 flex flex-wrap items-center gap-2">
                        {editingMilestoneId === m.id ? (
                          <MilestoneEditRow
                            milestone={m}
                            onSave={(body) => handleUpdateMilestone(m.id, body)}
                            onCancel={() => setEditingMilestoneId(null)}
                          />
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateMilestone(m.id, { status: m.status === "completed" ? "pending" : "completed" })}
                              className="shrink-0"
                              title={m.status === "completed" ? "Mark pending" : "Mark complete"}
                            >
                              {m.status === "completed" ? <Check className="w-5 h-5 text-green-600" /> : <span className="w-5 h-5 rounded border border-muted-foreground/40 inline-block" />}
                            </button>
                            <span className={m.status === "completed" ? "line-through text-muted-foreground" : ""}>{m.milestone_name}</span>
                            {m.responsible_person && <span className="text-xs text-muted-foreground">({m.responsible_person})</span>}
                            {m.due_date && <span className="text-xs text-muted-foreground">{new Date(m.due_date).toLocaleDateString()}</span>}
                            <Button type="button" variant="ghost" size="icon" className="ml-auto" onClick={() => setEditingMilestoneId(m.id)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteMilestone(m.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <SectionInfo
                  id="exec-outcome-reminder"
                  openId={openInfoId}
                  setOpenId={setOpenInfoId}
                  title={<CardTitle className="text-base">Outcome review reminder</CardTitle>}
                  content="What it's for: A simple reminder and free-form notes tied to the decision (stored on the decision record). Use it: Check the box if you want to be reminded; use the notes field for quick outcome notes. For structured reviews, use the Add outcome review form above."
                />
                <p className="text-xs text-muted-foreground">Reminder to review results and log outcome notes.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="outcome-review-reminder"
                    checked={decision.outcome_review_reminder ?? false}
                    onCheckedChange={(checked) => saveExecution({ outcome_review_reminder: !!checked })}
                  />
                  <Label htmlFor="outcome-review-reminder">Remind me to review outcome</Label>
                </div>
                <Textarea
                  placeholder="Outcome review notes (what actually happened, metrics, learnings)..."
                  rows={3}
                  defaultValue={decision.outcome_review_notes ?? ""}
                  onBlur={(e) => {
                    const v = e.target.value.trim() || null;
                    if (v !== (decision.outcome_review_notes ?? null)) saveExecution({ outcome_review_notes: v });
                  }}
                />
              </CardContent>
            </Card>
            {canInvite && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Invite an advisor</CardTitle>
                  <p className="text-xs text-muted-foreground">Add an advisor or capital partner. Advisors get a link to review this decision and leave structured feedback.</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Advisor name</Label>
                      <Input
                        placeholder="Name"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="w-40"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-48"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Invite as</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "advisor" | "capital_partner")}>
                        <SelectTrigger className="w-40"> <SelectValue /> </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="advisor">Advisor</SelectItem>
                          <SelectItem value="capital_partner">Capital partner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {inviteRole === "advisor" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Role (e.g. CFO, board member)</Label>
                        <Input
                          placeholder="e.g. CFO, board member"
                          value={inviteRoleLabel}
                          onChange={(e) => setInviteRoleLabel(e.target.value)}
                          className="w-40"
                        />
                      </div>
                    )}
                    <Button type="button" onClick={handleInvite} disabled={inviteSending}>
                      {inviteSending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Send invite
                    </Button>
                  </div>
                  {inviteRole === "advisor" && (
                    <p className="text-xs text-muted-foreground">They will receive: &quot;You&apos;ve been invited to review a decision in CLEAR. Create your advisor login to see the context and leave a structured review.&quot;</p>
                  )}
                  {inviteUrl && (
                    <p className="text-sm text-muted-foreground">Share this link: <code className="bg-muted px-1 rounded break-all">{inviteUrl}</code></p>
                  )}
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comments</CardTitle>
                <p className="text-xs text-muted-foreground">Advisor and founder can add notes on this decision.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  {comments.map((c) => (
                    <li key={c.id} className="border-l-2 border-muted pl-2">
                      <span className="text-muted-foreground">{c.author_email}</span> · <span className="text-xs text-muted-foreground">{c.created_at ?? ""}</span>
                      <p className="mt-0.5">{c.content}</p>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Your email (optional)"
                    value={commentAuthorEmail}
                    onChange={(e) => setCommentAuthorEmail(e.target.value)}
                    className="max-w-xs"
                  />
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    rows={2}
                  />
                  <Button type="button" size="sm" onClick={handleAddComment} disabled={commentSubmitting || !commentContent.trim()}>
                    {commentSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Add comment
                  </Button>
                </div>
              </CardContent>
            </Card>
            {executionSaving && (
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </p>
            )}
          </TabsContent>
          {decision.enterprise_id != null && (
            <TabsContent value="timeline" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Decisions over time</CardTitle>
                  <p className="text-xs text-muted-foreground">This shows how your decisions and readiness have evolved for this enterprise.</p>
                </CardHeader>
                <CardContent>
                  {timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No other decisions yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {timeline.map((t) => (
                        <li key={t.decision_id} className="flex items-start gap-3 border-b border-border pb-2 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{t.created_at ?? ""} · {t.primary_domain ?? "-"} · {t.readiness_band ?? "-"}{t.has_outcome_review ? " · ✓ Review" : ""}</p>
                            <p className="text-sm truncate">{t.decision_statement ?? "-"}</p>
                          </div>
                          <Link href={`/decisions/${t.decision_id}`} className="text-sm text-primary hover:underline shrink-0">View</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
          <TabsContent value="chat" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI advisor for this decision</CardTitle>
                <p className="text-xs text-muted-foreground">This advisor can see your decision statement, constraints, plan, and milestones.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {chatInitialMessage && (
                  <div className="bg-muted/50 rounded-md p-3 text-sm">
                    <p className="font-medium text-muted-foreground mb-1">Assistant</p>
                    <p className="text-ink whitespace-pre-wrap">{chatInitialMessage}</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={msg.role === "user" ? "text-right" : ""}>
                    <span className="text-xs text-muted-foreground">{msg.role === "user" ? "You" : "Assistant"}</span>
                    <p className={msg.role === "user" ? "text-sm mt-0.5" : "text-sm mt-0.5 bg-muted/50 rounded p-2"}>{msg.content}</p>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about trade-offs, sequencing, or how to execute this plan."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
                    disabled={!chatSessionId || chatSending}
                  />
                  <Button onClick={sendChatMessage} disabled={!chatSessionId || chatSending || !chatInput.trim()}>
                    {chatSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Domain chats: <Link href="/cfo/chat" className="underline">Finance</Link>, <Link href="/cmo/chat" className="underline">Growth</Link>, <Link href="/coo/chat" className="underline">Ops</Link>, <Link href="/cto/chat" className="underline">Tech</Link>.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1.5 border border-amber-200 dark:border-amber-800">
                  Discussing a different business or project? Start a new diagnosis from the sidebar (<strong>New decision</strong>) or the <strong>Start Diagnostic</strong> button so advice stays scoped to that context.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Decision history</CardTitle>
                <p className="text-xs text-muted-foreground">Every version is stored in the ledger so you can see how the decision and plan evolved.</p>
              </CardHeader>
              <CardContent>
                {ledger.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No events yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {ledger.map((ev) => (
                      <li key={ev.event_id} className="flex flex-wrap gap-2 items-center border-b border-border pb-2">
                        <span className="font-mono text-xs">{ev.event_type}</span>
                        {ev.artifact_version != null && <span>v{ev.artifact_version}</span>}
                        {ev.actor_id && <span>{ev.actor_id}</span>}
                        <span className="text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="evidence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What is evidence?</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Evidence is anything that supports or justifies this decision: documents, links to dashboards, reports, meeting notes, or data. Linking evidence makes the decision auditable and helps others understand why it was made.
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><strong>How to add it:</strong> Add at least one piece of evidence: either paste a URL or reference and click Add, or upload a file below. Link and file upload are independent; you can use one or both.</p>
                <p><strong>How it helps:</strong> Evidence ties the decision to verifiable information, improves transparency for reviews and audits, and gives your team clear context when they revisit the decision later.</p>
              </CardContent>
            </Card>
            {evidence.length === 0 && isDraft && (
              <p className="text-amber-600 dark:text-amber-400 text-sm">At least one evidence item (link or uploaded file) is required before you can finalize this decision.</p>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add evidence (link or file)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={newEvidenceType} onValueChange={setNewEvidenceType}>
                      <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="rag_snippet">RAG snippet</SelectItem>
                        <SelectItem value="metric_snapshot">Metric snapshot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 flex-1 min-w-[200px]">
                    <Label className="text-xs">URL or reference</Label>
                    <Input
                      placeholder="https://... or reference id"
                      value={newEvidenceRef}
                      onChange={(e) => setNewEvidenceRef(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <Button type="button" size="sm" onClick={handleAddEvidence} disabled={!newEvidenceRef.trim() || evidenceAdding}>
                    {evidenceAdding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 items-end pt-2 border-t">
                  <div className="space-y-1">
                    <Label className="text-xs">Type (for upload)</Label>
                    <Select value={evidenceUploadType} onValueChange={setEvidenceUploadType}>
                      <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="rag_snippet">RAG snippet</SelectItem>
                        <SelectItem value="metric_snapshot">Metric snapshot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Upload file</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.md,.markdown,text/markdown,.xls,.xlsx,.csv,.txt"
                        className="h-9 max-w-[240px]"
                        disabled={evidenceUploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadEvidence(f);
                          e.target.value = "";
                        }}
                      />
                      {evidenceSelectedFileName && (
                        <span className="text-muted-foreground text-xs">
                          {evidenceUploading ? "Uploading " : "Selected: "}{evidenceSelectedFileName}
                        </span>
                      )}
                    </div>
                  </div>
                  {evidenceUploading && (
                    <span className="text-muted-foreground text-sm flex items-center gap-1">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-2">Accepted: PDF, Word, images (PNG, JPG, GIF, WebP), Markdown, Excel, CSV, TXT. Max 20 MB.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evidence links</CardTitle>
              </CardHeader>
              <CardContent>
                {evidence.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No evidence linked yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {evidence.map((e) => {
                      const uri = (e.source_ref as { uri?: string })?.uri;
                      const isUpload = uri?.includes("/uploads/evidence/");
                      const display = uri ?? (e.source_table && e.source_id ? `${e.source_table}#${e.source_id}` : e.source_table ?? e.source_id ?? "-");
                      return (
                        <li key={e.id} className="flex gap-2 items-center flex-wrap">
                          <Badge variant="outline">{e.evidence_type}</Badge>
                          <span className="min-w-0 truncate">{display}</span>
                          {isUpload && uri && (
                            <a href={getEvidenceFileUrl(uri)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline shrink-0">
                              View / Download
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-muted-foreground text-xs">
          Chat in context: when opening chat from this workspace, tag the session via PUT /api/clear/decisions/{decisionId}/chat-session so conversations stay scoped to this decision.
        </p>
      </div>
    </Shell>
  );
}
