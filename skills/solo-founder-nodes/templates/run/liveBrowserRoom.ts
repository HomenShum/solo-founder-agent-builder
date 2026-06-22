/**
 * liveBrowserRoom.ts — REFERENCE ADAPTER (shape only, sibling to spreadsheetbench.py)
 *
 * This file is the executable form of the 7-step Fresh-Room Live Browser Contract from
 * `nodes/7-verify.md`. It is NOT a runnable harness — it is the shape every per-app adapter
 * copies, the way `spreadsheetbench.py` is the shape every per-benchmark python adapter copies.
 * Each app writes its own concrete sibling (`liveBrowserRoom.spreadsheetbench.ts`,
 * `liveBrowserRoom.bankertoolbench.ts`, `liveBrowserRoom.noderoom.ts`, …) implementing these
 * signatures against its own substrate (Playwright + Convex + the app's real UI).
 *
 * ============================================================================================
 * HONEST-LANE BOUNDARIES (read this before implementing)
 * ============================================================================================
 *   1. FRESH ROOM PER TASK. No room reuse across tasks. No pre-seeded artifacts. No prior memory.
 *      Quarantine boundary = a per-task room id with an empty work surface at t=0. If you cannot
 *      prove this from a Playwright trace, the row is `live_browser_room_passed = 0`.
 *
 *   2. NO HARNESS SHIMS. Every step drives the REAL user-facing path:
 *        - import = the real file picker / drop zone (NOT db.insert, NOT a fixture loader)
 *        - ask    = the real composer (NOT a direct call to the agent runtime)
 *        - export = the real export button (NOT a Convex row read, NOT in-memory bytes)
 *      Driving a hidden code path and calling it "in-app" is the cheat this contract catches.
 *
 *   3. NO PER-TASK CODE BRANCH. The substrate must NOT detect the task id and route to a
 *      special-cased import / prompt / export path. If `taskId === 'X' ? doX() : doGeneric()`
 *      appears anywhere in the adapter, the run is an answer-key, not capability.
 *
 *   4. DETERMINISTIC READINESS, NOT sleep(N). `waitForArtifact` must resolve on a DOM signal
 *      (testid present + Convex run id resolved) — never a wall-clock sleep. A sleep-poll
 *      hides Suspense/SSR blank-shell traps and silently passes failed runs.
 *
 *   5. OFFICIAL SCORER UNCHANGED. `gradeWithOfficial` must invoke the benchmark's own grader
 *      (SpreadsheetBench `evaluation.compare_workbooks`, the BankerToolBench official contract,
 *      etc.) on the EXPORTED bytes. No softening, no re-implementation, no "we use our own
 *      grader that's basically the same." If the official scorer is python, shell out to it.
 *
 *   6. DERIVE, DON'T ACCEPT. `writeLedgerRow` derives `live_browser_room_passed` from the six
 *      receipt booleans on `GateEvidenceUi`. A self-reported "I passed" field from the agent
 *      MUST NOT influence the gate — it is used (if present) only to detect disagreement and
 *      quarantine. This mirrors S9 in `references/honest-lane.md`.
 *
 *   7. ALL DELIVERABLE TYPES REQUIRED. If the benchmark spans multiple deliverable shapes
 *      (cell-level xlsx, sheet-level xlsx, chart, json, citation), each shape must produce at
 *      least one passing live-browser row before `allOfficialTasksLiveBrowserVerified` flips
 *      true. Partial coverage = `partial`, not `complete`.
 * ============================================================================================
 */

import type { SoloLedger } from "../ledger/ledger";
import type { UiCoverageReport, UiCoverageTrack } from "../ledger/uiCoverage";

// --------------------------------------------------------------------------------------------
// Receipts — each step produces one, the ledger row is built from the six of them.
// A receipt is whatever the substrate captures to PROVE the step happened against the real UI.
// --------------------------------------------------------------------------------------------

/** Step 1 — fresh room exists, work surface is empty at t=0. */
export type FreshRoomReceipt = {
  roomId: string;
  /** Playwright trace path showing the empty work surface BEFORE the import step. */
  playwrightTracePath: string;
  /** Wall-clock timestamp when the room URL first rendered. */
  openedAt: number;
};

/** Step 2 — the held-out task artifact was uploaded through the real upload path. */
export type ImportReceipt = {
  /** The task id this artifact corresponds to (sealed held-out manifest member). */
  taskId: string;
  /** The Convex log/network entry for the upload. */
  uploadRunId: string;
  /** The work-surface testid that now renders the imported artifact. */
  artifactTestId: string;
  /** sha256 of the bytes that were uploaded (should match the sealed manifest). */
  importedSha256: string;
};

/** Step 3 — the agent was asked through the real composer with the literal task prompt. */
export type AskReceipt = {
  /** The exact prompt string that was submitted (verbatim, no template wrapper). */
  promptText: string;
  /** Composer keystroke trace path (or screenshot bundle) proving real-UI entry. */
  composerTracePath: string;
  /** The chat-feed message id of the submitted prompt. */
  messageId: string;
};

/** Step 4 — readiness was a DOM signal, not a sleep. */
export type WaitReceipt = {
  /** The Convex run id that resolved. */
  convexRunId: string;
  /** The work-surface testid that became visible (the answer cell / sheet / citation). */
  readinessTestId: string;
  /** Wall-clock timestamp of first paint of the readiness testid. */
  resolvedAt: number;
};

/** Step 5 — the rendered answer was exported via the real export path. */
export type ExportReceipt = {
  /** Path to the exported bytes on disk (what the official scorer will read). */
  exportedFilePath: string;
  /** sha256 of the exported bytes — graded artifact identity. */
  exportedSha256: string;
  /** Which real export button/action was used (e.g. "xlsx-export-button"). */
  exportPathLabel: string;
};

/** Step 6 — the benchmark's own official scorer ran, unchanged. */
export type ScorerReceipt = {
  /** Identifier of the official scorer invoked (e.g. "SpreadsheetBench/evaluation.compare_workbooks"). */
  scorerId: string;
  /** Process exit code from the scorer (0 = pass for most official graders, but check yours). */
  exitCode: number;
  /** Whatever structured result the official scorer returned, verbatim. */
  rawResult: unknown;
  /** Derived pass/fail — must come from the scorer, never from agent self-report. */
  passed: boolean;
};

/** The six booleans `recordTask` derives from when computing `live_browser_room_passed`. */
export type GateEvidenceUi = {
  freshRoomOk: boolean;
  importOk: boolean;
  askPathOk: boolean;
  waitOk: boolean;
  exportOk: boolean;
  officialScorerOk: boolean;
};

// --------------------------------------------------------------------------------------------
// Step signatures — copy these into the per-app sibling and implement against your substrate.
// --------------------------------------------------------------------------------------------

/** Step 1: spin up a fresh room URL, return its id once the empty work surface is visible. */
export type EnsureFreshRoom = (args: {
  taskId: string;
  /** Where the live app is reachable (local dev, dev Convex, prod URL). Live-DOM discipline applies. */
  liveAppUrl: string;
}) => Promise<FreshRoomReceipt>;

/** Step 2: drive the real upload path to import the sealed held-out artifact for this task. */
export type ImportHeldOut = (args: {
  roomId: string;
  taskId: string;
  /** Path to the sealed held-out artifact bytes on disk. The seal salt stays out of the agent's reach. */
  sealedArtifactPath: string;
}) => Promise<ImportReceipt>;

/** Step 3: ask the agent through the real composer — literal prompt, no template wrapper. */
export type AskAgent = (args: {
  roomId: string;
  /** The verbatim held-out task prompt. The harness MUST NOT mutate it per-task. */
  promptText: string;
}) => Promise<AskReceipt>;

/** Step 4: wait for a deterministic DOM readiness signal — never sleep-poll. */
export type WaitForArtifact = (args: {
  roomId: string;
  /** The testid the substrate expects to render when the answer is ready. */
  expectedReadinessTestId: string;
  /** Hard timeout — exceeding it fails the step, it does not silently pass. */
  timeoutMs: number;
}) => Promise<WaitReceipt>;

/** Step 5: export the rendered answer via the real export button. Reads from rendered UI, not memory. */
export type ExportArtifact = (args: {
  roomId: string;
  /** Which export path to use ("xlsx" | "json" | "csv" | …) — same options a user sees. */
  exportKind: string;
  /** Where to write the exported bytes for the scorer to pick up. */
  outDir: string;
}) => Promise<ExportReceipt>;

/** Step 6: feed the exported bytes into the benchmark's OWN official scorer, unchanged. */
export type GradeWithOfficial = (args: {
  taskId: string;
  exportedFilePath: string;
  /** Path to the benchmark's official grader (the canonical one, not a re-implementation). */
  officialScorerCmd: string;
}) => Promise<ScorerReceipt>;

/** Step 7: write the single ledger row, deriving `live_browser_room_passed` from the receipts. */
export type WriteLedgerRow = (args: {
  ledger: SoloLedger;
  runId: string;
  taskId: string;
  /** All six receipts must be present — a missing receipt yields `quarantined`, not `passed = 0`. */
  fresh: FreshRoomReceipt;
  imp: ImportReceipt;
  ask: AskReceipt;
  wait: WaitReceipt;
  exp: ExportReceipt;
  scorer: ScorerReceipt;
}) => Promise<{
  liveBrowserRoomPassed: boolean;
  quarantined: boolean;
  reasons: string[];
}>;

// --------------------------------------------------------------------------------------------
// The full per-task contract — every concrete adapter implements this same outer signature.
// The body is intentionally NOT provided: each app's substrate (Playwright selectors, Convex
// schema, export buttons, scorer CLI) differs, but the SHAPE is invariant.
// --------------------------------------------------------------------------------------------

export type RunLiveBrowserContract = (args: {
  ledger: SoloLedger;
  runId: string;
  taskId: string;
  liveAppUrl: string;
  sealedArtifactPath: string;
  promptText: string;
  expectedReadinessTestId: string;
  exportKind: string;
  outDir: string;
  officialScorerCmd: string;
  timeoutMs: number;
  // Substrate seams — supply the six step implementations for your app.
  ensureFreshRoom: EnsureFreshRoom;
  importHeldOut: ImportHeldOut;
  askAgent: AskAgent;
  waitForArtifact: WaitForArtifact;
  exportArtifact: ExportArtifact;
  gradeWithOfficial: GradeWithOfficial;
  writeLedgerRow: WriteLedgerRow;
}) => Promise<{
  liveBrowserRoomPassed: boolean;
  quarantined: boolean;
  reasons: string[];
  receipts: {
    fresh: FreshRoomReceipt;
    imp: ImportReceipt;
    ask: AskReceipt;
    wait: WaitReceipt;
    exp: ExportReceipt;
    scorer: ScorerReceipt;
  };
}>;

// --------------------------------------------------------------------------------------------
// Suite-level coverage roll-up — every adapter ALSO emits one of these per track so the
// top-level `strictUiCoverageReady` flag can be derived from real receipts, not from "we ran
// it once on the easy task." See `nodes/7-verify.md` "Coverage contract".
// --------------------------------------------------------------------------------------------

export type EmitUiCoverage = (args: {
  trackId: string;
  benchmark: UiCoverageTrack["benchmark"];
  /** All deliverable shapes this benchmark spans (e.g. ["xlsx-cell", "xlsx-sheet", "chart", "json"]). */
  deliverableTypes: string[];
  /** The per-task contract results that contribute to this track. */
  results: Array<{
    taskId: string;
    deliverableType: string;
    liveBrowserRoomPassed: boolean;
    quarantined: boolean;
  }>;
}) => UiCoverageTrack;

export type EmitUiCoverageReport = (tracks: UiCoverageTrack[]) => UiCoverageReport;

// --------------------------------------------------------------------------------------------
// NOT EXPORTED ON PURPOSE: there is no default `runLiveBrowserContract` implementation here.
// Copy this file's shape into your per-app sibling and wire each seam to your substrate. The
// skill is portable; the dogfood (NodeRoom) is implementing this contract in
// `src/eval/officialBenchmarkUiCoverage.ts` — reference it for a worked example, do not
// vendor it back into the skill.
// --------------------------------------------------------------------------------------------
