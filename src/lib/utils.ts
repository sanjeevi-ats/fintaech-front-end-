import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function maskAadhaar(aadhaar: string): string {
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}

export function maskPAN(pan: string): string {
  return `XXXXX${pan.slice(-4)}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getPARBucket(dpd: number): 'current' | 'par15' | 'par30' | 'par60' | 'npa' {
  if (dpd === 0) return 'current';
  if (dpd <= 15) return 'par15';
  if (dpd <= 30) return 'par30';
  if (dpd <= 60) return 'par60';
  return 'npa';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'badge-success',
    approved: 'badge-success',
    paid: 'badge-success',
    disbursed: 'badge-info',
    pending: 'badge-warning',
    overdue: 'badge-danger',
    npa: 'badge-danger',
    legal: 'badge-danger',
    rejected: 'badge-danger',
    closed: 'badge-gray',
    draft: 'badge-gray',
  };
  return map[status.toLowerCase()] || 'badge-gray';
}

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  PARTNER: 'partner',
  BRANCH_MANAGER: 'branch_manager',
  ACCOUNTANT: 'accountant',
  COLLECTION_OFFICER: 'collection_officer',
  RECOVERY_SPECIALIST: 'recovery_specialist',
  LOAN_OFFICER: 'loan_officer',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  partner: 'Partner',
  branch_manager: 'Branch Manager',
  accountant: 'Accountant',
  collection_officer: 'Collection Officer',
  recovery_specialist: 'Recovery Specialist',
  loan_officer: 'Loan Officer',
};

export const BRANCHES = [
  { id: 'b1', name: 'Mumbai - Andheri', code: 'MUM-AND' },
  { id: 'b2', name: 'Delhi - Rohini', code: 'DEL-ROH' },
  { id: 'b3', name: 'Chennai - T. Nagar', code: 'CHE-TNG' },
  { id: 'b4', name: 'Bangalore - Koramangala', code: 'BLR-KOR' },
  { id: 'b5', name: 'Hyderabad - Madhapur', code: 'HYD-MAD' },
];
