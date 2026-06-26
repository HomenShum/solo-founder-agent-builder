export type ReadabilityJudgement = {
  ok: boolean;
  errors: string[];
  score: number;
};

export type ReadabilityReviewInput = {
  changedFiles: string[];
  centralizedPolicy: boolean;
  understandableNames: boolean;
  userFacingErrorHasNextAction: boolean;
  patchSmallerThanBehaviorReplaced: boolean;
  rawProviderErrorsTranslated: boolean;
  notes?: string[];
};

export function judgeRepairReadability(input: ReadabilityReviewInput): ReadabilityJudgement {
  const errors: string[] = [];
  if (input.changedFiles.length === 0) errors.push("no changed files listed");
  if (!input.centralizedPolicy) errors.push("policy is not centralized");
  if (!input.understandableNames) errors.push("function/type names are not understandable");
  if (!input.userFacingErrorHasNextAction) errors.push("user-facing error lacks a next action");
  if (!input.patchSmallerThanBehaviorReplaced) errors.push("patch is not smaller or clearer than the behavior it replaces");
  if (!input.rawProviderErrorsTranslated) errors.push("raw provider errors are not translated into useful language");
  return {
    ok: errors.length === 0,
    errors,
    score: Number(((6 - errors.length) / 6).toFixed(2)),
  };
}
