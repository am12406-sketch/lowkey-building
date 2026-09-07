# lowkey-building

A running record of things I've built — some AI agents, some not. Each one documented honestly, including what broke and what I'd do differently, not just a polished final result.

**What makes this different from a template library:** most project repos show only the finished, working version. Every project here that has a build log includes the real failures — bugs found, how they were diagnosed, how they were fixed — verified with tests where that makes sense, not just eyeballed. If a project doesn't have that kind of documentation yet, it's noted as such below, not hidden.

## Projects

| Project | What it does | Status | Notes |
|---|---|---|---|
| [voice-note-router](./voice-note-router) | Speak a thought, it gets classified and routed to the right list (grocery/task/idea) automatically — real voice input, not just text | Working, in daily use | Full build log with 2 real bugs found via eval suite and fixed |
| trip-planner *(in progress)* | Three AI agents with conflicting goals (budget, experience, logistics) negotiate a real travel itinerary | Scoping | — |
| [get-it-done-today](./get-it-done-today) | Daily work clarity tool | Live at getitdonetoday.replit.app | Build log not yet written |
| [game-of-life](./game-of-life) | Conway's Game of Life, no signups required | Built | Build log not yet written |
| [newsletter-brief-automation](./newsletter-brief-automation) | Automated weekly newsletter digest via Claude Cowork | Working | Build log not yet written |

## How projects are documented

Where a build log exists, it covers: real prompts used, real bugs hit, real fixes, and why each design decision was made the way it was — not just what the final code looks like. Older projects are being backfilled with this level of documentation over time; new projects get it from day one.

## Stack

Claude (Anthropic API) for reasoning-heavy projects, Claude Code for development, Python for most agent logic. Each project's own README lists specifics.

## About

Built by [Ankit Mourya](https://www.linkedin.com/in/ankitmourya-pm) — Product Manager, learning to build the systems I'd otherwise just spec for engineers.

