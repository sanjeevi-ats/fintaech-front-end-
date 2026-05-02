/**
 * ERP Mock Database — In-memory store for Cases, Receipts, Address Book
 * In production this maps to PostgreSQL with ACID transactions.
 */
import { LoanCaseResult, InstallmentRow, JournalEntry } from './loanEngine';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  phone2?: string;
  aadhaar: string;          // stored encrypted; displayed masked
  pan: string;
  dob: string;
  address: string;
  gpsLat?: number;
  gpsLng?: number;
  photo?: string;
  digitalSignature?: string;
  createdAt: string;
}

export interface Guarantor {
  id: string;
  caseId: string;
  name: string;
  phone: string;
  aadhaar: string;
  pan: string;
  address: string;
  relationship: string;
  liabilityAgreementSigned: boolean;
  signedAt?: string;
}

export interface Collateral {
  id: string;
  caseId: string;
  type: 'property' | 'vehicle' | 'gold' | 'fd' | 'other';
  description: string;
  estimatedValue: number;
  documents: string[];
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  branch: string;
  commissionRate: number;  // %
  activeLoans: number;
  totalCollected: number;
}

export interface LoanCase {
  id: string;
  customerId: string;
  customerName: string;
  agentId: string;
  agentName: string;
  loanType: 'daily' | 'weekly' | 'fortnightly' | 'monthly';
  product: string;
  financeAmount: number;
  interestAmount: number;
  fileCharges: number;
  fileChargesType: 'fixed' | 'percentage';
  netDisbursement: number;
  totalReceivable: number;
  numberOfInstallments: number;
  initialInstallment: number;
  restInstallment: number;
  startDate: string;
  endDate: string;
  frequency: string;
  fineAmount: number;
  fineType: 'per_day' | 'one_time';
  fineTriggerDays: number;
  schedule: InstallmentRow[];
  guarantors: Guarantor[];
  collaterals: Collateral[];
  status: 'draft' | 'pending_disburse' | 'active' | 'closed' | 'npa';
  disbursedAt?: string;
  disbursedBy?: string;
  journalEntries: JournalEntry[];
  auditLog: AuditEntry[];
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  caseId: string;
  userId: string;
  userName: string;
  action: string;
  field: string;
  before: any;
  after: any;
  reason: string;
  timestamp: string;
}

export interface Receipt {
  id: string;
  caseId: string;
  customerName: string;
  installmentNo: number;
  amount: number;
  principal: number;
  interest: number;
  fine: number;
  paidAt: string;
  collectedBy: string;
  mode: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  utrRef?: string;
  journalEntry: JournalEntry;
}

// ─── Rich Demo Data ────────────────────────────────────────────

export const mockCustomers: Customer[] = [
  { id: 'CUS-001', name: 'Amit Verma', phone: '9876543210', aadhaar: 'XXXX-XXXX-4321', pan: 'XXXXXV4321A', dob: '1988-05-15', address: 'Flat 4B, Shivaji Nagar, Mumbai 400001', gpsLat: 19.076, gpsLng: 72.877, createdAt: '2024-01-10' },
  { id: 'CUS-002', name: 'Meena Devi', phone: '9812345678', aadhaar: 'XXXX-XXXX-8765', pan: 'XXXXXD8765B', dob: '1975-11-22', address: '12, Ram colony, Andheri East, Mumbai 400069', createdAt: '2024-01-08' },
  { id: 'CUS-003', name: 'Ramesh Gupta', phone: '9998765432', aadhaar: 'XXXX-XXXX-2233', pan: 'XXXXXG2233C', dob: '1980-03-08', address: '45 Ganesh Road, Dharavi, Mumbai 400017', createdAt: '2023-12-15' },
  { id: 'CUS-004', name: 'Lakshmi S', phone: '9876501234', aadhaar: 'XXXX-XXXX-9988', pan: 'XXXXXL9988D', dob: '1992-07-30', address: 'Plot 7, Kurla West, Mumbai 400070', createdAt: '2023-11-20' },
  { id: 'CUS-005', name: 'Nisha Patel', phone: '9765412345', aadhaar: 'XXXX-XXXX-6677', pan: 'XXXXXP6677E', dob: '1991-09-14', address: '23 Nehru Nagar, Borivali, Mumbai 400092', createdAt: '2024-03-12' },
  { id: 'CUS-006', name: 'Suresh Pillai', phone: '9654321098', aadhaar: 'XXXX-XXXX-3344', pan: 'XXXXXP3344F', dob: '1985-02-18', address: 'A-12, Malad West, Mumbai 400064', createdAt: '2024-02-01' },
];

export const mockAgents: Agent[] = [
  { id: 'AGT-001', name: 'Ramesh CO', phone: '9871234567', branch: 'Mumbai - Andheri', commissionRate: 1.5, activeLoans: 42, totalCollected: 8750000 },
  { id: 'AGT-002', name: 'Priya CO', phone: '9872345678', branch: 'Mumbai - Andheri', commissionRate: 1.5, activeLoans: 38, totalCollected: 7200000 },
  { id: 'AGT-003', name: 'Suresh CO', phone: '9873456789', branch: 'Mumbai - Andheri', commissionRate: 2.0, activeLoans: 55, totalCollected: 11400000 },
  { id: 'AGT-004', name: 'Kiran LO', phone: '9874567890', branch: 'Delhi - Rohini', commissionRate: 1.0, activeLoans: 28, totalCollected: 5900000 },
];

const sampleSchedule: InstallmentRow[] = Array.from({ length: 10 }, (_, i) => {
  const d = new Date('2024-01-16');
  d.setDate(d.getDate() + i);
  return {
    no: i + 1,
    dueDate: d.toISOString().split('T')[0],
    amount: i === 0 ? 600 : 550,
    principal: i === 0 ? 450 : 400,
    interest: 150,
    status: i < 3 ? 'paid' : i === 3 ? 'overdue' : 'due',
    paidAmount: i < 3 ? (i === 0 ? 600 : 550) : undefined,
    paidDate: i < 3 ? `2024-01-${16 + i}` : undefined,
  };
});

export let mockLoanCases: LoanCase[] = [
  {
    id: 'CASE-2024-0001',
    customerId: 'CUS-001',
    customerName: 'Amit Verma',
    agentId: 'AGT-001',
    agentName: 'Ramesh CO',
    loanType: 'daily',
    product: 'Daily 100-Day Loan',
    financeAmount: 50000,
    interestAmount: 5000,
    fileCharges: 500,
    fileChargesType: 'fixed',
    netDisbursement: 49500,
    totalReceivable: 55000,
    numberOfInstallments: 100,
    initialInstallment: 600,
    restInstallment: 550,
    startDate: '2024-01-15',
    endDate: '2024-04-24',
    frequency: 'daily',
    fineAmount: 50,
    fineType: 'per_day',
    fineTriggerDays: 2,
    schedule: sampleSchedule,
    guarantors: [{ id: 'GUA-001', caseId: 'CASE-2024-0001', name: 'Sanjay Verma', phone: '9876500000', aadhaar: 'XXXX-XXXX-1111', pan: 'XXXXXS1111G', address: 'Same address', relationship: 'Brother', liabilityAgreementSigned: true, signedAt: '2024-01-14' }],
    collaterals: [{ id: 'COL-001', caseId: 'CASE-2024-0001', type: 'property', description: 'Residential flat document', estimatedValue: 2500000, documents: ['property_deed.pdf'] }],
    status: 'active',
    disbursedAt: '2024-01-15',
    disbursedBy: 'Swetha Nair',
    journalEntries: [],
    auditLog: [],
    createdAt: '2024-01-14',
  },
  {
    id: 'CASE-2024-0002',
    customerId: 'CUS-002',
    customerName: 'Meena Devi',
    agentId: 'AGT-001',
    agentName: 'Ramesh CO',
    loanType: 'monthly',
    product: 'Monthly 12M Loan',
    financeAmount: 120000,
    interestAmount: 14400,
    fileCharges: 1200,
    fileChargesType: 'fixed',
    netDisbursement: 118800,
    totalReceivable: 134400,
    numberOfInstallments: 12,
    initialInstallment: 11200,
    restInstallment: 11200,
    startDate: '2024-01-10',
    endDate: '2024-12-10',
    frequency: 'monthly',
    fineAmount: 200,
    fineType: 'one_time',
    fineTriggerDays: 5,
    schedule: Array.from({ length: 12 }, (_, i) => {
      const d = new Date('2024-01-10');
      d.setMonth(d.getMonth() + i);
      return { no: i + 1, dueDate: d.toISOString().split('T')[0], amount: 11200, principal: 10000, interest: 1200, status: i < 2 ? 'paid' : 'due', paidAmount: i < 2 ? 11200 : undefined, paidDate: i < 2 ? d.toISOString().split('T')[0] : undefined };
    }),
    guarantors: [],
    collaterals: [],
    status: 'active',
    disbursedAt: '2024-01-10',
    disbursedBy: 'Swetha Nair',
    journalEntries: [],
    auditLog: [],
    createdAt: '2024-01-09',
  },
];

export function addLoanCase(c: LoanCase) {
  mockLoanCases = [c, ...mockLoanCases];
}

export const mockReceipts: Receipt[] = [
  { id: 'RCP-001', caseId: 'CASE-2024-0001', customerName: 'Amit Verma', installmentNo: 1, amount: 600, principal: 450, interest: 150, fine: 0, paidAt: '2024-01-15 09:12', collectedBy: 'Ramesh CO', mode: 'cash', journalEntry: { id: 'JE-R001', date: '2024-01-15', description: 'Repayment 1 — CASE-2024-0001', entries: [{ account: 'Cash', type: 'debit', amount: 600 }, { account: 'Loan Portfolio', type: 'credit', amount: 450 }, { account: 'Interest Income', type: 'credit', amount: 150 }], ref: 'CASE-2024-0001', createdBy: 'Ramesh CO', isBalanced: true } },
  { id: 'RCP-002', caseId: 'CASE-2024-0001', customerName: 'Amit Verma', installmentNo: 2, amount: 550, principal: 400, interest: 150, fine: 0, paidAt: '2024-01-16 08:45', collectedBy: 'Ramesh CO', mode: 'cash', journalEntry: { id: 'JE-R002', date: '2024-01-16', description: 'Repayment 2 — CASE-2024-0001', entries: [{ account: 'Cash', type: 'debit', amount: 550 }, { account: 'Loan Portfolio', type: 'credit', amount: 400 }, { account: 'Interest Income', type: 'credit', amount: 150 }], ref: 'CASE-2024-0001', createdBy: 'Ramesh CO', isBalanced: true } },
];

// ─── General Ledger Aggregates ────────────────────────────────

export function computeBalanceSheet() {
  const loanOutstanding = mockLoanCases.filter(c => c.status === 'active').reduce((s, c) => s + c.totalReceivable - c.schedule.filter(r => r.status === 'paid').reduce((ss, r) => ss + r.amount, 0), 0);
  return {
    assets: {
      cashInHand: 285000,
      bankBalance: 4250000,
      loanPortfolio: Math.round(loanOutstanding),
      fileChargesReceivable: 8400,
      totalAssets: 285000 + 4250000 + Math.round(loanOutstanding) + 8400,
    },
    liabilities: {
      partnerCapital: 12500000,
      suspenseAccount: 3500,
      provisionBadDebt: 320000,
      totalLiabilities: 12500000 + 3500 + 320000,
    },
    equity: {
      retainedEarnings: 3750000,
      currentPeriodProfit: 7100000,
      totalEquity: 3750000 + 7100000,
    },
  };
}

export function computePL() {
  const totalInterestPaid = mockReceipts.reduce((s, r) => s + r.interest, 0);
  const totalFinesPaid = mockReceipts.reduce((s, r) => s + r.fine, 0);
  const totalFileCharges = mockLoanCases.reduce((s, c) => s + c.fileCharges, 0);
  return {
    income: {
      interestReceived: 12400000,
      fileChargesIncome: 320000,
      finesReceived: 85000,
      totalIncome: 12805000,
    },
    expenses: {
      agentCommissions: 1860000,
      operationalCosts: 5300000,
      provisionBadDebt: 320000,
      salaries: 2800000,
      totalExpenses: 10280000,
    },
    netProfit: 12805000 - 10280000,
  };
}
