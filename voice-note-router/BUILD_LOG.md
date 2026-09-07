# Voice Note Router: Build Log

A step-by-step account of building a small AI agent that classifies free-text (or spoken) notes and routes them to the right list, including the real bugs found along the way, how they were diagnosed, and why each fix was made the way it was.

## The idea

Speak a thought while walking, driving, or mid-task ("grab milk on the way home," "call the landlord before Friday," "what if the app synced across devices") and have it land automatically in the right place: groceries, tasks, or ideas. No manual sorting.

This log covers building the reasoning layer first: classification, validation, memory, failure handling, evals, before adding voice input or a UI. The rule: prove the logic works in plain text before adding anything that just makes it *look* more finished.

## Architecture, in one paragraph

Claude only ever reads text and returns text. It has no memory between calls and never touches a file. All of the actual work (deciding what to send Claude, validating its response, writing to disk, keeping session history) lives in `note_router.py`. This separation matters throughout: every bug below comes from a gap between what Claude *said* and what the code *checked*.

## The concepts this project actually teaches

Each of these came from a real bug, not from reading about it first. Listed here for anyone skimming before deciding whether to read the full log.

**The agent loop.** Call the model, check whether the response is actually good, retry with specific feedback if it isn't. Everything else sits on top of this.

**Validation is a definition of correctness you have to write yourself.** The model doesn't know when it's wrong. If nothing checks its output against real rules, bad output ships silently and confidently.

**Tool calling is a request/execute handoff, not the model acting directly.** The model returns a decision as text; code decides whether and how to act on it. The model never touches a file, a database, or an API on its own.

**Structural correctness and actual correctness are different questions.** A response can be valid JSON, have the right fields, use an allowed category, and still be wrong, because the model was genuinely confused and confusion doesn't show up as a structural defect. This is the single most useful failure in the whole project (Step 4).

**Getting a model to flag its own uncertainty beats trying to detect it after the fact.** Once a model can say "I don't know" in a structured, checkable way, a simple validator catches it. Detecting confusion from the outside, without that signal, is much harder and less reliable.

**"Memory" in an LLM app is just re-sent context, not persistent state.** The model has zero memory of its own. Anything that looks like memory is the surrounding code resending relevant history on every call.

**The same feature name can require different logic for different data shapes.** Deduplication needed item-level comparison for groceries and exact-line comparison for tasks, because "duplicate" means something different for each.

**Recognizing "update this" versus "this is new" isn't automatic.** When a later input clearly refers back to something already recorded, the correct move is editing that record, not creating a second one, and code has to be written to make that distinction on purpose.

## Step 1: Classification with validation and retry

**Build:** send a sentence to Claude, get back structured JSON (`stream`, `content`), classified into exactly one of `grocery`, `task`, `idea`. Validate the response: real JSON, required fields present, `stream` in the allowed set, `content` actually cleaned up rather than a verbatim copy of the input. On failure, send the response back with specific feedback and retry (max 3 attempts).

**Why validation is the actual point:** an LLM doesn't know when it's wrong, it just answers. Without a real success check, bad output ships silently. An early test of this same principle, on a separate math-classification script, produced a full correct answer in prose, but the code extracting "the number" grabbed a mid-reasoning intermediate value instead of the final answer, and reported success anyway. No error, no warning, just quietly wrong. Every check in this project exists to catch that class of failure.

**Design decision, merging categories instead of trying to perfectly define them:** the initial category set included a separate `reminder` stream for anything with a deadline. First real test case, *"call the landlord about the lease before Friday,"* was genuinely ambiguous between `task` and `reminder`. Rather than write an increasingly specific rule to split the two, the categories were merged: `task` is the only action-item stream, with due dates captured as an optional `due` field, populated when a real deadline is mentioned, `null` otherwise. When two categories are hard for a human to distinguish, they're usually hard for the model too. Collapsing the distinction into a field is often cleaner than trying to define a sharper boundary.

## Step 2: Tool calling, from classifying to acting

**Build:** on a valid classification, write to the appropriate file (`groceries.txt`, `tasks.txt`, or `ideas.txt`) instead of just printing the result.

This is the core mechanical shift in any agent: the model's output is a *request*, and code decides whether and how to act on it. Claude never opens a file; it returns `{"stream": "grocery", "content": "spinach, eggs"}`, and the script is what appends that to `groceries.txt`.

**Bug found immediately:** running the same input twice appended it twice, since there was no existence check before writing. Deliberately deferred rather than fixed on the spot, since exact-duplicate voice notes are unlikely and it wasn't yet clear what "duplicate" should even mean for different data types (see Step 3).

## Step 3: Deduplication, one feature name, two different rules

Real grocery lists accumulate near-duplicates in a way task lists don't. "Pick up spinach and eggs" today, "pick up spinach, eggs, and milk" tomorrow, are different sentences with genuine overlap. A naive exact-line duplicate check misses this: it would add a second, mostly-redundant line rather than recognizing the overlap.

**Fix:** grocery items are deduplicated at the *item* level. Content is split on commas, each item checked independently against existing lines, only genuinely new items appended. Tasks and ideas keep exact-line matching, since repeated phrasing is rare for those streams and a simpler check is sufficient.

**Lesson:** a feature that sounds like one thing ("don't duplicate") can require different implementations depending on the shape of the underlying data. Assuming one rule fits every case because the feature has one name is a real trap.

## Step 4: Memory, and the failure that mattered most

**Build:** maintain a short rolling history of recent notes within a session, included in every classification prompt, so references like "add that too" or "make that next Tuesday" can resolve against recent context. Converted the script from single-shot invocations to an interactive loop.

Claude has no persistent memory. "Memory" here means the code re-sends recent history on every call. If that history stopped being sent, there'd be nothing left for the model to "remember," because nothing was ever stored on Claude's side to begin with.

**The failure, and why it's the most important one in this project:**

Test sequence:
```
pick up spinach and eggs
add that too
book the dentist
make that next Tuesday
```

"Make that next Tuesday" correctly resolved to "book the dentist," due date attached: real, working memory. "Add that too" broke: the prior note was a *list* ("spinach, eggs"), and "that" has no single clear referent within a list. Claude returned something like `unspecified item, reference unclear`, an honest signal that it didn't know what was meant.

That honest uncertainty still got written to `groceries.txt` as a real item. Every validation check in place (valid JSON, required fields, allowed category, cleaned-up content) passed. Nothing was structurally wrong with the response. The failure was semantic, not structural, and every check built so far only inspected structure.

**The general lesson:** a system can be confidently correct, confidently wrong, or honestly uncertain, and structural validation only reliably distinguishes the first two. Catching genuine uncertainty requires the model to say so explicitly, in a form the code can check for.

**Fix:** introduced a sentinel outcome. When a reference can't be confidently resolved, Claude returns `{"stream": "unresolved_reference", "content": null}` instead of guessing. Treated as a legitimate, non-error outcome: no retry, nothing written, a clarification message printed instead.

A related bug surfaced alongside this: "book the dentist" failed its first classification attempt (returned as a verbatim copy, correctly rejected), succeeded on retry as "schedule dentist appointment," but both the failed attempt and the retry ended up written, producing duplicate task lines. Fixed by ensuring only the final validated result of a note is ever written, and by updating an existing task in place (adding a due date to the same line) when a later note clearly refers back to it, rather than creating a new entry.

## Step 5: Deliberate failure testing

Tested two categories of garbage input directly: pure gibberish (`asdkjflkasjdf`) and an unresolvable reference in isolation. Both correctly avoided writing anything, but shared one generic message, which was misleading for the gibberish case (there's no "reference" to fail to resolve; the input isn't a note at all).

**Fix:** split into two distinct outcomes: `unresolved_reference` (a word points to something, but nothing to resolve it against) and `unclassifiable` (not a recognizable note at all), each with an accurate message. Behavior unchanged in both cases; only the diagnostic output improved.

**Lesson:** correct behavior (don't write bad data) isn't sufficient on its own. The explanation of *why* something didn't happen needs to be accurate too, particularly for something meant to run unattended.

## Step 6: Evals, a number instead of a feeling

Manual testing tells you it worked on the sentences you happened to try. A 15-case eval suite was built with expected outcomes defined in advance: clean cases per stream, due-date presence/absence, an unresolvable reference, a resolvable one, ambiguous stream membership, gibberish, empty input, a known duplicate.

**Result across 3 runs: 15/15, byte-for-byte identical output each time**, including on the genuinely ambiguous case (it landed on the same interpretation every run, not just an acceptable one).

**The honest read on a perfect score:** it means one of two things. Either the logic is genuinely solid, or the test set isn't hard enough to expose a real weakness. Since Step 4 already demonstrated a confident-but-wrong failure mode under specific conditions (a reference following a *list*, not a single item), the natural next question was whether that exact shape of case was actually represented in the eval set.

## Step 7: Harder cases, and two real bugs the eval suite caught

Added 9 targeted edge cases, including the exact failure shape from Step 4 (list-then-reference), a reference resolving several notes back, unusual due-date phrasing ("in three weeks," "end of month"), a compound two-intent sentence, a near-duplicate grocery item with quantity language, sarcastic phrasing, and reference resolution via "it" instead of "that."

**Result: 22/24. Two real, distinct bugs surfaced:**

**Compound sentence, silent intent loss.** *"Grab milk and also I need to call the dentist"* collapsed to grocery only; the dentist task vanished with no trace. Same failure class as Step 4: confident, well-formed, silently incomplete.

**Quantity-blind duplicate detection.** *"A dozen eggs"* wasn't recognized as the same item as an existing `eggs` entry (extracted as `eggs (a dozen)`, which didn't match on exact-string comparison), and got appended as a redundant second line.

**Fix decisions, made deliberately rather than by default:**

For the compound-sentence bug, two reasonable approaches existed: auto-split into two entries, or classify the dominant intent and explicitly flag what was dropped. Auto-split is more convenient but risks a wrong split producing garbage silently. The safer option was chosen first: classify one, return a `dropped_intent` field naming the rest, print it clearly, with the explicit plan to revisit auto-split only if the flag-and-retype friction proved annoying in real use.

*(That plan was tested. After using this live from a phone, the friction of re-saying a dropped intent as a separate note was felt directly and quickly, and the decision was reversed to auto-split, returning a list of independently-classified items instead of one. This is the actual value of shipping the cautious version first: the reversal was based on real usage data, not a guess made in advance.)*

For the duplicate bug, the fix was more direct: extract grocery content without quantity language at the source ("eggs," not "a dozen eggs"), with an additional normalization pass as a backstop.

**Re-run after fixes: 24/24**, with the two previously-failing cases now explicitly verified rather than just passing by coincidence.

**Why this second perfect score is more trustworthy than the first:** it followed a deliberate attempt to break the system, two real findings, and confirmed fixes, not just a repeat run of easy cases. A pass rate only means as much as the effort spent trying to invalidate it.

## Step 8: Basic usability

Everything above proved the reasoning worked, but the tool had no way to inspect or correct what it had already written, only append. Added `list` (view current contents per stream) and `undo` (remove the last write), plus a follow-up flow for `dropped_intent` (superseded by the auto-split reversal above, but the underlying "let the user act on a flagged gap immediately" pattern remained useful).

Deliberately not built at this stage: formal CI-style regression testing (`xfail` markers, JSON eval output) and packaging for distribution (`pyproject.toml`, console entry point). Both are legitimate practices for code with multiple contributors or external users, premature for a single-user tool with no dependents yet.

## Real voice input

Added a small FastAPI server (`server.py`) with a phone-facing recording page. Audio is transcribed locally via `faster-whisper`, no external transcription API, no cost per note, audio never leaves the machine, and the transcript is fed into the exact same classification pipeline used for typed input.

**A real constraint surfaced immediately:** phone browsers only grant microphone access over HTTPS or `localhost`. A plain local-network HTTP address is refused, regardless of same-WiFi connectivity. Solved with an HTTPS tunnel (`cloudflared`), plus a shared-secret token, since a tunnel briefly exposes the local server on the public internet. This is a genuine limitation of the current setup: the host machine and both processes (server, tunnel) need to be running for voice input to work from anywhere via cellular, and the tunnel's address changes on every restart unless a paid, named tunnel is configured.

**Live-use finding:** running real dictated sentences through the deployed voice pipeline surfaced the exact auto-split decision described in Step 7 as a real usability issue, not a hypothetical one. Direct confirmation that testing in actual use, not just against the eval suite, still finds things static tests don't.

## Where this stands

Working and in daily use: classification with validation and retry, tool-calling into real files, deduplication rules that differ by data shape, session memory with honest uncertainty handling, deliberate failure testing, a 24-case eval suite that found and confirmed fixes for two real bugs, basic usability commands, and real voice input from a phone.

**Explicitly not built, and why:** multiple agents negotiating or disagreeing with each other. This is a single-agent classification task; that idea needs a project built around genuinely conflicting objectives to be worth doing at all. That's a separate project, not an extension of this one.

**Known limitations, stated plainly:** voice input requires the host machine and tunnel to stay running; there's no fixed public URL without a paid tunnel; output lives in local text files rather than a shared app or task manager most people would actually want to check daily.
