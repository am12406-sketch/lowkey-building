# Voice Note Router — Build Log

*The full build story: real prompts used, real bugs hit, real fixes, and why each decision was made — not just the final code.*

## The core concepts, in one place

Everything below was learned by hitting an actual bug, not by reading about it first. Here's the list, for anyone skimming before deciding to build this themselves.

**The agent loop.** Code that calls Claude, checks whether the response is actually good, and retries with specific feedback if it isn't — instead of just accepting whatever comes back. This is the skeleton every rung below sits on top of.

**Validation is a definition of "success" you have to write yourself.** Claude doesn't know when it's wrong; it just answers. If nothing checks the answer against real rules, bad output ships silently. Early on, a plain math script grabbed the wrong number out of an otherwise-correct answer and reported success anyway — nothing crashed, it was just quietly wrong. That's the default failure mode of any of these systems if you don't check for it.

**Tool calling — the model asks, your code acts.** Claude never directly writes to a file. It says "this belongs in groceries.txt," and the code is what actually does it. This request-then-execute handoff is the mechanical core of every agent, from a script this small to a full coding assistant.

**Structural correctness vs. actual correctness.** A response can be valid JSON, have the right fields, use an allowed category, and still be *wrong* — because the model was genuinely confused, and confusion doesn't show up as a structural defect. This was the single most useful failure in this whole build (see Step 4).

**Teaching the model to flag its own uncertainty.** The fix for the above isn't a smarter validator — it's getting the model to explicitly say "I don't know" in a format simple code can catch, rather than trying to detect confusion after the fact.

**Memory is not something Claude has — it's something your code re-sends.** Claude has no persistent memory between calls. Each time you contact it, it only knows what's in that message. "Memory" in this project just means: the code keeps a running log of recent notes, and pastes that log back into every new prompt. If the code stopped resending it, Claude would instantly "forget," because there was never anything to forget from its side — it was never storing anything.

**The same-named feature can need different rules for different data.** De-duplication looked like one feature but needed two different implementations — item-level for groceries (interchangeable items, overlap is normal), exact-line for tasks/ideas (repetition is rare). Assuming one rule fits every case just because the feature has one name is a real trap.

**Update in place vs. treat as new.** When a later note clearly refers back to something already recorded (adding a due date to an existing task), the correct move is editing that entry, not creating a second one. Recognizing "this is more information about something that exists" versus "this is a new thing" isn't automatic — it has to be built.

---

## Three things that are easy to mix up: Claude, the script, and the API key

Before the rest of this makes sense, it's worth being precise about three things that sound similar but do completely different jobs.

**Claude (the model) is pure thinking, nothing else.** It reads text and writes text back. It has no memory between messages, can't touch a file on your computer, can't do anything except respond to whatever it's given. In this project, Claude's whole job is: read a sentence like "pick up spinach and eggs," and reply with something like `{"stream": "grocery", "content": "spinach, eggs"}`. That's it. It never sees `groceries.txt`. It never writes anything to your computer.

**The script (`note_router.py`) is the thing that actually does stuff.** It decides what to send Claude, checks whether Claude's reply is actually valid, asks again if it isn't, and — critically — is the *only* thing that ever touches your real files. When a note gets classified as grocery, it's the script that opens `groceries.txt` and adds a line. Claude told it what to do; the script is what actually did it.

**The API key is just the credential that lets the script talk to Claude at all.** Every time the script wants to send a sentence to Claude, it has to prove it's allowed to — that's what the key is for, like an ID badge. Without it, the script can't reach Claude, full stop. It doesn't do any thinking itself; it just unlocks the connection.

**The full sequence, for one note:**

1. You type a sentence
2. The script uses the API key to open a connection to Claude
3. The script sends your sentence to Claude
4. Claude reads it and replies with its classification, as text
5. The script checks that reply against its rules (valid JSON? allowed category? not a copy-paste?)
6. If it's good, **the script** — not Claude — writes to the right file
7. If it's not good, the script sends the reply back to Claude with specific feedback, and steps 3–6 repeat

Claude never sees your files, never remembers a previous note on its own, and never decides to write anything. It only ever produces text. Everything that actually happens in the real world — reading files, writing files, deciding what to do next — is the script's job. The API key just makes it possible for the script and Claude to talk in the first place.

## The idea

You're walking, driving, running — a thought pops into your head. "Grab milk on the way home." "What if the app synced across devices." "Call the landlord before Friday."

Right now you either forget it, or you dump it into one messy Notes app where everything blurs together.

The idea: speak the thought, and have it automatically land in the right place — groceries go to a grocery list, action items go to a task list, stray thoughts go to an ideas file. No manual sorting.

This document walks through building the first piece of that — the part that reads a sentence and figures out where it belongs — using Claude, one small step at a time. If you've never written code before, this is written for you specifically.

## Why build it this way, not all at once

The instinct is to want the whole thing — voice input, auto-sorting, an app with a nice screen. Building all of that at once is how side projects die. You spend three weekends on the login screen and never find out if the core idea even works.

So the rule we followed: **prove the reasoning works in plain text first, add pieces one at a time, add the app-like parts last.** Voice input isn't built yet. There's no UI. It's a script that takes typed text and figures out where it should go. Boring on purpose.

## Tools used

- **Claude Code** — an app where you describe what you want in plain English, and it writes the actual code for you. You don't need to know how to code to use it.
- **Anthropic API key** — a separate thing from a regular Claude subscription. A Claude subscription lets *you* chat with Claude. An API key lets *a program* talk to Claude automatically, without you typing each message. Get one free (with starting credit) at console.anthropic.com.

## Step 1 — Just classify, don't act yet

**What we asked Claude Code to build:** a script that takes one sentence, sends it to Claude with instructions to sort it into exactly one of a few categories, and get back clean, structured data (not a paragraph — actual structured fields you could feed into other code).

**The categories (kept deliberately small):** grocery, task, idea. (We started with a 4th, "reminder," and merged it — more on that below.)

**The actual prompt we gave Claude Code:**

> Build a script called note_router.py. Take a raw voice-note-style sentence as input. Send it to Claude asking it to classify which stream it belongs to — must be exactly one of "grocery", "task", "idea", "reminder" — and extract clean structured content for that stream. Return JSON only with fields: stream, content. Validate: is it real JSON, are both fields present, is stream exactly one of the four allowed values, and is content not just a copy of the raw input. If validation fails, send the response back to Claude explaining exactly what was wrong, retry up to 3 times. Print every attempt.

**Why the validation step matters, and why it's the actual point:**

An AI model doesn't "know" when it did something wrong. It just answers. If you don't check its answer against real rules, you'll ship garbage without knowing it. Early in this project, we saw exactly this happen in a *different* small exercise: asked a model a math question, it gave the right answer in a full sentence, but the code looking for "the number" grabbed the wrong number from the middle of its reasoning — and confidently reported success. No error. No warning. Just quietly wrong.

That's why every step here checks: is this actually valid JSON, are the required fields present, is the category one of the allowed values, is the content actually cleaned up rather than just a copy-paste of the input. And if any check fails, the script doesn't give up — it tells Claude exactly what was wrong and asks it to fix it, up to a few tries.

**A real design decision we made mid-build:** we originally had 4 categories, including a separate "reminder" for anything with a deadline. First real test sentence: *"need to call the landlord about the lease before Friday."* Was that a task or a reminder? Genuinely ambiguous — it's an action item (task) that also has a deadline (reminder-ish). Rather than leave that ambiguity for the model to silently guess through, we collapsed it: **task** is now the only category for action items, and it has an optional `due` field. If the sentence mentions a deadline, `due` gets filled in; if not, it's `null`. This removes a fuzzy category boundary by turning it into one extra field instead of a decision between two similar buckets.

Lesson: when two categories are hard for *you* to tell apart, they'll be hard for the model too. Merging them and adding a field is often cleaner than trying to write a perfect rule to distinguish them.

## Step 2 — From classifying to actually doing something

Classifying a sentence and printing it is only half the point. Step 2 gives the script real tools — actual functions that write to real files: a groceries list, a task list, an ideas file. This is the shift from "the model tells you what it thinks" to "the model's decision actually changes something." That distinction — code *acting* on a model's decision, versus the model just describing what it would do — is the core mechanic behind every AI agent, from a script like this to a full coding assistant.

**The prompt we gave Claude Code:**

> Update note_router.py to actually act on the classification instead of just printing it. After getting a valid classified result, call the appropriate tool based on stream: grocery → append to groceries.txt, task → append to tasks.txt (with due date if present), idea → append to ideas.txt. Create these files if they don't exist. Print confirmation of what was written and where. Keep all existing classification and validation logic exactly as is.

**What actually happened:**

Ran two sentences — *"pick up spinach and a dozen eggs"* and *"book the dentist sometime"*. Both classified correctly on the first attempt (no retries needed), and both landed in the right file:

```
groceries.txt
spinach
eggs

tasks.txt
book the dentist
```

The landlord sentence from Step 1, run earlier, also showed up correctly with its due date preserved: `call the landlord about the lease (due: before Friday)`.

**A small but real bug we hit:** running the same two sentences twice appended them twice — the files had duplicate entries. Not a mistake in the classification logic, just a missing feature: nothing was checking "does this already exist before adding it." Worth naming explicitly, because it's a good example of a common gap in early-stage tools — the reasoning part (what category does this belong to) can work perfectly while a completely separate, simpler thing (don't add the same line twice) is still missing. We decided to leave de-duplication out for now, since it doesn't teach anything new about how agents work and real voice notes are unlikely to be identical twice.

## Step 3 — Not writing the same thing twice

Running the same sentence twice created duplicate lines in the files — no check for "does this already exist." Simple to fix in general, but grocery lists have a wrinkle worth calling out.

**The wrinkle:** if you say "pick up spinach and eggs" today, then "pick up spinach, eggs, and milk" tomorrow, those are two *different* sentences with overlapping content. A simple "does this exact line already exist" check wouldn't catch that spinach and eggs are repeated — it would just add a second, mostly-redundant line, and now your grocery list has near-duplicate entries instead of one clean list.

**The fix:** for groceries specifically, break the content into individual items (spinach / eggs / milk) and check each one separately against what's already in the file. Only the genuinely new items get added. Tasks and ideas don't need this — you're not going to say "book the dentist" in slightly different phrasings the way you'd casually vary a grocery list, so a simpler "is this exact line already there" check is enough for those.

**Result**, after running "pick up spinach and a dozen eggs" then "pick up spinach and a dozen eggs and milk":

```
groceries.txt
spinach
eggs
milk
```

Spinach and eggs weren't re-added the second time; only milk, the genuinely new item, was appended.

**The lesson here:** a feature that looks the same on the surface ("don't duplicate things") can need a different actual rule depending on the kind of data. Groceries are a list of interchangeable items where overlap is common and expected. Tasks and ideas are closer to individual sentences, where exact repetition is rare and a simpler check is enough. Worth asking "what does a duplicate even mean for *this* kind of data" before writing the check, rather than assuming one rule fits everywhere.

## Step 4 — Giving it memory, and a real failure worth learning from

Up to this point, every note was a blank slate — the script had no idea what you'd said a moment ago. Say "pick up spinach and eggs" then "add tomatoes too," and without memory, the second sentence gets classified in total isolation. It happens to still work, because "tomatoes" is obviously a grocery item on its own — but that's a coincidence, not proof that memory is working. The real test is a sentence that means *nothing* without context: "add that too," or "make that next Tuesday."

**What we asked Claude Code to build:** keep a short history of recent notes in memory during a session, include that history in the prompt so Claude can resolve references like "that" or "add that too," and turn the script into an interactive loop — type several notes in a row, instead of running it fresh for each one.

**Then we tested it with a real ambiguous case, and it broke in an interesting way — not with an error, but with a wrong answer that looked completely fine.**

We ran:
```
pick up spinach and eggs
add that too
book the dentist
make that next Tuesday
```

Three of the four worked. "Make that next Tuesday" correctly attached a due date to "book the dentist" from two notes earlier — real memory, working as designed.

But "add that too" broke. The previous note was a *list* ("spinach, eggs"), and "that" doesn't clearly point to any single item in a list. Claude actually noticed this and returned something like `"unspecified item, reference unclear"` — an honest admission that it didn't know what you meant.

The problem: that honest uncertainty still got written into `groceries.txt` as a real grocery item. Every validation check we'd built — is this valid JSON, are the fields present, is the category allowed, is the content cleaned up rather than a copy-paste — passed. Nothing was *structurally* wrong with the response. The failure was in the meaning, not the shape, and every check we had only looks at shape.

**This is the actual lesson, and it's a general one, not specific to this project:** a system can be honestly uncertain and still cause damage, if nothing checks for the difference between "confident and correct," "confident and wrong," and "honestly unsure." Structural validation (is this valid JSON, right field names, allowed values) catches the first two failure shapes reasonably well. It catches the third one, genuine uncertainty, not at all — because an honest "I don't know" can be perfectly well-formatted.

**The fix:** teach Claude to say so explicitly, in a way the code can check for. Instead of guessing at an unclear reference, it now returns a specific signal — `{"stream": "unresolved", "content": null}` — when it can't confidently resolve something. The code treats this as a legitimate outcome, not an error: no retry, nothing written to any file, and instead a message printed back: *"Couldn't figure out what you meant by 'that' in: add that too. Try being more specific."*

Re-running the same four notes after the fix:

```
"pick up spinach and eggs"  → spinach, eggs added
"add that too"              → unresolved, nothing written, clarification printed
"book the dentist"          → schedule dentist appointment, added
"make that next Tuesday"    → resolved correctly, due date attached
```

A second, smaller bug surfaced alongside this one: "book the dentist" failed its first classification attempt (came back as a verbatim copy of the input, which the validator correctly rejects), succeeded on retry as "schedule dentist appointment" — but the failed first attempt and the successful retry both ended up getting written, creating two lines for one task. Fixed by making sure only the final validated result of a note is ever written, and by updating an existing task in place (adding the due date to the same line) rather than creating a new one when a later note clearly refers back to it.

**Why this matters beyond this one project:** "did the system produce well-formed output" and "did the system actually understand the request" are different questions, and it's easy to build a validator that only answers the first one. The fix here wasn't a smarter validator — it was teaching the model to flag its own uncertainty in a structured way, so the simple validator could catch it. That's a cheaper and more reliable pattern than trying to write rules that detect confusion after the fact.

## Step 5 — Breaking it on purpose

Everything so far had been tested with real, sensible sentences. Worth deliberately trying to break it with genuine nonsense too — not because you'd type gibberish into a real voice app, but because "how does this fail when the input makes no sense" is a real question a working system needs an answer to.

Two cases:

**Pure gibberish** — `asdkjflkasjdf`. Not a note at all, not ambiguous, just meaningless.

**An unresolved reference** — `add that too`, tested in isolation with no prior context to point to.

Both correctly resulted in nothing being written to any file — good, the "flag uncertainty instead of guessing" logic from Step 4 was already catching both. But the message printed for both cases was the same generic wording, which is misleading: "couldn't figure out what you meant by 'that'" doesn't make sense for a sentence with no reference word at all.

**The fix:** split one vague outcome into two specific ones — `unresolved_reference` (a word like "that" points to something, but there's nothing to point it at) versus `unclassifiable` (the input isn't recognizable as a note at all). Each gets its own accurate message. Behavior in both cases is unchanged — nothing gets written either way — but now the feedback you get actually matches what went wrong, which matters once you're debugging why something didn't get saved.

**The lesson:** getting the *behavior* right (don't write bad data) isn't the whole job — the *explanation* of what happened has to be accurate too, especially since this is meant to run without you watching over it. A misleading message doesn't cause data corruption, but it will waste your time later trying to figure out why something failed for the wrong reason.

## Step 6 — Evals: getting an actual number instead of a feeling

Everything up to this point was tested by hand — type a sentence, look at what happened, judge it yourself. That doesn't scale, and worse, it doesn't tell you anything reliable. You only know it worked on the handful of sentences you personally happened to try.

An eval fixes that: a fixed set of test sentences, a clear correct-or-wrong answer defined in advance for each one, run all at once, and an actual pass rate at the end — not a vibe.

**What we built:** a separate script, `run_evals.py`, with 15 test cases covering the real situations this project has actually hit: clean notes for each stream, a task with a due date and one without, an ambiguous reference that should fail to resolve, one that should resolve correctly, a sentence that could plausibly belong to two streams, gibberish, an empty input, and a duplicate grocery item. Each case has an expected outcome defined before running anything, so "correct" isn't a judgment call after the fact.

**Result, run three times in a row: 15 out of 15, every time, with no variation.** Not just the same pass count — the actual details were identical across runs too. A due date that should read "by Friday" came back as exactly "by Friday" all three times. A genuinely ambiguous sentence that could reasonably land in either of two categories landed on the *same* category all three times, rather than flip-flopping.

**Why this is a good result, but not the whole story.** A perfect score across repeated runs means two possible things: either the classification logic is genuinely solid, or the 15 test cases weren't hard enough to expose a wobble that's still there. We already know from Step 4 that this system *can* produce inconsistent, wrong-but-confident output under the right conditions — a reference to something in a *list* rather than a single item was exactly the case that broke it earlier. Worth explicitly checking: does the eval set include a case shaped like that specific failure, or does it just include "an ambiguous reference" in general? If not, that's the next case to add, since it's the one failure mode you know is real from direct experience, not hypothetical.

**The honest lesson:** a clean pass rate is reassuring, but it's only as good as the test cases behind it. The value of an eval isn't the number itself — it's the discipline of writing down, in advance, exactly what "correct" means for a real range of situations, including the ones you already know are hard. A test suite that only contains easy cases will always look great and tell you nothing.

## Step 7 — Fixing what the eval found

A perfect score is only meaningful if the test set was actually hard. So before trusting the earlier 15/15, we added 9 harder cases specifically targeting situations we suspected would break something — including two that actually did.

**Case D (two intents in one sentence)** — "grab milk and also I need to call the dentist" — was silently collapsing to just the grocery part. The dentist task vanished with no trace, same failure shape as the "add that too" bug from Step 4: confident, clean-looking, quietly incomplete.

**Case E (near-duplicate item)** — "a dozen eggs" wasn't being recognized as the same item as an existing "eggs" entry, so it got added as a second, redundant line.

**The fixes, and a real decision point worth naming:** for Case D, there were two reasonable approaches — automatically split the sentence into two separate entries, or classify one and explicitly flag what got left out. Auto-split is more convenient but riskier (a wrong split is worse than a flagged one). We deliberately chose the safer option first: classify the dominant intent, and return a `dropped_intent` field naming whatever else was mentioned, printed clearly so nothing gets lost silently. The plan is to test this in real use and switch to auto-split later only if flagging turns out to be genuinely annoying — a decision better made from real usage than guessed upfront.

For Case E, the fix was more straightforward: extract grocery items without quantity language in the first place ("eggs," not "a dozen eggs"), with an additional normalization step as a backstop, so quantity differences can't cause a false "these are different items" result.

**Re-running the full 24-case suite after both fixes: 24/24.** Cases 20 and 21 specifically now show the fixes working — the dropped dentist task is visible instead of silently gone, and "eggs (dozen)" is correctly recognized as the same item as "eggs."

**Why this second perfect score means more than the first one:** the first 15/15 was reassuring but untested against anything hard. This one comes after deliberately trying to break the system, finding two real gaps, watching them fail, fixing them, and confirming the fix — not just running easy cases again and hoping. A pass rate is only as trustworthy as the effort that went into trying to make it fail.

## Step 8 — Making it actually usable, not just a demo

Everything up to this point proved the reasoning worked. But there was a real, basic gap: you could only add things. No way to see what was stored without leaving the script and checking the files separately, no way to undo a mistake, and the `dropped_intent` message from Step 7 just printed text and left you to manually retype whatever got flagged.

**Three additions closed that gap:**

- **`list`** — see what's actually in each stream without leaving the script
- **`undo`** — remove the last thing written, for when a note gets misclassified or you change your mind
- **Dropped-intent follow-up** — when a compound sentence flags a second intent (from the Step 7 fix), the script now offers to process that flagged part as its own note right there, instead of just telling you about it and leaving the rest to you

**Why this mattered more than it might seem:** none of these three things test the model's reasoning at all — they're pure interface, no AI involved. But a tool that only writes and never lets you see, fix, or complete what it wrote isn't something you'd actually keep using, no matter how good the classification underneath is. The reasoning was the hard, interesting part to build. This was the boring part that decides whether the project gets used tomorrow or forgotten.

Deliberately skipped for now: turning the eval suite into a formal regression-testing setup, and packaging the script for distribution. Both are legitimate software practices, but they solve problems this project doesn't have yet — there's no team depending on this code, and no one else installing it. Worth doing if this ever grows past a personal tool; premature otherwise.

---

## Where this project stands, for real this time

Eight steps, each earned through something that actually happened: classification with retry and validation, tools that write to real files, correctness rules that differ by data type, memory built on resent context, an honest failure that exposed the gap between well-formatted and actually right, deliberate failure testing, an eval suite that found real problems and then confirmed real fixes, and finally the plain usability work that turns a working demo into a tool you'd actually reach for.

What's genuinely left, if this continues: real voice input (would need a separate speech-to-text service, since Claude itself doesn't transcribe audio), and wiring output to real destinations you already use — a shared grocery list app, a real task manager — instead of local text files. Both are legitimate next steps, not urgent ones.

What was deliberately never built here, and why: multiple agents that genuinely disagree with each other. That idea needs a project built around real conflicting objectives to be worth doing at all — a single classification task doesn't naturally have that tension. That's the next project, not an extension of this one.
