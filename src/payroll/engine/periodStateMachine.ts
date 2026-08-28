export type PeriodStatus = 'OPEN' | 'PROCESSING' | 'COMPLETED' | 'CLOSED';

const ALLOWED_PERIOD_TRANSITIONS: Record<PeriodStatus, PeriodStatus[]> = {
  OPEN: ['PROCESSING', 'COMPLETED', 'CLOSED'],
  PROCESSING: ['COMPLETED', 'CLOSED', 'OPEN'],
  COMPLETED: ['CLOSED'],
  CLOSED: [] // CLOSED periods cannot transition casually
};

export function validatePeriodStateTransition(
  currentStatus: string,
  targetStatus: string
): { isValid: boolean; errorMessage?: string } {
  const current = (currentStatus || 'OPEN').toUpperCase() as PeriodStatus;
  const target = (targetStatus || '').toUpperCase() as PeriodStatus;

  if (current === 'CLOSED') {
    return {
      isValid: false,
      errorMessage: `Payroll period is CLOSED and immutable. No state transitions or edits are permitted.`
    };
  }

  if (current === target) {
    return { isValid: true };
  }

  const allowed = ALLOWED_PERIOD_TRANSITIONS[current] || [];
  if (!allowed.includes(target)) {
    return {
      isValid: false,
      errorMessage: `Invalid period status transition from '${current}' to '${target}'. Allowed transitions: [${allowed.join(', ')}].`
    };
  }

  return { isValid: true };
}
