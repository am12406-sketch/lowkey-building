# Voice Note Router

Speak a thought — it gets classified and routed automatically. "Grab milk on the way home" lands in your grocery list. "Call the landlord before Friday" becomes a task with a due date. "What if the app synced across devices" gets saved as an idea. No manual sorting.

**Full build story, including the real bugs and how they were found and fixed → [BUILD_LOG.md](./BUILD_LOG.md)**

## What it does

- Classifies free-text (or spoken) notes into `grocery`, `task`, or `idea`
- Extracts due dates from natural phrasing ("by Friday," "in three weeks," "end of month")
- Writes to real local files, with duplicate detection that understands quantity ("eggs" vs "a dozen eggs" are the same item)
- Keeps short-term memory across a session, so "add that too" or "make that next Tuesday" resolves correctly against recent notes — and honestly flags it when it *can't* resolve a reference, instead of guessing
- Handles compound sentences ("grab milk and call the dentist") by splitting them into separate correctly-classified entries
- Real voice input: a phone-accessible page records audio, transcribes it locally (faster-whisper), and routes it through the same pipeline as typed text
- `list` and `undo` commands for actually using it day to day

## Why this exists

Most "voice note → structured list" demos stop at the happy path. This one is built around the opposite assumption: a model will confidently produce well-formed, wrong output, and the only way to catch that is to define correctness in advance and test against it — including the cases you expect to break something.

## Architecture

```
note_router.py   — core classification, validation, memory, dedup, file writes
run_evals.py     — 24-case eval suite (deterministic assertions, not vibes)
server.py        — FastAPI server for voice input from a phone
static/index.html — mobile recording page
```

**The model (Claude) only ever reads text and returns text.** It never touches a file directly. `note_router.py` is what validates Claude's response and decides what actually happens — this separation is deliberate and explained in the build log.

## Running it

**Text input (CLI):**
```bash
python note_router.py
```
Type notes one at a time. Type `exit` to quit, `list` to see current lists, `undo` to remove the last entry.

**Voice input (from your phone):**
```bash
python server.py --preload
```
Requires an HTTPS tunnel (e.g. `cloudflared tunnel --url http://localhost:8000`) since phone browsers block microphone access over plain HTTP. See build log for full setup and why.

**Run the eval suite:**
```bash
python run_evals.py
```

## Setup

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
$env:ANTHROPIC_API_KEY = "your-key-here"
```

Get a key at [console.anthropic.com](https://console.anthropic.com). Voice input additionally requires `faster-whisper` (installed via requirements.txt) — no external API key needed, transcription runs locally.

## What's real vs. what's next

**Working, tested, in use:** everything above.

**Deliberately not built:** multiple agents that negotiate/disagree with each other. This project is a single-agent classification task; that idea needs a project with genuinely conflicting objectives to be worth building, which is a separate project.

**Known limitation:** voice input currently requires the host laptop to stay on and running, plus an active tunnel. Works from anywhere with cellular data once the tunnel is up — it's an availability constraint, not a range constraint.
