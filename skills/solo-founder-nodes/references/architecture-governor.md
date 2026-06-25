# Architecture Governor

The Architecture Governor keeps the agent from editing a system it no longer understands. Every direction change or architecture-relevant build step must refresh a canonical system map before the agent claims progress.

Required artifact:

- `docs/system-map.graph.json`

Required command path:

- `sfn graph init --goal "<goal>" --project .`
- `sfn graph validate --project .`
- `sfn graph render --project . --out docs/system-map.md`

The map must include user-facing UI, agent loop, research spine, proof registry, and component ledger nodes. Project-specific nodes should add storage, deployment, model providers, asset pipelines, MCP servers, or DCC tools as needed.

Completion rules:

- Direction changes require a system map update.
- Architecture-relevant code changes without a fresh system map are not done.
- The fresh-context judge should block completion if the direction receipt exists but the system map is missing or invalid.
- The map is not a diagram for the user; it is the control-plane contract the coding agent uses to orient itself.
