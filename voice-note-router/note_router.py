"""note_router.py — interactive voice-note router backed by Claude.

Runs an interactive session: type a voice note, Claude classifies it into
exactly one of {grocery, task, idea} and extracts cleaned structured content;
the reply is validated (retrying with feedback on failure) and then written to
the stream's file. The last few notes are kept in memory and passed back to
Claude as context so it can resolve follow-ups like "add tomatoes too" or
"same thing for Thursday".

Commands at the prompt: list [grocery|task|idea] · undo · help · exit

Usage:
    python note_router.py
"""

from __future__ import annotations

import copy
import json
import os
import re
import time
from pathlib import Path

import anthropic

MODEL = "claude-opus-5"
MAX_ATTEMPTS = 3
HISTORY_SIZE = 5
ALLOWED_STREAMS = ["grocery", "task", "idea"]
NON_CLASSIFYING = {"unresolved_reference", "unclassifiable"}

SYSTEM = (
    "You classify a raw voice note into exactly one processing stream and extract "
    "clean, structured content for that stream.\n\n"
    f"Allowed streams (pick exactly one): {', '.join(ALLOWED_STREAMS)}\n"
    "  - grocery: items to buy. content = a tidy comma-separated item list, e.g. \"milk, eggs\".\n"
    "  - task: something to do, including time-anchored nudges. content = a short imperative "
    "phrase, e.g. \"email Sam the report\".\n"
    "  - idea: a thought worth keeping. content = the idea stated concisely.\n\n"
    "Rules for content: strip filler like \"grab\", \"on the way home\", \"remember to\". "
    "Do NOT return the raw sentence verbatim — clean it up.\n\n"
    "You may be given RECENT NOTES from this session. Use them only to resolve references in "
    "the NEW NOTE — e.g. \"add tomatoes too\" after a grocery note means stream=grocery with "
    "content=\"tomatoes\"; \"same thing for Thursday\" after a task means repeat that task with "
    "due=\"Thursday\". Classify the NEW NOTE only; do not re-emit earlier notes.\n\n"
    "Two non-classifying outcomes exist. Use them instead of guessing:\n"
    "  - unresolved_reference: the note hinges on a reference (\"that\", \"it\", \"those\", "
    "\"the same\") that you cannot confidently match to RECENT NOTES. "
    'Return {"stream": "unresolved_reference", "content": null}.\n'
    "  - unclassifiable: the input is not a recognizable note at all — gibberish, random "
    'characters, empty. Return {"stream": "unclassifiable", "content": null}.\n\n'
    "If stream is \"task\", also include a \"due\" field: a short date/time string extracted "
    "from the note (e.g. \"before Friday\", \"3pm\", \"tomorrow morning\") if one is mentioned, "
    "otherwise null. Always include \"due\" for tasks, even when null. Omit \"due\" for "
    "grocery and idea.\n\n"
    "Compound notes: if the note contains more than one distinct intent (e.g. "
    '"grab milk and also call the dentist"), classify and return the single dominant intent '
    'as normal, and put the OTHER part — the words for the intent you did not classify — in '
    'a "dropped_intent" field. If the note has only one intent, set "dropped_intent" to null. '
    'A grocery list of several items ("milk, eggs, bread") is ONE intent — dropped_intent is '
    "null. Always include the \"dropped_intent\" key for grocery, task and idea results.\n\n"
    "Respond with a single JSON object and NOTHING else — no prose, no markdown, no code fences.\n"
    'Shape: {"stream": <grocery|task|idea|unresolved_reference|unclassifiable>, "content": '
    '<string, or null for the two non-classifying outcomes>, "due": <string or null, tasks '
    'only>, "dropped_intent": <string or null; omit for the two non-classifying outcomes>}'
)


def _normalize(text: str) -> str:
    """Lowercase, drop edge punctuation, collapse whitespace — for copy detection."""
    text = text.strip().lower().strip(".,;:!?-—")
    return re.sub(r"\s+", " ", text)


def validate(raw_reply: str, note: str) -> tuple[dict | None, list[tuple[bool, str]]]:
    """Return (parsed_or_None, [(passed, message), ...])."""
    checks: list[tuple[bool, str]] = []

    try:
        parsed = json.loads(raw_reply)
        checks.append((True, "response is valid JSON"))
    except json.JSONDecodeError as exc:
        checks.append((False, f"response is not valid JSON ({exc.msg} at pos {exc.pos})"))
        return None, checks

    if not isinstance(parsed, dict):
        checks.append((False, f"JSON must be an object, got {type(parsed).__name__}"))
        return None, checks

    # These are valid terminal outcomes, not errors — the model is telling us it
    # will not classify. Require content to be null and stop here (no retry).
    if parsed.get("stream") in NON_CLASSIFYING:
        content_null = parsed.get("content", "missing") is None
        checks.append((content_null,
                       f'stream is "{parsed["stream"]}" so content must be null '
                       f"(got {parsed.get('content', 'missing')!r})"))
        return parsed, checks

    has_stream = "stream" in parsed
    has_content = "content" in parsed
    checks.append((has_stream and has_content,
                   f"both fields present (stream={has_stream}, content={has_content})"))

    stream_ok = parsed.get("stream") in ALLOWED_STREAMS
    checks.append((stream_ok,
                   f'stream is exactly one of {ALLOWED_STREAMS} (got {parsed.get("stream")!r})'))

    content = parsed.get("content")
    if not isinstance(content, str) or not content.strip():
        checks.append((False, f"content must be a non-empty string (got {content!r})"))
    else:
        not_copy = _normalize(content) != _normalize(note)
        checks.append((not_copy,
                       "content is cleaned up, not a copy of the raw input"
                       if not_copy else
                       f"content is just a copy of the raw input ({content!r})"))

    if parsed.get("stream") == "task":
        has_due = "due" in parsed
        due_val = parsed.get("due")
        due_type_ok = due_val is None or (isinstance(due_val, str) and due_val.strip() != "")
        checks.append((has_due and due_type_ok,
                       f'stream is "task" so "due" must be present as a string or null '
                       f"(present={has_due}, value={due_val!r})"))

    has_dropped = "dropped_intent" in parsed
    dropped_val = parsed.get("dropped_intent")
    dropped_ok = dropped_val is None or (isinstance(dropped_val, str) and dropped_val.strip() != "")
    checks.append((has_dropped and dropped_ok,
                   '"dropped_intent" must be present as a string or null '
                   f"(present={has_dropped}, value={dropped_val!r})"))

    return parsed, checks


def feedback_message(note: str, checks: list[tuple[bool, str]]) -> str:
    failures = [msg for passed, msg in checks if not passed]
    bullets = "\n".join(f"- {msg}" for msg in failures)
    return (
        "Your previous response failed validation for these reasons:\n"
        f"{bullets}\n\n"
        f"Original voice note: {note!r}\n"
        "Return a corrected response: a single JSON object only, no markdown, no code "
        f'fences, no prose. Shape: {{"stream": <one of {ALLOWED_STREAMS}>, "content": <cleaned '
        'string>, "due": <string or null — required when stream is "task", omit otherwise>, '
        '"dropped_intent": <string or null — the unclassified second intent, or null>}'
    )


def format_history(history: list[dict]) -> str:
    """One line per remembered note: [stream] content (due: ...)  <- "raw note"."""
    if not history:
        return "(none)"
    lines = []
    for h in history:
        content = h["content"]
        if h["stream"] == "task" and h.get("due"):
            content = f'{content} (due: {h["due"]})'
        lines.append(f'[{h["stream"]}] {content}  <- "{h["note"]}"')
    return "\n".join(lines)


def route_note(
    note: str, client: anthropic.Anthropic, history: list[dict] | None = None
) -> dict | None:
    history = history or []
    context = format_history(history)

    print("--- History used for context ---")
    print("\n".join(f"  {line}" for line in context.splitlines()))

    first_message = f"RECENT NOTES (most recent last):\n{context}\n\nNEW NOTE: {note}"
    messages: list[dict] = [{"role": "user", "content": first_message}]

    for attempt in range(1, MAX_ATTEMPTS + 1):
        print(f"\n{'=' * 12} Attempt {attempt}/{MAX_ATTEMPTS} {'=' * 12}")
        print("--- Sent to Claude ---")
        print(messages[-1]["content"])

        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=512,
                system=SYSTEM,
                messages=messages,
            )
        except anthropic.APIError as exc:
            print("--- API error ---")
            print(f"  {exc}")
            if attempt < MAX_ATTEMPTS:
                print("  retrying (same request)...")
                time.sleep(2 * attempt)
            continue

        raw_reply = "".join(b.text for b in response.content if b.type == "text").strip()

        print("--- Received from Claude ---")
        print(raw_reply or "(empty response)")

        parsed, checks = validate(raw_reply, note)
        print("--- Validation ---")
        for passed, msg in checks:
            print(f"  [{'PASS' if passed else 'FAIL'}] {msg}")

        if parsed is not None and all(passed for passed, _ in checks):
            print(f"\n[OK] Passed on attempt {attempt}.")
            return parsed

        if attempt < MAX_ATTEMPTS:
            messages.append({"role": "assistant", "content": raw_reply})
            messages.append({"role": "user", "content": feedback_message(note, checks)})

    print(f"\n[FAILED] Gave up after {MAX_ATTEMPTS} attempts.")
    return None


STREAM_FILES = {
    "grocery": "groceries.txt",
    "task": "tasks.txt",
    "idea": "ideas.txt",
}

# Directory the stream files live in. Overridable (e.g. by run_evals.py) so tests
# can point writes at a temp directory instead of the real files.
OUTPUT_DIR = Path(__file__).resolve().parent


def _stream_path(filename: str) -> Path:
    return OUTPUT_DIR / filename


def _dedup_key(text: str) -> str:
    """Case-insensitive, whitespace-collapsed key for duplicate detection."""
    return re.sub(r"\s+", " ", text.strip()).lower()


# Quantity words/units stripped before comparing grocery items, so "eggs" and
# "a dozen eggs" dedupe to the same key. The written line keeps its full phrasing.
_QTY_WORDS = {
    "a", "an", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "eleven", "twelve", "dozen", "half", "couple", "few", "some",
    "several", "bunch", "pack", "packet", "bag", "box", "carton", "bottle", "can",
    "jar", "loaf", "tub", "stick", "head", "clove", "piece", "pieces", "of",
    "lb", "lbs", "pound", "pounds", "kg", "kgs", "g", "gram", "grams", "oz",
    "ounce", "ounces", "ml", "l", "litre", "litres", "liter", "liters",
    "gallon", "gallons", "quart", "quarts", "pint", "pints",
}


def _grocery_key(text: str) -> str:
    """Dedup key for a grocery item with quantity words removed.

    "a dozen eggs", "12 eggs", "eggs (1 dozen)" -> "egg"; "eggs" -> "egg".
    Falls back to the plain dedup key if stripping leaves nothing.
    """
    base = re.sub(r"\(.*?\)", " ", text.lower())          # drop parentheticals
    words = [
        w for w in re.findall(r"[a-z]+", base)
        if w not in _QTY_WORDS                            # drop quantity words
    ]
    key = " ".join(words).strip()
    if key.endswith("s") and not key.endswith("ss") and len(key) > 3:
        key = key[:-1]                                     # naive singularise
    return key or _dedup_key(text)


def _existing_keys(path: Path) -> set[str]:
    """Dedup keys for every non-blank line already in the file."""
    path.touch(exist_ok=True)
    return {
        _dedup_key(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    }


def _append_exact_line(filename: str, line: str) -> None:
    """Append a whole line unless it already exists (case-insensitive, ws-collapsed)."""
    path = _stream_path(filename)
    if _dedup_key(line) in _existing_keys(path):
        print(f"  Already in {path.name}: {line}")
        return
    with path.open("a", encoding="utf-8") as f:
        f.write(line + "\n")
    print(f"  wrote to {path.name}: {line}")


def _replace_line(filename: str, old_line: str, new_line: str) -> bool:
    """Replace the first line matching old_line (case-insensitive, ws-collapsed). True if done."""
    path = _stream_path(filename)
    if not path.exists():
        return False
    lines = path.read_text(encoding="utf-8").splitlines()
    target = _dedup_key(old_line)
    for i, line in enumerate(lines):
        if _dedup_key(line) == target:
            lines[i] = new_line
            path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            return True
    return False


def _task_line(content: str, due: str | None) -> str:
    return f"{content} (due: {due})" if due else content


def _append_grocery_items(items: list[str]) -> tuple[list[str], list[str]]:
    """Check each grocery item separately against groceries.txt; append only new ones.

    Returns (added, already) — the items written and the items skipped as duplicates.
    """
    path = _stream_path(STREAM_FILES["grocery"])
    path.touch(exist_ok=True)
    existing = {
        _grocery_key(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    }

    added: list[str] = []
    already: list[str] = []
    for item in items:
        key = _grocery_key(item)
        if key in existing:
            already.append(item)
        else:
            added.append(item)
            existing.add(key)  # also dedupes repeats within this one note

    if added:
        with path.open("a", encoding="utf-8") as f:
            for item in added:
                f.write(item + "\n")

    if added:
        print(f"  Added to {path.name}: {', '.join(added)}")
    if already:
        print(f"  Already in {path.name}: {', '.join(already)}")

    return added, already


def act_on(note: str, result: dict, history: list[dict]) -> dict | None:
    """Perform the file write for a validated result.

    Returns a history entry to append, or None when it updated an existing
    in-session task line in place (that task's history entry is mutated instead).
    """
    stream = result["stream"]
    content = result["content"]
    entry = {"note": note, "stream": stream, "content": content, "due": result.get("due")}

    print("\n--- Action ---")
    if stream == "grocery":
        items = [item.strip() for item in content.split(",") if item.strip()]
        entry["added"], entry["already"] = _append_grocery_items(items)
        return entry

    if stream == "task":
        due = result.get("due")
        new_line = _task_line(content, due)
        prior = next(
            (h for h in history
             if h["stream"] == "task" and _dedup_key(h["content"]) == _dedup_key(content)),
            None,
        )
        if prior is not None and prior.get("line"):
            if prior["line"] == new_line:
                print(f"  Already in {STREAM_FILES['task']}: {new_line}")
            elif _replace_line(STREAM_FILES["task"], prior["line"], new_line):
                print(f"  updated in {STREAM_FILES['task']}: {prior['line']}  ->  {new_line}")
            else:
                print(f"  (prior line not found; appending) ", end="")
                _append_exact_line(STREAM_FILES["task"], new_line)
            prior["content"] = content
            prior["due"] = due
            prior["line"] = new_line
            return None  # updated existing entry in place

        _append_exact_line(STREAM_FILES["task"], new_line)
        entry["line"] = new_line
        return entry

    # idea
    _append_exact_line(STREAM_FILES["idea"], content)
    return entry


REFERENCE_WORDS = ["that", "it", "those", "them", "this", "these", "same"]


def _reference_word(note: str) -> str | None:
    for word in re.findall(r"[a-z]+", note.lower()):
        if word in REFERENCE_WORDS:
            return word
    return None


def _snapshot_files() -> dict[str, str | None]:
    """Current text of every stream file (None when the file does not exist)."""
    snap: dict[str, str | None] = {}
    for name in STREAM_FILES.values():
        path = _stream_path(name)
        snap[name] = path.read_text(encoding="utf-8") if path.exists() else None
    return snap


def _restore_files(snap: dict[str, str | None]) -> None:
    for name, text in snap.items():
        path = _stream_path(name)
        if text is None:
            path.unlink(missing_ok=True)
        else:
            path.write_text(text, encoding="utf-8")


def print_lists(which: str | None = None) -> None:
    """Print the contents of one stream file, or all three."""
    names = [which] if which in STREAM_FILES else list(STREAM_FILES)
    for key in names:
        path = _stream_path(STREAM_FILES[key])
        lines = (
            [ln for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
            if path.exists()
            else []
        )
        print(f"\n== {STREAM_FILES[key]} ({len(lines)}) ==")
        for i, line in enumerate(lines, 1):
            print(f"  {i}. {line}")
        if not lines:
            print("  (empty)")


HELP = "Commands: list [grocery|task|idea] · undo · help · exit"


def main() -> int:
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY is not set. See .env.example.")
        return 1

    client = anthropic.Anthropic()
    history: list[dict] = []
    undo_stack: list[tuple[str, dict[str, str | None], list[dict]]] = []
    pending: str | None = None

    print(f"Voice-note router. {HELP}")
    while True:
        if pending is not None:
            note, pending = pending, None
            print(f"\nnote> {note}")
        else:
            try:
                note = input("\nnote> ").lstrip("﻿").strip()
            except EOFError:
                break

        if not note:
            continue

        low = note.lower()
        parts = low.split()
        if low in {"exit", "quit"}:
            break
        if low == "help":
            print(HELP)
            continue
        if parts[0] == "list" and (len(parts) == 1 or parts[1] in STREAM_FILES):
            print_lists(parts[1] if len(parts) == 2 else None)
            continue
        if low == "undo":
            if not undo_stack:
                print("Nothing to undo.")
            else:
                label, files_snap, hist_snap = undo_stack.pop()
                _restore_files(files_snap)
                history[:] = hist_snap
                print(f'Undid: "{label}". Files and session history restored.')
            continue

        result = route_note(note, client, history)
        if result is None:
            continue

        print("\n--- Final result (JSON) ---")
        print(json.dumps(result, indent=2))

        if result["stream"] == "unresolved_reference":
            ref = _reference_word(note)
            what = f"what you meant by '{ref}'" if ref else "what you meant"
            print(f"\nCouldn't figure out {what} in: {note}. Try being more specific.")
            continue  # expected outcome — no retry, no file write, no history entry
        if result["stream"] == "unclassifiable":
            print(f"\nDidn't understand that as a note: {note}.")
            continue  # expected outcome — no retry, no file write, no history entry

        files_before = _snapshot_files()
        history_before = copy.deepcopy(history)

        entry = act_on(note, result, history)
        if entry is not None:
            history.append(entry)
            del history[:-HISTORY_SIZE]

        if _snapshot_files() != files_before:
            undo_stack.append((note, files_before, history_before))

        dropped = result.get("dropped_intent")
        if dropped:
            print(f"\nAlso mentioned: {dropped} — filing it too.")
            pending = dropped

    print("\nbye")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
