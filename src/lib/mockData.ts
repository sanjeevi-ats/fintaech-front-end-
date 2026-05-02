export const mockStats = {
  aum: 847500000,
  totalLoans: 3421,
  activeLoans: 2987,
  par30: 3.42,
  par60: 1.87,
  collectionEfficiency: 94.3,
  totalCapital: 125000000,
  netProfit: 18250000,
  disbursedToday: 5600000,
  collectedToday: 4280000,
};

export const mockBranchPerformance = [
  { branch: 'Mumbai', aum: 220000000, par: 2.1, collection: 96.2, loans: 890 },
  { branch: 'Delhi', aum: 185000000, par: 4.8, collection: 91.5, loans: 720 },
  { branch: 'Chennai', aum: 162000000, par: 3.2, collection: 95.1, loans: 640 },
  { branch: 'Bangalore', aum: 148000000, par: 2.9, collection: 94.8, loans: 580 },
  { branch: 'Hyderabad', aum: 132500000, par: 5.1, collection: 89.3, loans: 497 },
];

export const mockMonthlyPL = [
  { month: 'Sep', interest: 8200000, expenses: 4100000, profit: 4100000 },
  { month: 'Oct', interest: 9100000, expenses: 4300000, profit: 4800000 },
  { month: 'Nov', interest: 8700000, expenses: 4200000, profit: 4500000 },
  { month: 'Dec', interest: 10200000, expenses: 4800000, profit: 5400000 },
  { month: 'Jan', interest: 11500000, expenses: 5100000, profit: 6400000 },
  { month: 'Feb', interest: 10800000, expenses: 4900000, profit: 5900000 },
  { month: 'Mar', interest: 12400000, expenses: 5300000, profit: 7100000 },
];

export const mockPartners = [
  { id: 'P001', name: 'Rajesh Kumar', investedDate: '2024-01-01', totalInvestment: 5000000, ownership: 40.00, profit: 2840000, status: 'active' },
  { id: 'P002', name: 'Priya Sharma', investedDate: '2024-01-15', totalInvestment: 3500000, ownership: 27.32, profit: 1968000, status: 'active' },
  { id: 'P003', name: 'Vikram Mehta', investedDate: '2024-02-01', totalInvestment: 2500000, ownership: 18.85, profit: 1402000, status: 'active' },
  { id: 'P004', name: 'Sunita Rao', investedDate: '2024-03-10', totalInvestment: 1800000, ownership: 13.83, profit: 1010000, status: 'active' },
];

export const mockLoans = [
  { id: 'LN-2024-001', customer: 'Amit Verma', phone: '9876543210', product: 'Daily 100D', amount: 50000, disbursedAt: '2024-01-15', status: 'active', dpd: 0, emi: 550, outstanding: 27500 },
  { id: 'LN-2024-002', customer: 'Meena Devi', phone: '9812345678', product: 'Monthly 12M', amount: 120000, disbursedAt: '2024-01-10', status: 'active', dpd: 0, emi: 11200, outstanding: 89600 },
  { id: 'LN-2024-003', customer: 'Ramesh Gupta', phone: '9998765432', product: 'Weekly 26W', amount: 80000, disbursedAt: '2023-12-20', status: 'overdue', dpd: 18, emi: 3350, outstanding: 54000 },
  { id: 'LN-2024-004', customer: 'Lakshmi S', phone: '9876501234', product: 'Daily 100D', amount: 30000, disbursedAt: '2023-11-30', status: 'overdue', dpd: 45, emi: 330, outstanding: 18000 },
  { id: 'LN-2024-005', customer: 'Suresh Pillai', phone: '9765432109', product: 'Monthly 24M', amount: 200000, disbursedAt: '2024-02-01', status: 'active', dpd: 0, emi: 10200, outstanding: 184000 },
  { id: 'LN-2024-006', customer: 'Fatima Khan', phone: '9654321098', product: 'Daily 100D', amount: 25000, disbursedAt: '2023-10-15', status: 'closed', dpd: 0, emi: 275, outstanding: 0 },
  { id: 'LN-2024-007', customer: 'Bhaskar Rao', phone: '9543210987', product: 'Monthly 12M', amount: 150000, disbursedAt: '2023-12-01', status: 'overdue', dpd: 62, emi: 14000, outstanding: 126000 },
];

export const mockDCS = [
  { id: 'DC001', customer: 'Amit Verma', loan: 'LN-2024-001', emi: 550, dueDate: '2024-03-13', status: 'pending', beat: 'Route A', officer: 'Ramesh CO' },
  { id: 'DC002', customer: 'Meena Devi', loan: 'LN-2024-002', emi: 11200, dueDate: '2024-03-13', status: 'collected', beat: 'Route A', officer: 'Ramesh CO' },
  { id: 'DC003', customer: 'Kavita Singh', loan: 'LN-2024-008', emi: 880, dueDate: '2024-03-13', status: 'pending', beat: 'Route B', officer: 'Suresh CO' },
  { id: 'DC004', customer: 'Deepak Nair', loan: 'LN-2024-009', emi: 5500, dueDate: '2024-03-13', status: 'partial', beat: 'Route A', officer: 'Ramesh CO' },
  { id: 'DC005', customer: 'Anita Joshi', loan: 'LN-2024-010', emi: 2200, dueDate: '2024-03-13', status: 'pending', beat: 'Route C', officer: 'Priya CO' },
  { id: 'DC006', customer: 'Mohan Kumar', loan: 'LN-2024-011', emi: 3850, dueDate: '2024-03-13', status: 'collected', beat: 'Route B', officer: 'Suresh CO' },
];

export const mockJournalEntries = [
  { id: 'JE-001', date: '2024-03-13', description: 'Loan Disbursement - LN-2024-015', debit: 'Loan Portfolio', credit: 'Branch Cash', amount: 75000, ref: 'LN-2024-015' },
  { id: 'JE-002', date: '2024-03-13', description: 'Collection Receipt - LN-2024-001', debit: 'Cash/Bank', credit: 'Loan Portfolio (Principal)', amount: 400, ref: 'LN-2024-001' },
  { id: 'JE-003', date: '2024-03-13', description: 'Interest Income - LN-2024-001', debit: 'Cash/Bank', credit: 'Interest Income', amount: 150, ref: 'LN-2024-001' },
  { id: 'JE-004', date: '2024-03-13', description: 'Capital Infusion - P004', debit: 'Branch Cash', credit: 'Partner Capital', amount: 500000, ref: 'CAP-P004' },
  { id: 'JE-005', date: '2024-03-12', description: 'Office Rent Expense', debit: 'Operating Expenses', credit: 'Cash/Bank', amount: 45000, ref: 'EXP-003' },
];

export const mockAuditLogs = [
  { id: 'AL-001', user: 'Rajesh Kumar', role: 'Branch Manager', action: 'LOAN_DISBURSED', entity: 'Loan', entityId: 'LN-2024-015', ip: '192.168.1.105', timestamp: '2024-03-13T09:15:22', before: '{"status":"approved"}', after: '{"status":"disbursed","amount":75000}' },
  { id: 'AL-002', user: 'Priya CO', role: 'Collection Officer', action: 'PAYMENT_COLLECTED', entity: 'Repayment', entityId: 'REP-005521', ip: '192.168.1.212', timestamp: '2024-03-13T09:32:10', before: '{"status":"pending","amount":550}', after: '{"status":"paid","paidAt":"2024-03-13"}' },
  { id: 'AL-003', user: 'Admin', role: 'Super Admin', action: 'ROLE_MODIFIED', entity: 'User', entityId: 'USR-045', ip: '10.0.0.1', timestamp: '2024-03-13T08:45:01', before: '{"role":"loan_officer"}', after: '{"role":"branch_manager"}' },
  { id: 'AL-004', user: 'Accountant Ravi', role: 'Accountant', action: 'EXPENSE_APPROVED', entity: 'Expense', entityId: 'EXP-033', ip: '192.168.1.88', timestamp: '2024-03-12T17:20:45', before: '{"status":"pending","amount":45000}', after: '{"status":"approved"}' },
];

export const mockLoanProducts = [
  { id: 'LP-001', name: 'Daily 100-Day Loan', frequency: 'Daily', tenure: 100, interestType: 'Flat', rate: 24, minAmount: 10000, maxAmount: 100000, gracePeriod: 2, status: 'active' },
  { id: 'LP-002', name: 'Weekly 26-Week Loan', frequency: 'Weekly', tenure: 26, interestType: 'Flat', rate: 26, minAmount: 25000, maxAmount: 200000, gracePeriod: 3, status: 'active' },
  { id: 'LP-003', name: 'Monthly 12-Month Loan', frequency: 'Monthly', tenure: 12, interestType: 'Reducing', rate: 22, minAmount: 50000, maxAmount: 500000, gracePeriod: 5, status: 'active' },
  { id: 'LP-004', name: 'Monthly 24-Month Loan', frequency: 'Monthly', tenure: 24, interestType: 'Reducing', rate: 20, minAmount: 100000, maxAmount: 1000000, gracePeriod: 7, status: 'active' },
];

export const mockChartOfAccounts = [
  { code: '1001', name: 'Cash in Hand', type: 'Asset', balance: 285000 },
  { code: '1002', name: 'Bank Account - SBI', type: 'Asset', balance: 4250000 },
  { code: '1100', name: 'Loan Portfolio (Principal)', type: 'Asset', balance: 84750000 },
  { code: '1101', name: 'Accrued Interest Receivable', type: 'Asset', balance: 2340000 },
  { code: '2001', name: 'Partner Capital', type: 'Equity', balance: 12500000 },
  { code: '3001', name: 'Interest Income', type: 'Revenue', balance: 12400000 },
  { code: '4001', name: 'Operating Expenses', type: 'Expense', balance: 5300000 },
  { code: '4002', name: 'Salary Expense', type: 'Expense', balance: 2800000 },
  { code: '9001', name: 'Suspense Account', type: 'Liability', balance: 0 },
];
