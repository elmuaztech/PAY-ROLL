import Decimal from 'decimal.js';
import { EngineItemBreakdown } from './types';

// Set default rounding mode for financial calculations: ROUND_HALF_UP (standard banking rounding)
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export function toMoneyDecimal(val: number | string | Decimal): Decimal {
  return new Decimal(val || 0).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function calculateEmployeeEarnings(
  basicSalary: number | string,
  allowanceRules: any[],
  employeeAssignments: any[],
  periodStartDate: string
): { totalAllowances: number; grossPay: number; items: EngineItemBreakdown[] } {
  const items: EngineItemBreakdown[] = [];
  const basicDec = toMoneyDecimal(basicSalary);

  // Always add Basic Salary line item
  items.push({
    itemType: 'BASIC',
    itemName: 'Monthly Basic Salary',
    sourceType: 'CONTRACT',
    amount: basicDec.toNumber(),
    calculationMethodSnapshot: 'CONTRACT_BASIC_SALARY'
  });

  let totalAllowancesDec = new Decimal(0);

  allowanceRules.forEach(rule => {
    if (rule.status === 'INACTIVE' || rule.status === 'Inactive') return;

    const assignment = employeeAssignments.find(a => a.allowanceId === rule.id && a.status === 'ACTIVE');

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

    if (itemAmountDec.greaterThan(0)) {
      totalAllowancesDec = totalAllowancesDec.plus(itemAmountDec).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      items.push({
        itemType: 'ALLOWANCE',
        itemName: rule.name,
        sourceType: rule.code || 'ALLOWANCE_RULE',
        sourceReferenceId: rule.id,
        amount: itemAmountDec.toNumber(),
        calculationMethodSnapshot: methodSnapshot
      });
    }
  });

  const grossPayDec = basicDec.plus(totalAllowancesDec).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    totalAllowances: totalAllowancesDec.toNumber(),
    grossPay: grossPayDec.toNumber(),
    items
  };
}
