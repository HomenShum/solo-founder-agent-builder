import { existsSync } from "node:fs";
import {
  componentLedgerPath,
  isCompositionalGoal,
  readComponentRalphLedger,
  verifyComponentRalphLedger,
  type ComponentRalphLedger,
} from "./componentRalphRunner";

export type ComponentJudgeVerdict = {
  schemaVersion: 1;
  ok: boolean;
  status: "pass" | "not_done" | "blocked" | "not_required";
  reason: string;
  componentLedgerPath: string;
  requiredNextActions: Array<{ kind: "command" | "receipt"; command?: string; receipt?: string; description: string }>;
  missingProofs: string[];
};

export function judgeComponentLayer(input: {
  projectPath: string;
  goal?: string;
  ledger?: ComponentRalphLedger;
  componentId?: string;
  requireFiles?: boolean;
  requireCompleted?: boolean;
}): ComponentJudgeVerdict {
  const path = componentLedgerPath(input.projectPath);
  const requiredByGoal = input.goal ? isCompositionalGoal(input.goal) : false;
  const ledger = input.ledger ?? readComponentRalphLedger(input.projectPath);

  if (!ledger) {
    if (!requiredByGoal && !existsSync(path)) {
      return {
        schemaVersion: 1,
        ok: true,
        status: "not_required",
        reason: "No component ledger is present and the goal did not trigger compositional proof automatically.",
        componentLedgerPath: path,
        requiredNextActions: [],
        missingProofs: [],
      };
    }
    return {
      schemaVersion: 1,
      ok: false,
      status: "blocked",
      reason: "Compositional output requires .solo/ledgers/component-ralph.json before the parent claim can pass.",
      componentLedgerPath: path,
      requiredNextActions: [
        {
          kind: "command",
          command: 'npm run sfn -- component init --domain <domain> --goal "<goal>" --project .',
          description: "Create the component RALPH ledger for production-critical components.",
        },
      ],
      missingProofs: [".solo/ledgers/component-ralph.json"],
    };
  }

  const verdict = verifyComponentRalphLedger(ledger, {
    baseDir: input.projectPath,
    requireFiles: input.requireFiles ?? true,
    requireCompleted: input.requireCompleted ?? true,
    componentId: input.componentId,
  });
  return {
    schemaVersion: 1,
    ok: verdict.ok,
    status: verdict.ok ? "pass" : "not_done",
    reason: verdict.ok
      ? "Required component RALPH proofs pass."
      : `Missing Component RALPH proofs: ${verdict.missingProofs.slice(0, 8).join(", ") || verdict.errors[0] || "unknown"}`,
    componentLedgerPath: path,
    requiredNextActions: verdict.ok
      ? []
      : [
          {
            kind: "command",
            command: input.componentId
              ? `npm run sfn -- component judge --id ${input.componentId} --project .`
              : "npm run sfn -- component proof --all --project .",
            description: "Generate or verify required component receipts before parent proof.",
          },
        ],
    missingProofs: verdict.missingProofs,
  };
}
