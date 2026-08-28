export type PayrollRunStatus = 'DRAFT' | 'PREVIEW' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'VOID';

const ALLOWED_RUN_TRANSITIONS: Record<PayrollRunStatus, PayrollRunStatus[]> = {
  DRAFT: ['PREVIEW', 'CALCULATED', 'VOID'],
  PREVIEW: ['CALCULATED', 'APPROVED', 'VOID'],
  CALCULATED: ['APPROVED', 'PAID', 'VOID'],
  APPROVED: ['PAID', 'VOID'],
  PAID: ['VOID'], // Paid records can only be voided under audited protocol
  VOID: [] // Void records are immutable
};

export function validateRunStatusTransition(
  currentStatus: string,
  targetStatus: string
): { isValid: boolean; errorMessage?: string } {
  const current = (currentStatus || 'PREVIEW').toUpperCase() as PayrollRunStatus;
  const target = (targetStatus || '').toUpperCase() as PayrollRunStatus;

  if (current === 'VOID') {
    return {
      isValid: false,
      errorMessage: `Payroll run record is VOID and immutable. Status cannot be modified.`
    };
  }

  if (current === target) {
    return { isValid: true };
  }

  const allowed = ALLOWED_RUN_TRANSITIONS[current] || [];
  if (!allowed.includes(target)) {
    return {
      isValid: false,
      errorMessage: `Invalid payroll run status transition from '${current}' to '${target}'. Allowed transitions: [${allowed.join(', ')}].`
    };
  }

  return { isValid: true };
}
