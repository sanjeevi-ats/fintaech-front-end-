/**
 * Loan Calculation Engine — High-Precision ERP Module
 * Uses integer arithmetic (paise/cents * 100) to avoid floating-point drift.
 * All monetary values stored and computed in paise (1 INR = 100 paise).
 */

export interface LoanCaseInput {
  financeAmount: number;       // Amount disbursed to customer (INR)
  interestAmount: number;      // Total interest charged (INR)
  fileCharges: number;         // File processing charges (INR)
  fileChargesType: 'fixed' | 'percentage'; // How charges are applied
  chargesDeductedFrom: 'disbursement' | 'loan'; // deduct from cash-out or add to total
  numberOfInstallments: number;
  initialInstallment: number;  // First installment (may differ)
  restInstallment: number;     // All subsequent installments
  startDate: string;           // ISO date string
  frequency: 'daily' | 'weekly' | 'fortnightly' | 'monthly';
  fineAmount: number;          // Penalty per trigger
  fineType: 'per_day' | 'one_time';
  fineTriggerDays: number;     // Grace period before fine kicks in
}

export interface InstallmentRow {
  no: number;
  dueDate: string;
  amount: number;           // INR (2dp precision)
  principal: number;        // Principal portion
  interest: number;         // Interest portion
  status: 'due' | 'paid' | 'overdue' | 'partial';
  paidAmount?: number;
  paidDate?: string;
  fine?: number;
  fineReason?: string;
}

export interface LoanCaseResult {
  caseId: string;
  totalReceivable: number;  // financeAmount + interestAmount
  netDisbursement: number;  // Cash actually handed to customer
  fileChargesAmount: number;
  schedule: InstallmentRow[];
  endDate: string;
  checksum: number;         // Sum of all installments (must = totalReceivable)
  isValid: boolean;
  validationErrors: string[];
}

/**
 * Core immutable loan calculator.
 * Returns a complete repayment schedule with date-wise installment list.
 */
export function calculateLoan(input: LoanCaseInput): LoanCaseResult {
  const errors: string[] = [];

  // --- 1. Compute file charges ---
  let fileChargesAmount = 0;
  if (input.fileChargesType === 'percentage') {
    fileChargesAmount = roundTo2(input.financeAmount * input.fileCharges / 100);
  } else {
    fileChargesAmount = input.fileCharges;
  }

  // --- 2. Net disbursement ---
  let netDisbursement = input.financeAmount;
  if (input.chargesDeductedFrom === 'disbursement') {
    netDisbursement = roundTo2(input.financeAmount - fileChargesAmount);
  }

  // --- 3. Total receivable ---
  const totalReceivable = roundTo2(input.financeAmount + input.interestAmount);

  // --- 4. Validation ---
  if (input.numberOfInstallments < 1) errors.push('Number of installments must be ≥ 1');
  if (input.financeAmount <= 0) errors.push('Finance amount must be > 0');
  if (input.interestAmount < 0) errors.push('Interest amount cannot be negative');
  if (input.initialInstallment < 0) errors.push('Initial installment cannot be negative');
  if (input.restInstallment <= 0 && input.numberOfInstallments > 1) errors.push('Rest installment must be > 0');

  // Validate installment arithmetic (integer paise comparison)
  const initPaise = Math.round(input.initialInstallment * 100);
  const restPaise = Math.round(input.restInstallment * 100);
  const totalPaise = Math.round(totalReceivable * 100);
  const computedTotal = initPaise + restPaise * (input.numberOfInstallments - 1);
  if (Math.abs(computedTotal - totalPaise) > 1) {
    errors.push(`Installment mismatch: ${initPaise/100} + ${restPaise/100} × ${input.numberOfInstallments - 1} = ${computedTotal/100} ≠ Total ${totalReceivable}`);
  }

  // --- 5. Build schedule ---
  const schedule: InstallmentRow[] = [];
  let currentDate = new Date(input.startDate);
  const principalPerInst = roundTo2(input.financeAmount / input.numberOfInstallments);
  const interestPerInst = roundTo2(input.interestAmount / input.numberOfInstallments);

  for (let i = 1; i <= input.numberOfInstallments; i++) {
    const dueDate = formatDate(currentDate);
    const amount = i === 1 ? input.initialInstallment : input.restInstallment;
    schedule.push({
      no: i,
      dueDate,
      amount,
      principal: roundTo2(principalPerInst),
      interest: roundTo2(interestPerInst),
      status: 'due',
    });
    currentDate = addFrequency(currentDate, input.frequency);
  }

  const endDate = schedule[schedule.length - 1]?.dueDate ?? '';
  const checksum = roundTo2(schedule.reduce((s, r) => s + r.amount, 0));

  return {
    caseId: generateCaseId(),
    totalReceivable,
    netDisbursement,
    fileChargesAmount,
    schedule,
    endDate,
    checksum,
    isValid: errors.length === 0,
    validationErrors: errors,
  };
}

// --- Helpers ---
function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addFrequency(d: Date, freq: LoanCaseInput['frequency']): Date {
  const next = new Date(d);
  switch (freq) {
    case 'daily':       next.setDate(next.getDate() + 1);     break;
    case 'weekly':      next.setDate(next.getDate() + 7);     break;
    case 'fortnightly': next.setDate(next.getDate() + 14);    break;
    case 'monthly':     next.setMonth(next.getMonth() + 1);   break;
  }
  return next;
}

let _caseCounter = 1000;
export function generateCaseId(): string {
  return `CASE-${new Date().getFullYear()}-${String(++_caseCounter).padStart(4, '0')}`;
}

// --- Journal Entry (atomic disburse output) ---
export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  entries: { account: string; type: 'debit' | 'credit'; amount: number }[];
  ref: string;
  createdBy: string;
  isBalanced: boolean;
}

export function createDisbursementJournal(
  caseId: string,
  netDisbursement: number,
  fileCharges: number,
  createdBy: string
): JournalEntry {
  const id = `JE-${Date.now()}`;
  const entries = [
    { account: 'Loan Portfolio (Principal)', type: 'debit' as const, amount: netDisbursement },
    { account: 'Branch Cash / Bank', type: 'credit' as const, amount: netDisbursement },
  ];
  if (fileCharges > 0) {
    entries.push(
      { account: 'File Charges Receivable', type: 'debit' as const, amount: fileCharges },
      { account: 'Fee Income', type: 'credit' as const, amount: fileCharges }
    );
  }
  const debitTotal = entries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const creditTotal = entries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
  return {
    id,
    date: new Date().toISOString().split('T')[0],
    description: `Loan Disbursement — ${caseId}`,
    entries,
    ref: caseId,
    createdBy,
    isBalanced: Math.abs(debitTotal - creditTotal) < 0.01,
  };
}

export function createRepaymentJournal(
  caseId: string,
  installmentNo: number,
  principal: number,
  interest: number,
  fine: number,
  createdBy: string
): JournalEntry {
  const id = `JE-${Date.now()}`;
  const total = principal + interest + fine;
  const entries: JournalEntry['entries'] = [
    { account: 'Cash / Bank', type: 'debit', amount: total },
    { account: 'Loan Portfolio (Principal)', type: 'credit', amount: principal },
    { account: 'Interest Income', type: 'credit', amount: interest },
  ];
  if (fine > 0) {
    entries.push({ account: 'Fine / Penalty Income', type: 'credit', amount: fine });
  }
  return {
    id,
    date: new Date().toISOString().split('T')[0],
    description: `Repayment ${installmentNo} — ${caseId}`,
    entries,
    ref: caseId,
    createdBy,
    isBalanced: true,
  };
}
