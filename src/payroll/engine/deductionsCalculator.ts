import Decimal from 'decimal.js';
import { EngineItemBreakdown, CalculationWarning } from './types';
import { toMoneyDecimal } from './earningsCalculator';
import { resolveRuleVerification } from './ruleResolver';

export function calculateEmployeeDeductions(
  basicSalary: number | string,
  grossPay: number | string,
  deductionRules: any[],
  employeeAssignments: any[],
  periodStartDate: string
): { totalDeductions: number; netPay: number; items: EngineItemBreakdown[]; warnings: CalculationWarning[] } {
  const items: EngineItemBreakdown[] = [];
  const warnings: CalculationWarning[] = [];
  const basicDec = toMoneyDecimal(basicSalary);
  const grossDec = toMoneyDecimal(grossPay);

  let totalDeductionsDec = new Decimal(0);

  deductionRules.forEach(rule => {
    // Verify statutory & verification status
    const ruleCheck = resolveRuleVerification(
      rule.code || 'DEDUCTION',
      rule.name,
      rule.category || 'ORGANIZATION',
      rule.status || 'ACTIVE',
      periodStartDate
    );

    if (!ruleCheck.isEligible) {
      if (ruleCheck.warning) warnings.push(ruleCheck.warning);
      return; // Exclude unverified statutory rules from calculation
    }

    const assignment = employeeAssignments.find(a => a.deductionId === rule.id && a.status === 'ACTIVE');

    let itemAmountDec = new Decimal(0);
    let methodSnapshot = rule.calculationMethod || 'FIXED_AMOUNT';

    if (assignment && assignment.overrideValue !== null && assignment.overrideValue !== undefined) {
      itemAmountDec = toMoneyDecimal(assignment.overrideValue);
      methodSnapshot = `EMPLOYEE_OVERRIDE_FIXED (${itemAmountDec.toFixed(2)})`;
    } else {
      const defValDec = toMoneyDecimal(rule.defaultValue || rule.value || 0);
      if (rule.calculationMethod === 'PERCENTAGE_OF_BASIC' || rule.amountType === 'Percentage') {
        itemAmountDec = basicDec.times(defValDec).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        methodSnapshot = `PERCENTAGE_OF_BASIC (${defValDec.toFixed(2)}%)`;
      } else {
        itemAmountDec = defValDec;
        methodSnapshot = `FIXED_AMOUNT (${defValDec.toFixed(2)})`;
      }
    }

    // Prevent negative deduction amounts
    if (itemAmountDec.lessThan(0)) itemAmountDec = new Decimal(0);

    if (itemAmountDec.greaterThan(0)) {
      totalDeductionsDec = totalDeductionsDec.plus(itemAmountDec).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      items.push({
        itemType: rule.category === 'STATUTORY' ? 'TAX' : 'DEDUCTION',
        itemName: rule.name,
        sourceType: rule.code || 'DEDUCTION_RULE',
        sourceReferenceId: rule.id,
        amount: itemAmountDec.toNumber(),
        calculationMethodSnapshot: methodSnapshot
      });
    }
  });

  const netPayDec = grossDec.minus(totalDeductionsDec).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  if (netPayDec.lessThan(0)) {
    warnings.push({
      code: 'NEGATIVE_NET_PAY',
      message: `Calculated net pay (₦${netPayDec.toFixed(2)}) is below zero for this employee. Please review deductions.`
    });
  }

  return {
    totalDeductions: totalDeductionsDec.toNumber(),
    netPay: netPayDec.toNumber(),
    items,
    warnings
  };
}
