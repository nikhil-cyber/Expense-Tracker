'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, SAVINGS_TYPES } from '@/lib/utils';

interface SavingsGoal {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  monthlyTarget: number;
  color: string;
}

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeposit, setShowDeposit] = useState<SavingsGoal | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [form, setForm] = useState({ name: '', type: 'savings', targetAmount: '', currentAmount: '0', monthlyTarget: '', color: '#10b981' });
  const [submitting, setSubmitting] = useState(false);

  async function fetchGoals() {
    setLoading(true);
    const res = await fetch('/api/savings');
    setGoals(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchGoals(); }, []);

  function openAdd() {
    setForm({ name: '', type: 'savings', targetAmount: '', currentAmount: '0', monthlyTarget: '', color: '#10b981' });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(g: SavingsGoal) {
    setForm({ name: g.name, type: g.type, targetAmount: String(g.targetAmount), currentAmount: String(g.currentAmount), monthlyTarget: String(g.monthlyTarget), color: g.color });
    setEditId(g.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await fetch(`/api/savings/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch('/api/savings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      setShowForm(false);
      fetchGoals();
    } finally { setSubmitting(false); }
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!showDeposit) return;
    const newAmount = showDeposit.currentAmount + parseFloat(depositAmount);
    await fetch(`/api/savings/${showDeposit.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentAmount: newAmount }),
    });
    setShowDeposit(null);
    setDepositAmount('');
    fetchGoals();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this savings goal?')) return;
    await fetch(`/api/savings/${id}`, { method: 'DELETE' });
    fetchGoals();
  }

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalMonthly = goals.reduce((s, g) => s + g.monthlyTarget, 0);

  const typeInfo: Record<string, { icon: string; label: string }> = {
    emergency: { icon: '🛡️', label: 'Emergency Fund' },
    vacation: { icon: '✈️', label: 'Vacation Fund' },
    savings: { icon: '💰', label: 'General Savings' },
    retirement: { icon: '🏦', label: 'Retirement' },
    home: { icon: '🏠', label: 'Home Purchase' },
    custom: { icon: '🎯', label: 'Custom Goal' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Savings Goals</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track progress toward your financial goals</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Goal
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20">
          <p className="text-sm text-slate-400 mb-1">Total Saved</p>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalSaved)}</p>
          <p className="text-xs text-slate-500 mt-1">{((totalSaved / Math.max(totalTarget, 1)) * 100).toFixed(0)}% of all goals</p>
        </div>
        <div className="glass-card p-4 bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20">
          <p className="text-sm text-slate-400 mb-1">Total Goals</p>
          <p className="text-2xl font-bold text-purple-400">{formatCurrency(totalTarget)}</p>
          <p className="text-xs text-slate-500 mt-1">{goals.length} active goals</p>
        </div>
        <div className="glass-card p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
          <p className="text-sm text-slate-400 mb-1">Monthly Target</p>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalMonthly)}</p>
          <p className="text-xs text-slate-500 mt-1">Planned monthly contributions</p>
        </div>
      </div>

      {/* Goals grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : goals.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-slate-400 font-medium">No savings goals yet</p>
          <button onClick={openAdd} className="text-purple-400 text-sm mt-2 hover:text-purple-300">Create your first goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {goals.map(goal => {
            const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            const monthsLeft = goal.monthlyTarget > 0 ? Math.ceil(remaining / goal.monthlyTarget) : null;
            const info = typeInfo[goal.type] || typeInfo.custom;

            return (
              <div key={goal.id} className="glass-card p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-100">{goal.name}</h3>
                      <p className="text-xs text-slate-500">{info.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(goal)} className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold text-xl" style={{ color: goal.color }}>{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-slate-500">/ {formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: goal.color }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-slate-500">{pct.toFixed(0)}% funded</span>
                    {pct < 100 && (
                      <span className="text-xs text-slate-500">
                        {formatCurrency(remaining)} left
                        {monthsLeft && ` • ~${monthsLeft}mo`}
                      </span>
                    )}
                  </div>
                </div>

                {goal.monthlyTarget > 0 && (
                  <p className="text-xs text-slate-500">Monthly target: {formatCurrency(goal.monthlyTarget)}</p>
                )}

                <button onClick={() => { setShowDeposit(goal); setDepositAmount(''); }}
                  className="btn-secondary w-full justify-center text-sm py-2">
                  + Add Funds
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-content p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-100">{editId ? 'Edit Goal' : 'New Savings Goal'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Goal Type</label>
                <select required className="select-dark" value={form.type}
                  onChange={e => {
                    const t = SAVINGS_TYPES.find(s => s.value === e.target.value);
                    setForm({ ...form, type: e.target.value, color: t?.color || form.color });
                  }}>
                  {SAVINGS_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Goal Name</label>
                <input type="text" required className="input-dark" placeholder="e.g. Emergency Fund"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Target Amount ($)</label>
                  <input type="number" step="0.01" min="1" required className="input-dark" placeholder="10000"
                    value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Amount ($)</label>
                  <input type="number" step="0.01" min="0" className="input-dark" placeholder="0"
                    value={form.currentAmount} onChange={e => setForm({ ...form, currentAmount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Monthly Contribution ($)</label>
                <input type="number" step="0.01" min="0" className="input-dark" placeholder="200"
                  value={form.monthlyTarget} onChange={e => setForm({ ...form, monthlyTarget: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Saving...' : (editId ? 'Update' : 'Create Goal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowDeposit(null); }}>
          <div className="modal-content p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-slate-100 mb-1">Add Funds</h3>
            <p className="text-slate-400 text-sm mb-5">to {showDeposit.name}</p>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount to Add ($)</label>
                <input type="number" step="0.01" min="0.01" required className="input-dark" placeholder="0.00"
                  value={depositAmount} onChange={e => setDepositAmount(e.target.value)} autoFocus />
              </div>
              <div className="text-sm text-slate-400">
                New balance: <span className="text-emerald-400 font-semibold">{formatCurrency((showDeposit.currentAmount) + (parseFloat(depositAmount) || 0))}</span>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowDeposit(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Add Funds</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
