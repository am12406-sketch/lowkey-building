"""run_evals.py — fixed eval suite for note_router.py's classification logic.

Runs hand-written test cases through note_router.route_note() (and, where file
state matters, note_router.act_on()), compares the actual outcome against the
expected one, and prints a pass/fail table plus an overall pass rate. The DETAIL
column always shows what actually happened (stream, content, due, file effect),
so edge cases are legible even when they pass.

Every case runs in its own fresh temp directory (note_router.OUTPUT_DIR), so this
never touches the real groceries.txt / tasks.txt / ideas.txt.

Usage:
    python run_evals.py            # table
    python run_evals.py -v         # also dump each case's captured transcript
"""

from __future__ import annotations

import contextlib
import io
import os
import shutil
import sys
import tempfile
from pathlib import Path

import note_router as nr


def hist(*entries: tuple[str, str, str, str | None]) -> list[dict]:
    """Build history entries as main() would store them: (note, stream, content, due)."""
    return [{"note": n, "stream": s, "content": c, "due": d} for (n, s, c, d) in entries]


# Case schema:
#   id              : short label
#   note / sequence : a single note, OR an ordered list of notes (the LAST is evaluated,
#                     earlier ones build real session history exactly as main() would)
#   prior           : optional static history entries prepended before the sequence
#   seed_groceries  : optional pre-existing lines in the test groceries.txt
#   write           : run act_on() for classifiable results (needed for file-effect checks)
#   expect          :
#     stream                : expected stream, or a set of acceptable streams
#     due                   : "present" | "absent" | "contains:<substr>"  (task only)
#     duplicate             : "<item>"  -> must land in `already`, never in `added`
#     resolves_to_step      : 1-based index into `sequence`; final content must
#                             dedup-match that step's result content
#     content_all           : list of substrings the final content must all contain
#     content_none          : list of substrings the final content must not contain
#     no_write_in_last_step : True -> the last note must not add any grocery/task/idea line
CASES: list[dict] = [
    # ---------------------------------------------------------------- original 15
    {"id": "01_grocery_clean", "note": "pick up milk and bread",
     "expect": {"stream": "grocery"}},

    {"id": "02_task_with_due", "note": "email the quarterly report to Sam by Friday",
     "expect": {"stream": "task", "due": "present"}},

    {"id": "03_task_no_due", "note": "take out the recycling",
     "expect": {"stream": "task", "due": "absent"}},

    {"id": "04_idea_clean", "note": "what if the app had a dark mode",
     "expect": {"stream": "idea"}},

    {"id": "05_ref_unresolvable_isolation", "note": "add that too",
     "expect": {"stream": "unresolved_reference"}},

    {"id": "06_ref_resolvable_grocery",
     "prior": hist(("pick up milk and bread", "grocery", "milk, bread", None)),
     "note": "oh and add butter to that",
     "expect": {"stream": "grocery"}},

    {"id": "07_two_stream_birthday_cake", "note": "remember to buy a birthday cake",
     "expect": {"stream": {"grocery", "task"}}},

    {"id": "08_gibberish", "note": "xkcd qwpine zzblfg wumpo",
     "expect": {"stream": "unclassifiable"}},

    {"id": "09_empty_input", "note": "",
     "expect": {"stream": "unclassifiable"}},

    {"id": "10_grocery_duplicate", "note": "grab some milk on the way home",
     "seed_groceries": ["milk", "eggs"], "write": True,
     "expect": {"stream": "grocery", "duplicate": "milk"}},

    {"id": "11_grocery_multi", "note": "we still need spinach, tomatoes and olive oil",
     "expect": {"stream": "grocery"}},

    {"id": "12_task_clock_time", "note": "call the dentist at 3pm",
     "expect": {"stream": "task", "due": "present"}},

    {"id": "13_idea_digest", "note": "idea: a weekly digest email of all my notes",
     "expect": {"stream": "idea"}},

    {"id": "14_two_stream_gift", "note": "pick up a gift for mom's birthday",
     "expect": {"stream": {"grocery", "task"}}},

    {"id": "15_ref_resolvable_task_due",
     "prior": hist(("book the dentist", "task", "schedule dentist appointment", None)),
     "note": "make that next Tuesday",
     "expect": {"stream": "task", "due": "present"}},

    # ---------------------------------------------------------------- new cases A-H
    # A — ambiguous reference after a list: "that" has no single antecedent
    {"id": "A_ambiguous_ref_after_list", "write": True,
     "sequence": ["pick up milk, bread, and cheese", "add that too"],
     "expect": {"stream": "unresolved_reference", "no_write_in_last_step": True}},

    # B — reference several notes back (not the immediately previous one)
    {"id": "B_ref_several_notes_back", "write": True,
     "sequence": [
         "pick up spinach",
         "book the dentist",
         "thinking about the trip planner idea",
         "make that next Tuesday",
     ],
     "expect": {"stream": "task", "due": "contains:tuesday", "resolves_to_step": 2}},

    # C1 — unusual due phrasing: relative offset
    {"id": "C1_due_in_three_weeks", "note": "renew the passport in three weeks",
     "expect": {"stream": "task", "due": "contains:week"}},

    # C2 — unusual due phrasing: period boundary
    {"id": "C2_due_end_of_month", "note": "pay rent by end of month",
     "expect": {"stream": "task", "due": "contains:month"}},

    # D — two intents in one sentence; the second must survive in dropped_intent
    {"id": "D_two_intents_one_sentence",
     "note": "grab milk and also I need to call the dentist",
     "expect": {"stream": {"grocery", "task"},
                "dropped_intent_present": True,
                "combined_content_all": ["milk", "dentist"]}},

    # E — near-duplicate grocery item: "a dozen eggs" must NOT be added when "eggs" exists
    {"id": "E_near_duplicate_eggs", "note": "pick up a dozen eggs",
     "seed_groceries": ["eggs"], "write": True,
     "expect": {"stream": "grocery", "duplicate": "eggs"}},

    # F — sarcastic / non-literal phrasing should not block extraction
    {"id": "F_sarcastic_milk", "note": "great, ANOTHER thing to buy, milk I guess",
     "expect": {"stream": "grocery",
                "content_all": ["milk"],
                "content_none": ["great", "guess", "another thing"]}},

    # G — reference using "it" rather than "that"
    {"id": "G_ref_word_it", "write": True,
     "sequence": ["call the landlord about the lease", "actually do it tomorrow"],
     "expect": {"stream": "task", "due": "contains:tomorrow", "resolves_to_step": 1}},

    # H — whitespace-only input
    {"id": "H_whitespace_only", "note": "   ",
     "expect": {"stream": "unclassifiable", "no_write_in_last_step": True}},
]


class Outcome:
    """What actually happened when a case ran."""

    def __init__(self) -> None:
        self.step_results: list[dict | None] = []
        self.last_entry: dict | None = None
        self.grocery_before_last = 0
        self.grocery_after_last = 0
        self.task_idea_before_last = 0
        self.task_idea_after_last = 0
        self.error: str | None = None

    @property
    def final(self) -> dict | None:
        return self.step_results[-1] if self.step_results else None


def _line_count(name: str) -> int:
    path = nr.OUTPUT_DIR / name
    if not path.exists():
        return 0
    return len([ln for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()])


def run_case(case: dict, client) -> tuple[Outcome, str]:
    """Run one case in its own temp dir. Return (Outcome, captured transcript)."""
    notes = case["sequence"] if "sequence" in case else [case["note"]]
    history: list[dict] = list(case.get("prior", []))
    outcome = Outcome()
    buf = io.StringIO()

    tmp = Path(tempfile.mkdtemp(prefix="note_evals_"))
    nr.OUTPUT_DIR = tmp
    if case.get("seed_groceries"):
        (tmp / nr.STREAM_FILES["grocery"]).write_text(
            "\n".join(case["seed_groceries"]) + "\n", encoding="utf-8"
        )

    try:
        with contextlib.redirect_stdout(buf):
            for i, note in enumerate(notes):
                is_last = i == len(notes) - 1
                if is_last:
                    outcome.grocery_before_last = _line_count(nr.STREAM_FILES["grocery"])
                    outcome.task_idea_before_last = (
                        _line_count(nr.STREAM_FILES["task"])
                        + _line_count(nr.STREAM_FILES["idea"])
                    )

                res = nr.route_note(note, client, history)
                outcome.step_results.append(res)
                if res is None:
                    outcome.error = f"route_note returned None at step {i + 1}"
                    break

                entry = None
                if case.get("write") and res["stream"] in nr.ALLOWED_STREAMS:
                    entry = nr.act_on(note, res, history)
                    if entry is not None:
                        history.append(entry)
                        del history[:-nr.HISTORY_SIZE]

                if is_last:
                    outcome.last_entry = entry
                    outcome.grocery_after_last = _line_count(nr.STREAM_FILES["grocery"])
                    outcome.task_idea_after_last = (
                        _line_count(nr.STREAM_FILES["task"])
                        + _line_count(nr.STREAM_FILES["idea"])
                    )
    except Exception as exc:  # noqa: BLE001 - any failure becomes a case failure
        outcome.error = f"{type(exc).__name__}: {exc}"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    return outcome, buf.getvalue()


def evaluate(case: dict, o: Outcome) -> tuple[bool, str]:
    """Compare actual outcome vs expected. Return (passed, human-readable detail)."""
    exp = case["expect"]
    fails: list[str] = []

    if o.error:
        return False, o.error

    result = o.final
    if result is None:
        return False, "no result"

    stream = result["stream"]
    content = result.get("content")
    due = result.get("due")
    dropped = result.get("dropped_intent")

    # --- always-on "what actually happened" ---
    detail = f"stream={stream}"
    if content is not None:
        snippet = content if len(content) <= 70 else content[:67] + "..."
        detail += f'  content="{snippet}"'
    if stream == "task":
        detail += f"  due={due!r}"
    if dropped:
        detail += f'  dropped_intent="{dropped}"'
    if o.last_entry and "added" in o.last_entry:
        detail += f"  added={o.last_entry['added']} already={o.last_entry['already']}"
    if exp.get("no_write_in_last_step"):
        wrote = (o.grocery_after_last - o.grocery_before_last) + (
            o.task_idea_after_last - o.task_idea_before_last
        )
        detail += f"  new_lines_last_step={wrote}"

    # --- checks ---
    if "stream" in exp:
        want = exp["stream"]
        want_set = want if isinstance(want, set) else {want}
        if stream not in want_set:
            fails.append(f"stream expected {sorted(want_set)}, got {stream!r}")

    if exp.get("due") and stream == "task":
        spec = exp["due"]
        if spec == "present" and not due:
            fails.append(f"due expected present, got {due!r}")
        elif spec == "absent" and due:
            fails.append(f"due expected absent, got {due!r}")
        elif spec.startswith("contains:"):
            needle = spec.split(":", 1)[1]
            if not due or needle.lower() not in due.lower():
                fails.append(f"due expected to contain {needle!r}, got {due!r}")
    elif exp.get("due") and stream != "task":
        fails.append(f"due check needs a task, but stream is {stream!r}")

    if exp.get("duplicate"):
        want_key = nr._grocery_key(exp["duplicate"])
        if o.last_entry is None:
            fails.append("duplicate check: act_on() produced no entry")
        else:
            already = {nr._grocery_key(x) for x in o.last_entry.get("already", [])}
            added = {nr._grocery_key(x) for x in o.last_entry.get("added", [])}
            if want_key in added:
                fails.append(
                    f"{exp['duplicate']!r} was added as a NEW line (near-dup not caught): "
                    f"{o.last_entry.get('added')}"
                )
            elif want_key not in already:
                fails.append(
                    f"{exp['duplicate']!r} neither flagged as duplicate nor added "
                    f"(already={o.last_entry.get('already')}, added={o.last_entry.get('added')})"
                )

    if exp.get("resolves_to_step"):
        step = exp["resolves_to_step"]
        target = o.step_results[step - 1]
        if not target or not target.get("content"):
            fails.append(f"resolves_to_step {step}: that step has no content")
        elif nr._dedup_key(content or "") != nr._dedup_key(target["content"]):
            fails.append(
                f"expected to resolve to step {step} "
                f'("{target["content"]}"), got "{content}"'
            )

    for needle in exp.get("content_all", []):
        if not content or needle.lower() not in content.lower():
            fails.append(f"content missing {needle!r}")
    for needle in exp.get("content_none", []):
        if content and needle.lower() in content.lower():
            fails.append(f"content should not contain {needle!r}")

    if exp.get("dropped_intent_present"):
        if not dropped:
            fails.append(f"dropped_intent expected to be set, got {dropped!r}")

    if exp.get("combined_content_all"):
        combined = f"{content or ''} {dropped or ''}".lower()
        for needle in exp["combined_content_all"]:
            if needle.lower() not in combined:
                fails.append(f"neither content nor dropped_intent mentions {needle!r}")

    if exp.get("no_write_in_last_step"):
        wrote = (o.grocery_after_last - o.grocery_before_last) + (
            o.task_idea_after_last - o.task_idea_before_last
        )
        if wrote != 0:
            fails.append(f"expected no new lines from last note, {wrote} were written")

    if fails:
        return False, detail + "  ||  " + "; ".join(fails)
    return True, detail


def _expected_str(exp: dict) -> str:
    parts = []
    if "stream" in exp:
        s = exp["stream"]
        parts.append("|".join(sorted(s)) if isinstance(s, set) else str(s))
    if exp.get("due"):
        parts.append(f"due:{exp['due']}")
    if exp.get("duplicate"):
        parts.append(f"dup:{exp['duplicate']}")
    if exp.get("resolves_to_step"):
        parts.append(f"->step{exp['resolves_to_step']}")
    if exp.get("content_all"):
        parts.append("has:" + "+".join(exp["content_all"]))
    if exp.get("content_none"):
        parts.append("!has:" + "+".join(exp["content_none"]))
    if exp.get("dropped_intent_present"):
        parts.append("dropped!=null")
    if exp.get("combined_content_all"):
        parts.append("combined:" + "+".join(exp["combined_content_all"]))
    if exp.get("no_write_in_last_step"):
        parts.append("no-write")
    return " ".join(parts)


def main() -> int:
    verbose = "-v" in sys.argv or "--verbose" in sys.argv

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ANTHROPIC_API_KEY is not set. See .env.example.")
        return 1

    client = nr.anthropic.Anthropic()
    real_output_dir = nr.OUTPUT_DIR

    print(f"Running {len(CASES)} eval cases (each in its own temp dir)\n")

    rows: list[tuple[str, str, bool, str, str]] = []
    try:
        for case in CASES:
            outcome, transcript = run_case(case, client)
            passed, detail = evaluate(case, outcome)
            rows.append((case["id"], _expected_str(case["expect"]), passed, detail, transcript))
    finally:
        nr.OUTPUT_DIR = real_output_dir

    id_w = max(len(r[0]) for r in rows)
    exp_w = min(28, max(len(r[1]) for r in rows))
    print(f"{'#':>2}  {'CASE':<{id_w}}  {'EXPECTED':<{exp_w}}  RESULT  DETAIL")
    print("-" * (id_w + exp_w + 60))
    for i, (cid, want_str, passed, detail, _) in enumerate(rows, 1):
        mark = "PASS" if passed else "FAIL"
        print(f"{i:>2}  {cid:<{id_w}}  {want_str:<{exp_w}}  {mark:<6}  {detail}")

    passes = sum(1 for r in rows if r[2])
    total = len(rows)
    print("-" * (id_w + exp_w + 60))
    print(f"\nPass rate: {passes}/{total} ({passes / total * 100:.0f}%)")

    failed = [r[0] for r in rows if not r[2]]
    if failed:
        print("Failed:", ", ".join(failed))
        if not verbose:
            print("Re-run with -v for each case's full transcript.")

    if verbose:
        for cid, _, passed, detail, transcript in rows:
            print(f"\n{'=' * 72}\n{cid}  [{'PASS' if passed else 'FAIL'}]  {detail}\n{'=' * 72}")
            print(transcript.rstrip())

    return 0 if passes == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
