/**
 * uiCoverage.ts — portable type/interface for the UI coverage report emitted by adapters
 * implementing the 7-step Fresh-Room Live Browser Contract (see `nodes/7-verify.md`).
 *
 * Mirrors the CONTRACT shape used in NodeRoom's dogfood `src/eval/officialBenchmarkUiCoverage.ts`
 * (sibling to the existing `src/eval/officialBenchmarkTaskCoverage.ts`). This file ships only
 * the type — the live implementation belongs in each founder's own app. The skill stays
 * portable; the dogfood file is the worked example.
 *
 * Honest-lane rule: every field below must be derived from RECEIPTS (Playwright trace path,
 * Convex run id, exported-bytes sha, official scorer exit code) — NEVER from agent self-report.
 * Same S9 derive-don't-accept rule that governs `ledger_tasks.derived_clean`.
 */

export type UiCoverageStatus = "complete" | "partial" | "missing";

export type UiCoverageTrack = {
  /** Stable track id (e.g. "spreadsheetbench-v1-verified"). */
  id: string;
  title: string;
  benchmark: "SpreadsheetBench" | "SpreadsheetBench 2" | "BankerToolBench" | "NodeRoom" | (string & {});
  /** Official task count per the benchmark's published spec — the denominator that matters. */
  officialExpectedTasks: number;
  /** URLs the official task list / spec was scraped from (provenance, not opinion). */
  officialSourceUrls: string[];
  /** Local scope label for this track (e.g. "sample_data_200", "full_dataset"). */
  localScope: string;

  // --- the staged-vs-ran columns (mirror officialBenchmarkTaskCoverage) ---
  scannedTasks: number;
  stagedTasks: number;
  skippedTasks: number;
  deterministicRunTasks: number;
  modelRunCases: number;
  modelRunAttempts: number;
  passRate: number | null;

  // --- NEW: the live-browser-UI columns this contract introduces ---
  /** Count of tasks that passed the full 7-step Fresh-Room Live Browser Contract. */
  liveBrowserRoomCases: number;
  /** All deliverable shapes this track spans (e.g. ["xlsx-cell", "xlsx-sheet", "chart", "json", "citation"]). */
  deliverableTypes: string[];
  /** True IFF every official task ran AND passed the live-browser contract AND every deliverable type
   *  has at least one passing row. Derived from `liveBrowserRoomCases` + `deliverableTypes` coverage. */
  allOfficialTasksLiveBrowserVerified: boolean;
  /** Per-deliverable-type breakdown — `partial` shows up here first when one shape is missing. */
  liveBrowserCoverageByType: Record<string, { passed: number; quarantined: number; failed: number }>;

  // --- staging/run booleans the parent track-coverage already exposes ---
  allOfficialTasksStaged: boolean;
  allOfficialTasksRunWithModel: boolean;

  /** Status rolls up the booleans: complete = every official task verified AND every type covered. */
  status: UiCoverageStatus;
  /** Evidence pointers (playwright trace paths, screenshot dirs, ledger run ids) — concrete files. */
  evidence: string[];
  /** Named blockers explaining why this track is not `complete`. */
  blockers: string[];
};

export type UiCoverageReport = {
  schema: 1;
  generatedAt?: string;
  summary: {
    tracks: number;
    completeTracks: number;
    partialTracks: number;
    missingTracks: number;
    totalOfficialExpectedTasks: number;
    totalStagedTasks: number;
    totalDeterministicRunTasks: number;
    totalModelRunCases: number;
    totalModelRunAttempts: number;
    totalLiveBrowserRoomCases: number;
    /** Top-level honesty flag — true IFF every track is `complete` AND every track's
     *  `allOfficialTasksLiveBrowserVerified` is true. Falsified by ANY partial track. */
    strictUiCoverageReady: boolean;
  };
  /** Policy bullets the report enforced (e.g. "no harness shims", "all deliverable types required"). */
  policy: string[];
  tracks: UiCoverageTrack[];
};
