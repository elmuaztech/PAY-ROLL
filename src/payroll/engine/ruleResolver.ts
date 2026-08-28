import { CalculationWarning } from './types';

export interface ResolvedRule {
  ruleCode: string;
  ruleName: string;
  isVerified: boolean;
  status: string;
}

export function resolveRuleVerification(
  ruleCode: string,
  ruleName: string,
  category: string,
  status: string,
  periodDate: string
): { isEligible: boolean; warning?: CalculationWarning } {
  // If rule is explicitly PENDING_VERIFICATION or Statutory without official verification
  if (status === 'PENDING_VERIFICATION' || (category === 'STATUTORY' && status !== 'VERIFIED' && status !== 'Active')) {
    return {
      isEligible: false,
      warning: {
        code: 'STATUTORY_UNVERIFIED',
        message: `Statutory rule '${ruleName}' (${ruleCode}) is PENDING_VERIFICATION. Official Nigerian statutory formulas must be verified before inclusion in final payroll calculation.`,
        isComplianceNotice: true
      }
    };
  }

  if (status === 'INACTIVE' || status === 'Inactive') {
    return {
      isEligible: false,
      warning: {
        code: 'RULE_INACTIVE',
        message: `Rule '${ruleName}' is marked INACTIVE and will be excluded from payroll calculation.`
      }
    };
  }

  return { isEligible: true };
}
