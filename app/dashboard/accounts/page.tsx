'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, ACCOUNT_TYPES } from '@/lib/utils';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  bank: string | null;
}

const ACCOUNT_ICONS: Record<string, string> = {
  Checking: '🏦',
  Savings: '💵',
  Investment: '📈',
  Cash: '💴',
};

const ACCOUNT_COLORS: Record<string, string> = {
  Checking: '#3b82f6',
  Savings: '#10b981',
  Investment: '#6c63ff',
  Cash: '#f59e0b',
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'Checking', balance: '', bank: '' });
  const [submitting, setSubmitting] = useState(false);

  async function fetchAccounts() {
    setLoading(true);
    const res = await fetch('/api/accounts');
    setAccounts(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchAccounts(); }, []);

  function openAdd() {
    setForm({ name: '', type: 'Checking', balance: '', bank: '' });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(a: Account) {
    setForm({ name: a.name, type: a.type, balance: String(a.balance), bank: a.bank || '' });
    setEditId(a.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await fetch(`/api/accounts/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      setShowForm(false);
      fetchAccounts();
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this account?')) return;
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    fetchAccounts();
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const byType = ACCOUNT_TYPES.reduce((acc, type) => {
    const typeAccounts = accounts.filter(a => a.type === type);
    acc[type] = typeAccounts.reduce((s, a) => s + a.balance, 0);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Accounts</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your checking, savings, and investment accounts</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </button>
      </div>

      {/* Net worth summary */}
      <div className="glass-card p-6 bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20">
        <p className="text-sm text-slate-400 mb-1">Total Balance Across All Accounts</p>
        <p className="text-4xl font-bold gradient-text">{formatCurrency(totalBalance)}</p>
        <div className="flex flex-wrap gap-4 mt-4">
          {ACCOUNT_TYPES.map(type => byType[type] > 0 && (
            <div key={type} className="flex items-center gap-2">
              <span className="text-base">{ACCOUNT_ICONS[type]}</span>
              <div>
                <p className="text-xs text-slate-500">{type}</p>
                <p className="text-sm font-semibold" style={{ color: ACCOUNT_COLORS[type] }}>{formatCurrency(byType[type])}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accounts */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <p className="text-4xl mb-3">🏦</p>
          <p className="text-slate-400 font-medium">No accounts added yet</p>
          <button onClick={openAdd} className="text-purple-400 text-sm mt-1 hover:text-purple-300">Add your first account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map(account => {
            const color = ACCOUNT_COLORS[account.type] || '#6c63ff';
            const icon = ACCOUNT_ICONS[account.type] || '💳';
            return (
              <div key={account.id} className="glass-card p-5 hover:bg-white/[0.07] transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: `${color}20` }}>
                      {icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-100">{account.name}</h3>
                      <p className="text-xs text-slate-500">{account.bank || account.type}</p>
                    </div>
                  </div>
                  <span className="badge text-xs" style={{ background: `${color}15`, color }}>
                    {account.type}
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color }}>{formatCurrency(account.balance)}</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => openEdit(account)} className="btn-secondary flex-1 justify-center text-xs py-2">Edit</button>
                  <button onClick={() => handleDelete(account.id)} className="btn-danger flex-1 text-xs py-2">Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-content p-6 max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-100">{editId ? 'Edit Account' : 'Add Account'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Account Name</label>
                <input type="text" required className="input-dark" placeholder="e.g. Chase Checking"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Account Type</label>
                <select required className="select-dark" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{ACCOUNT_ICONS[t]} {t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Balance ($)</label>
                <input type="number" step="0.01" required className="input-dark" placeholder="0.00"
                  value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Bank / Institution</label>
                <input type="text" className="input-dark" placeholder="e.g. Chase, Vanguard"
                  value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Saving...' : (editId ? 'Update' : 'Add Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
