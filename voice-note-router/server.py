"""server.py — phone-friendly voice capture for note_router.

Serves a web page with a record button. The browser records a short voice memo,
uploads it, the server transcribes it locally with faster-whisper, you confirm or
edit the text, and it goes through note_router's classify -> validate -> write
pipeline. Session history is kept in memory so follow-ups ("add eggs too") work.

Run:
    python server.py                  # http://127.0.0.1:8000  (mic works on localhost)
    python server.py --host 0.0.0.0   # reachable on your LAN

Phones only allow microphone access over https (or localhost). The simplest way
to use this from a phone outdoors is a tunnel that gives an https URL, e.g.:
    cloudflared tunnel --url http://localhost:8000

Auth: set NOTE_ROUTER_TOKEN=<secret> to require ?token=<secret> (or an X-Token
header) on every write. Strongly recommended if you expose this beyond localhost.

Env:
    ANTHROPIC_API_KEY   required (used by note_router)
    WHISPER_MODEL       faster-whisper model size, default "small"
                        (tiny | base | small | medium | large-v3)
    WHISPER_LANG        transcription language, default "en"; "auto" to detect
                        (auto-detect misfires on short/accented clips)
    NOTE_ROUTER_TOKEN   optional shared secret for write endpoints
    NOTE_ROUTER_CONFIRM  "1" to ask "yes or no?" before saving (default off;
                        the page has a per-device toggle that overrides this)
"""

from __future__ import annotations

import argparse
import os
import tempfile
import threading
from pathlib import Path

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse

import note_router as nr

STATIC = Path(__file__).with_name("static")
MODEL_SIZE = os.environ.get("WHISPER_MODEL", "small")
# Force the transcription language. Auto-detect ("auto") misfires on short clips
# and accented English, producing wrong-language gibberish. Default: English.
WHISPER_LANG = os.environ.get("WHISPER_LANG", "en")
TOKEN = os.environ.get("NOTE_ROUTER_TOKEN", "")
_EXT = {"audio/webm": ".webm", "audio/ogg": ".ogg", "audio/mp4": ".mp4",
        "audio/mpeg": ".mp3", "audio/wav": ".wav", "audio/x-wav": ".wav"}

app = FastAPI(title="voice note router")

MAX_CLARIFY = 2
CONFIRM_DEFAULT = os.environ.get("NOTE_ROUTER_CONFIRM", "").lower() in {"1", "true", "yes", "on"}
_SPOKEN_STREAM = {"grocery": "groceries", "task": "tasks", "idea": "ideas"}

_model = None
_model_lock = threading.Lock()
_client = None
_history: list[dict] = []
_pending_clarification: dict | None = None  # {"note": str, "rounds": int}
_pending_action: dict | None = None         # {"note": str, "result": dict}


def get_model():
    """Load the faster-whisper model once, on first use."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from faster_whisper import WhisperModel

                print(f"[whisper] loading model {MODEL_SIZE!r} (first run downloads it)...")
                _model = WhisperModel(MODEL_SIZE, device="cpu", compute_type="int8")
                print("[whisper] ready")
    return _model


def get_client():
    global _client
    if _client is None:
        _client = nr.anthropic.Anthropic()
    return _client


def _check_token(request: Request) -> None:
    if not TOKEN:
        return
    supplied = request.query_params.get("token") or request.headers.get("x-token")
    if supplied != TOKEN:
        raise HTTPException(status_code=401, detail="bad or missing token")


def _transcribe(upload: UploadFile) -> str:
    data = upload.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty audio upload")
    suffix = _EXT.get((upload.content_type or "").split(";")[0].strip(), "") \
        or Path(upload.filename or "").suffix or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        path = tmp.name
    try:
        segments, _info = get_model().transcribe(
            path,
            language=None if WHISPER_LANG == "auto" else WHISPER_LANG,
            vad_filter=True,
            temperature=0,
            condition_on_previous_text=False,  # avoids drift / repeated-hallucination loops
        )
        return " ".join(seg.text.strip() for seg in segments).strip()
    finally:
        os.unlink(path)


def _describe_write(stream: str, entry: dict | None, result: dict) -> str:
    fname = nr.STREAM_FILES[stream]
    if stream == "grocery" and entry is not None:
        bits = []
        if entry.get("added"):
            bits.append("added " + ", ".join(entry["added"]))
        if entry.get("already"):
            bits.append("already had " + ", ".join(entry["already"]))
        return f"{fname}: " + ("; ".join(bits) if bits else "no change")
    if stream == "task":
        if entry is None:
            return f"{fname}: updated existing task"
        return f'{fname}: added "{entry.get("line", result["content"])}"'
    return f'{fname}: added "{result["content"]}"'


def _confirm_question(result: dict) -> str:
    target = {"grocery": "the grocery list", "task": "your tasks",
              "idea": "your ideas"}[result["stream"]]
    due = f" due {result['due']}" if result["stream"] == "task" and result.get("due") else ""
    also = ""
    if result.get("dropped_intent"):
        also = f' (and "{result["dropped_intent"]}" too)'
    return f'Add "{result["content"]}"{due} to {target}{also}? Say yes or no.'


def _apply(note_text: str, result: dict, parts: list[str], spoken: list[str]) -> None:
    """Write one classified result; append a log line and a spoken fragment."""
    entry = nr.act_on(note_text, result, _history)
    if entry is not None:
        _history.append(entry)
        del _history[:-nr.HISTORY_SIZE]
    parts.append(_describe_write(result["stream"], entry, result))

    where = _SPOKEN_STREAM[result["stream"]]
    content = result["content"]
    if result["stream"] == "grocery" and entry is not None and not entry.get("added"):
        spoken.append(f"{content} was already on {where}")
    elif result["stream"] == "task" and entry is None:
        spoken.append(f"updated {content} in {where}")
    else:
        spoken.append(f"{content} to {where}")


def _commit(note_text: str, result: dict, base: dict) -> dict:
    """Write the result and chain any dropped second intent."""
    parts: list[str] = []
    spoken: list[str] = []
    _apply(note_text, result, parts, spoken)

    dropped = result.get("dropped_intent")
    depth = 0
    while dropped and depth < 3:
        sub = nr.route_note(dropped, get_client(), _history)
        if sub is None or sub["stream"] not in nr.ALLOWED_STREAMS:
            parts.append(f'(couldn\'t file "{dropped}")')
            spoken.append(f'but I could not file "{dropped}"')
            break
        _apply(dropped, sub, parts, spoken)
        dropped = sub.get("dropped_intent")
        depth += 1

    return {**base, "awaiting": None,
            "message": "  ·  ".join(p for p in parts if p),
            "speak": "Added " + ", and ".join(spoken) + "." if spoken else "Done."}


def _handle_note(note_text: str, confirm: bool) -> dict:
    """One conversational turn: fold in a pending clarification, route, then
    ask / confirm / write depending on the outcome."""
    global _pending_clarification, _pending_action

    note_text = (note_text or "").strip()
    if not note_text:
        return {"ok": False, "message": "Empty note.", "speak": "I didn't catch that.",
                "awaiting": "clarification" if _pending_clarification else None}

    rounds = 0
    if _pending_clarification:
        note_text = f'{_pending_clarification["note"]} — {note_text}'
        rounds = _pending_clarification["rounds"]
        _pending_clarification = None

    result = nr.route_note(note_text, get_client(), _history)
    if result is None:
        return {"ok": False, "note": note_text, "awaiting": None,
                "message": "Couldn't classify after retries.",
                "speak": "Sorry, I couldn't work that out."}

    stream = result["stream"]
    base = {"ok": True, "note": note_text, "stream": stream,
            "content": result.get("content"), "due": result.get("due"),
            "dropped_intent": result.get("dropped_intent")}

    if stream in ("unresolved_reference", "unclassifiable"):
        if rounds >= MAX_CLARIFY:
            return {**base, "awaiting": None,
                    "message": "Still not sure — start over.",
                    "speak": "Still not sure. Let's start over."}
        if stream == "unresolved_reference":
            ref = nr._reference_word(note_text)
            question = (f"What did you mean by '{ref}'?" if ref
                        else "What were you referring to?")
        else:
            question = "I didn't get that as a note. Say it another way."
        _pending_clarification = {"note": note_text, "rounds": rounds + 1}
        return {**base, "awaiting": "clarification", "message": question, "speak": question}

    if confirm:
        _pending_action = {"note": note_text, "result": result}
        question = _confirm_question(result)
        return {**base, "awaiting": "confirmation", "message": question, "speak": question}

    return _commit(note_text, result, base)


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


def _confirm_wanted(request: Request) -> bool:
    q = request.query_params.get("confirm")
    if q is not None:
        return q.lower() in {"1", "true", "yes", "on"}
    return CONFIRM_DEFAULT


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_SIZE, "history": len(_history),
            "auth_required": bool(TOKEN),
            "awaiting": "confirmation" if _pending_action
            else "clarification" if _pending_clarification else None}


@app.post("/transcribe")
def transcribe(request: Request, audio: UploadFile = File(...)):
    _check_token(request)
    return {"transcript": _transcribe(audio)}


@app.post("/note")
def note_audio(request: Request, audio: UploadFile = File(...)):
    _check_token(request)
    text = _transcribe(audio)
    out = _handle_note(text, _confirm_wanted(request))
    out["transcript"] = text
    return out


@app.post("/note-text")
def note_text(request: Request, text: str = Form(...)):
    _check_token(request)
    return _handle_note(text, _confirm_wanted(request))


@app.post("/commit")
def commit(request: Request, decision: str = Form(...)):
    _check_token(request)
    global _pending_action
    if not _pending_action:
        return {"ok": False, "awaiting": None,
                "message": "Nothing to confirm.", "speak": "There's nothing to confirm."}
    pending, _pending_action = _pending_action, None
    yes = decision.strip().lower().startswith(("y", "sure", "ok", "yeah", "yep", "go"))
    if not yes:
        return {"ok": True, "awaiting": None,
                "message": "Discarded.", "speak": "Okay, I won't save that."}
    result = pending["result"]
    base = {"ok": True, "note": pending["note"], "stream": result["stream"],
            "content": result.get("content"), "due": result.get("due"),
            "dropped_intent": result.get("dropped_intent")}
    return _commit(pending["note"], result, base)


@app.post("/reset")
def reset(request: Request):
    _check_token(request)
    global _pending_clarification, _pending_action
    _pending_clarification = _pending_action = None
    _history.clear()
    return {"ok": True, "awaiting": None, "message": "Reset.", "speak": "Starting fresh."}


@app.get("/lists")
def lists():
    out: dict[str, list[str]] = {}
    for key, fname in nr.STREAM_FILES.items():
        path = nr._stream_path(fname)
        out[key] = (
            [ln for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
            if path.exists() else []
        )
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--preload", action="store_true",
                        help="load the whisper model at startup instead of on first request")
    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY is not set. See .env.example.")
        return 1
    if args.preload:
        get_model()

    print(f"voice note router on http://{args.host}:{args.port}  (model={MODEL_SIZE}, "
          f"auth={'on' if TOKEN else 'off'})")
    uvicorn.run(app, host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
