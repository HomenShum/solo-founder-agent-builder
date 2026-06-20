# Solo Founder Nodes

**Honest agent skills for one-person companies — output that gets *accepted*, no team required.**

## Why "Solo Founder Nodes"

A solo founder is a one-person org chart: analyst, designer, QA, eval engineer, marketer — all you.
The danger isn't doing the work; it's that an AI will quietly smooth over the gaps — an invented
number, a faked citation, a demo that doesn't survive contact with a real user, a benchmark score
that's secretly hardcoded. You can't staff a team to catch that.

**These skills are that team.** Each one is the honesty conscience for a function you'd otherwise
hire out — so a one-person company can ship work that's *trustworthy without a second pair of eyes.*

The bar isn't "technically correct." It's **accepted** — work a client, an investor, or a user takes
on the first pass. (Origin: on BankerToolBench, the best AI model's banker deliverables were **0%
client-ready** — the misses were diligence, not IQ. The gap between *correct* and *accepted* is the
whole game, and it's where a solo founder lives or dies.)

## Why "Nodes"

Born from **NodeRoom**, a live war room where humans and agents co-edit real artifacts without
clobbering each other. Each skill is a **node**: one function, done honestly, composable with the
rest. You don't install a monolith — you snap together the nodes a one-person company actually needs.

## The suite

**Honesty primitives** (use standalone):
- **`cited-sources`** — prove a claim by boxing the exact supporting line on the exact page; refuses
  (`unsupported`) if the quote isn't really in the document. The source trail that turns *correct*
  into *accepted*.
- **`powerpoint`** — turn messy notes into a deck where **every claim is tagged** `verified` /
  `manual` / `needs_review`. Nothing is invented; what you can't source gets flagged, not faked.

**The proving engine** (`solo-founder-nodes` master + phase nodes):
**Benchmark-driven development for your agent.** Point the coding agent you already use (Claude Code,
Codex, OpenClaw, Hermes, Trae) at the master, and it runs the loop:

`discover → benchmark → setup → build → adapter → iterate → transfer`

It doesn't just *build* your agent (every coding agent does that). It **proves the agent actually
works** — against a real benchmark, **in your real app, on the live UI, without cheating.**

## The one rule across every node

**Provenance, or it doesn't ship.** Every number traces to a source or a recorded run; held-out
splits and in-app transfer mean a score *can't* be faked.

> Receipt: a coding fleet once drove a benchmark to **0.96** using hardcoded per-task answer-keys,
> while the agent's true held-out capability was **0.008**. Solo Founder Nodes exists to catch
> exactly that — for the founder who has no one else to catch it.

## Using them

Cross-vendor **SKILL.md** — works under any coding agent. Install the nodes you need; the master
orchestrates the proving loop. Shipped on SkillHunt; **reupload-to-upgrade** as each node deepens.

## Use it with your coding agent

Solo Founder Nodes is portable **SKILL.md** — it works with any coding agent (Claude Code, Codex,
OpenClaw, Hermes, Trae, …). Paste this into your agent, **inside your own project**:

> Fetch the Solo Founder Nodes skills from https://github.com/HomenShum/solo-founder-nodes (clone it,
> or read the raw files). Then act as the master directive in `skills/solo-founder-nodes/SKILL.md` →
> `MASTER_SKILL.md`: run benchmark-driven development on THIS project — discover what my agent should
> do, recommend a benchmark, set it up, build the missing agent + UI, wire the adapter, iterate, and
> verify it in my live app UI — reading each phase's playbook in `skills/solo-founder-nodes/nodes/`.
> Obey the non-negotiables: held-out (never tune on what you score), no answer-keys, in-app transfer
> (a score counts only if it reproduces in my real UI), honest provenance (report the real number).
> Gate any install / spend / code change on my approval, and log each phase: what you did, the result,
> and what you COULD NOT do.

**Claude Code:** copy `skills/solo-founder-nodes/`, `skills/cited-sources/`, `skills/powerpoint/` into
your project's `.claude/skills/` — it auto-loads `SKILL.md`. **Other agents:** point them at the
GitHub files and have them follow `SKILL.md` → `MASTER_SKILL.md` as the playbook.


## Repo layout
- `skills/solo-founder-nodes/` — `SKILL.md` (loader entry) + `MASTER_SKILL.md` (full directive) + 7 phase playbooks in `nodes/` + `references/`.
- `skills/cited-sources/`, `skills/powerpoint/` — standalone honesty primitives.
- `docs/eval/nonbtb/` — runnable deterministic example grader; `docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md` — the anti-overfit protocol.

Distilled from **NodeRoom** (the origin).
