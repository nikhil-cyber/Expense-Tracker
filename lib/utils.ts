import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatMonth(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(date));
}

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Transportation',
  'Food & Dining',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Personal Care',
  'Education',
  'Travel',
  'Subscriptions',
  'Insurance',
  'Savings',
  'Investments',
  'Credit Card Payment',
  'Other',
];

export const CATEGORY_COLORS: Record<string, string> = {
  Housing: '#6c63ff',
  Transportation: '#3b82f6',
  'Food & Dining': '#f59e0b',
  Utilities: '#10b981',
  Healthcare: '#ef4444',
  Entertainment: '#ec4899',
  Shopping: '#8b5cf6',
  'Personal Care': '#06b6d4',
  Education: '#84cc16',
  Travel: '#f97316',
  Subscriptions: '#a855f7',
  Insurance: '#64748b',
  Savings: '#22c55e',
  Investments: '#0ea5e9',
  'Credit Card Payment': '#f43f5e',
  Other: '#6b7280',
};

export const ACCOUNT_TYPES = ['Checking', 'Savings', 'Investment', 'Cash'];

export const SAVINGS_TYPES = [
  { value: 'emergency', label: 'Emergency Fund', color: '#ef4444', icon: '🛡️' },
  { value: 'vacation', label: 'Vacation Fund', color: '#f59e0b', icon: '✈️' },
  { value: 'savings', label: 'General Savings', color: '#10b981', icon: '💰' },
  { value: 'retirement', label: 'Retirement', color: '#6c63ff', icon: '🏦' },
  { value: 'home', label: 'Home Purchase', color: '#3b82f6', icon: '🏠' },
  { value: 'custom', label: 'Custom Goal', color: '#8b5cf6', icon: '🎯' },
];
