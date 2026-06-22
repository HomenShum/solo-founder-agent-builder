# Start here — no coding required

You do **not** need to be a developer. You need one thing: an **AI coding tool** you already use —
Claude Code, Cursor, Windsurf, Codex, Trae, OpenClaw, Hermes, OpenCode, or Kilo Code.

**Paste this one message into your AI coding tool, sitting in your app's folder:**

> I'm not a coder. Use the Solo Founder Nodes skill (github.com/HomenShum/solo-founder-agent-builder)
> on **my app**, end to end. Don't run an off-the-shelf benchmark just because one exists —
> look at what my app actually does, decide what "the AI agent works here" means for *this* app,
> then either pick a public benchmark whose tasks transfer to my app **or build a small set of real
> tasks from how my app is actually used**. Build / wire up whatever's needed, run a real and honest
> test in my live app (no cheating, no hardcoded answers), then tell me in plain English: did it
> actually work, what's the real number, what's the single most useful thing to fix next.
> Do all the technical setup yourself; don't ask me to run commands or read code. If you need to
> choose something and I haven't said, pick the best option and tell me why.

That's it. The tool figures out what your app is, picks the right way to test it, sets up what it
needs, runs it, grades it honestly, and comes back with a plain-English answer **about your app**.

## What you'll get
- A straight answer about **your app**: does the agent actually work in it, and how well —
  the *real* number, even if low.
- **No fake wins.** The skill is built so the tool can't quietly cheat to make the score look
  good; if it hardcoded an answer, that doesn't count, and it will tell you.
- **One next step** — the single most useful thing to improve, in plain language.

## What you need (the honest small print)
- Your app (any state — half-built is fine; the discover phase reads what's there).
- An AI coding tool (above). The skill does the rest.
- Optionally, an AI model key for fully unattended runs. If you don't have one, the tool can act
  as the worker itself and tell you the trade-off. It will **never** spend money or download
  anything outside what you've allowed without telling you first.

## "But I just want to see it work somewhere first"
The skill ships with a **worked example** in [`skills/solo-founder-nodes/templates/run/`](skills/solo-founder-nodes/templates/run/) —
the same loop wrapped around a public spreadsheet benchmark (SpreadsheetBench), with one task
genuinely solved and one honestly failed. It exists to show the *shape* of an adapter; it is **not**
"what the skill does." For your own app the skill picks or builds the right adapter for you.
