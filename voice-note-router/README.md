# Voice Note Router

Speak a thought and it gets classified and routed automatically. "Grab milk on the way home" lands in the grocery list. "Call the landlord before Friday" becomes a task with a due date. "What if the app synced across devices" gets saved as an idea.

**Full build story, including the bugs an eval suite actually caught: [BUILD_LOG.md](./BUILD_LOG.md)**

## What it does

- Classifies free-text or spoken notes into `grocery`, `task`, or `idea`
- Extracts due dates from natural phrasing ("by Friday," "in three weeks," "end of month")
- Deduplicates grocery items by content, not exact string: "eggs" and "a dozen eggs" are the same item
- Resolves references against recent notes ("add that too," "make that next Tuesday"), and returns an explicit unresolved state instead of guessing when a reference doesn't have a clear match
- Splits compound sentences ("grab milk and call the dentist") into separate, correctly-classified entries
- Voice input: a phone-facing page records audio, transcribes it locally with faster-whisper, and routes it through the same pipeline as typed input
- `list` and `undo` for actual daily use, not just single-shot demos

## Why this exists

Most voice-note-to-structured-list demos stop at the happy path. This one is built around the opposite assumption: an LLM will produce confident, well-formed, wrong output, and the only way to catch that is to define correctness in advance and test against it, including cases designed to break something.

## Architecture

```
note_router.py     : classification, validation, memory, dedup, file writes
run_evals.py       : 24-case eval suite, deterministic assertions
server.py          : FastAPI server for voice input
static/index.html  : mobile recording page
```

Claude only reads text and returns text; it never touches a file. `note_router.py` validates every response and decides what happens next. Every bug documented in the build log comes from a gap between what Claude said and what the code checked.

## Running it

**CLI:**
```bash
python note_router.py
```
`exit` to quit, `list` to view current lists, `undo` to remove the last entry.

**Voice, from a phone:**
```bash
python server.py --preload
```
Needs an HTTPS tunnel (`cloudflared tunnel --url http://localhost:8000`), since phone browsers refuse mic access over plain HTTP. Setup and reasoning in the build log.

**Eval suite:**
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

Key from [console.anthropic.com](https://console.anthropic.com). Voice transcription runs locally via `faster-whisper`, no separate API key needed.

## Status

Working and in daily use: everything listed above.

Not built: multi-agent negotiation. This is a single-agent classification task, and that pattern belongs to a project with actual conflicting objectives, not this one.

**Constraints:** voice input needs the host machine and tunnel running continuously; the tunnel URL changes on every restart without a paid, named tunnel; output lives in local text files, not a shared list app.
