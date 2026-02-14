# Voice Input: Why It Exists, How It Works, Why It Fails, and Alternatives

## Why we want the speech option

The goal is **to let users speak instead of typing**, then have that speech **converted to text** so they can **review or edit before submitting**. The main benefit is **feeling like they’re talking to someone** so they can **express themselves more naturally** and share context (e.g. in diagnostics or chat) without the friction of writing.

- **Primary use:** Speak → text appears in the field → user can edit or submit. Feels conversational; lowers barrier to sharing.
- **Other uses:** Accessibility (e.g. motor or typing difficulty), mobile/on-the-go input, longer free-form answers without typing.

So the product need is: **reliable “speak and see it as text, then use or edit it.”**

---

## How it works today (Wispr Flow)

End-to-end flow:

1. **Browser**
   - User clicks the mic (e.g. in diagnostic “describe in your own words” or in chat).
   - `VoiceInputButton` starts `VoiceRecorder`:
     - `navigator.mediaDevices.getUserMedia({ audio: true })` → microphone stream.
     - Web Audio API records to 16 kHz mono WAV, then base64.
   - User clicks stop; if recording &lt; 0.5 s, user sees “Recording too short…”; otherwise the app calls the backend.

2. **Frontend → Backend**
   - `transcribeAudio()` in `frontend/src/lib/api.ts` sends:
     - `POST /api/transcribe` to the backend (base URL from `NEXT_PUBLIC_API_URL` or `http://localhost:8000`).
     - Body: `{ audio: base64Wav, language: ["en"], before_text, after_text }`.

3. **Backend**
   - `backend/app/routes/transcribe_routes.py`:
     - If `WISPR_API_KEY` is not set → **503** with “Voice input is not configured…” (user sees “not set up on this server”).
     - Otherwise it forwards to **Wispr Flow**:
       - URL: `WISPR_API_URL` (default `https://platform-api.wisprflow.ai/api/v1/dash/api`).
       - Headers: `Authorization: Bearer <WISPR_API_KEY>`.
       - Body: `{ audio, language, context: { textbox_contents: { before_text, selected_text, after_text }, app: { type: "ai" } } }`.
     - If Wispr returns non-200 → backend returns **502** with Wispr’s response body as `detail`.
     - If the **request to Wispr throws** (network, timeout, etc.) → no `try/except` today, so FastAPI returns **500** and the frontend often shows the generic “Voice input failed. You can type instead.”

4. **Frontend error handling**
   - 503 or response detail containing “not configured” / “WISPR_API_KEY” → “Voice input is not set up on this server…”
   - 502 with non-empty `detail` → “Voice input failed: &lt;short detail&gt;”
   - Anything else (502 with empty detail, 500, network error, etc.) → **“Voice input failed. You can type instead.”** (the message you see)

So the **generic message** usually means one of:

- Backend got **500** (e.g. exception calling Wispr: timeout, connection error, DNS).
- Backend got **502** but `detail` was empty or not passed through to the client.
- Frontend never got a proper `response` (e.g. network/CORS to backend), so it falls into the generic branch.

---

## What is needed for this to work (with Wispr)

For the **current Wispr-based** flow to work, all of the following must be true:

| Layer | Requirement |
|-------|-------------|
| **Browser** | Microphone permission granted; HTTPS (or localhost) for `getUserMedia`. |
| **Frontend** | Correct `NEXT_PUBLIC_API_URL` so `POST /api/transcribe` hits your backend. |
| **Backend** | Server running and reachable; CORS allows the frontend origin. |
| **Config** | `WISPR_API_KEY` set in backend env (you have this in `.env`). |
| **Wispr** | Key valid and allowed for the Flow API; account in good standing; backend can reach `https://platform-api.wisprflow.ai`. |
| **API shape** | Payload matches Wispr’s REST API (audio base64 16 kHz WAV, optional language + context). Our payload matches their docs. |

So **even without changing away from Wispr**, the failure is likely one of:

1. **Wispr API key** – Invalid, expired, or not enabled for the REST transcribe endpoint (e.g. “Flow API access is exclusive and requires organization approval” per their docs).
2. **Backend → Wispr network** – Timeout, connection refused, or DNS failure when the backend calls Wispr (no `try/except` today, so this becomes a 500 and you see the generic message).
3. **Backend not reachable** – Wrong `NEXT_PUBLIC_API_URL` or backend down, so the frontend fails before getting a clear 503/502.

---

## If not Wispr Flow: alternatives

To keep the **same product behavior** (speak → text → edit/submit) without depending on Wispr, you can switch the “speech → text” part to something else.

### 1. Web Speech API (browser built-in)

- **What:** `SpeechRecognition` in the browser; no backend, no API key.
- **Pros:** Free, no server, low latency, works in Chrome/Edge/Safari (and some others).
- **Cons:** Not in all browsers (e.g. Firefox has limited or no support); quality and language support vary; no “AI-style” formatting like Wispr.
- **Use case:** Good fallback or primary option if you’re okay with “best-effort” transcription and browser support limits.

### 2. Other cloud STT APIs (replace Wispr only)

Same flow (browser records → backend receives audio → backend calls STT API → returns text), but swap Wispr for e.g.:

- **OpenAI Whisper** – Backend calls OpenAI’s Whisper API (or self-hosted Whisper). You already use OpenAI; one more key.
- **Deepgram** – STT-focused; good accuracy and latency; pay-per-use.
- **AssemblyAI** – Similar; REST API; good for longer audio.
- **Google Cloud Speech-to-Text** – Strong accuracy and languages; GCP account and setup.

You’d keep:

- `VoiceRecorder` and 16 kHz WAV (or adapt to the chosen API’s format).
- `POST /api/transcribe` and the same frontend contract; only the backend implementation of “audio in → text out” changes.

### 3. Hybrid

- **Primary:** Web Speech API when available (no key, fast).
- **Fallback:** Backend STT (Wispr or another provider) when Web Speech isn’t available or fails.

This keeps “speak → text → edit” and reduces dependency on a single provider.

---

## Recommended next steps

1. **See the real error**
   - Add a `try/except` in the backend around the Wispr `httpx` call; on exception return **502** with a short, safe `detail` (e.g. “Wispr API unreachable: timeout” or “connection error”).
   - Ensure the frontend shows `response.data.detail` for 502 (and optionally for 500) so you don’t only see “Voice input failed. You can type instead.”

2. **Confirm Wispr**
   - Check Wispr dashboard / email for key status and whether REST/Flow access is enabled.
   - From the backend host, run a minimal `POST` to Wispr with the same key and a tiny base64 WAV to see the raw status and body.

3. **Choose a direction**
   - If Wispr is required and the key/network are fixed → keep current design and rely on better error messages.
   - If you want to reduce dependency or cost → add **Web Speech API** as primary or fallback, and/or **replace Wispr with another STT** (e.g. OpenAI Whisper or Deepgram) behind the same `/api/transcribe` contract.

Once you have the actual error from (1) and (2), you can either fix Wispr or implement one of the alternatives above and keep the same user-facing behavior: speak → text → edit → submit.
