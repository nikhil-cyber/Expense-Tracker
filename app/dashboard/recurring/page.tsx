'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, EXPENSE_CATEGORIES, CATEGORY_COLORS } from '@/lib/utils';

interface Recurring {
  id: string;
  name: string;
  amount: number;
  category: string;
  dueDay: number;
  isActive: boolean;
}

export default function RecurringPage() {
  const [payments, setPayments] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', amount: '', category: 'Subscriptions', dueDay: '1' });
  const [submitting, setSubmitting] = useState(false);

  async function fetchPayments() {
    setLoading(true);
    const res = await fetch('/api/recurring');
    const data = await res.json();
    setPayments(data);
    setLoading(false);
  }

  useEffect(() => { fetchPayments(); }, []);

  function openAdd() {
    setForm({ name: '', amount: '', category: 'Subscriptions', dueDay: '1' });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(p: Recurring) {
    setForm({ name: p.name, amount: String(p.amount), category: p.category, dueDay: String(p.dueDay) });
    setEditId(p.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await fetch(`/api/recurring/${editId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/recurring', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      fetchPayments();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(p: Recurring) {
    await fetch(`/api/recurring/${p.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, isActive: !p.isActive }),
    });
    fetchPayments();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this recurring payment?')) return;
    await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
    fetchPayments();
  }

  const active = payments.filter(p => p.isActive);
  const inactive = payments.filter(p => !p.isActive);
  const totalMonthly = active.reduce((s, p) => s + p.amount, 0);
  const totalYearly = totalMonthly * 12;

  const today = new Date().getDate();
  const upcomingThisWeek = active.filter(p => p.dueDay >= today && p.dueDay <= today + 7);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Recurring Payments</h1>
          <p className="text-slate-400 text-sm mt-0.5">Subscriptions, bills, and fixed monthly expenses</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Monthly Total', value: formatCurrency(totalMonthly), sub: `${active.length} active payments`, color: 'text-purple-400' },
          { label: 'Annual Total', value: formatCurrency(totalYearly), sub: 'Per year in recurring costs', color: 'text-amber-400' },
          { label: 'Due This Week', value: String(upcomingThisWeek.length), sub: upcomingThisWeek.map(p => p.name).join(', ') || 'None upcoming', color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-sm text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Upcoming this week */}
      {upcomingThisWeek.length > 0 && (
        <div className="glass-card p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-semibold text-amber-400">Due This Week</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcomingThisWeek.map(p => (
              <div key={p.id} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
                <span className="text-sm text-slate-200 font-medium">{p.name}</span>
                <span className="text-xs text-amber-400">{formatCurrency(p.amount)} on day {p.dueDay}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active payments */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="font-semibold text-slate-200">Active Subscriptions & Bills</h3>
        </div>
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading...</div>
        ) : active.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-400">No active recurring payments</p>
            <button onClick={openAdd} className="text-purple-400 text-sm mt-1 hover:text-purple-300">Add your first one</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Due Day</th>
                <th className="text-right">Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map(p => (
                <tr key={p.id}>
                  <td className="font-medium text-slate-200">{p.name}</td>
                  <td>
                    <span className="badge" style={{
                      background: `${CATEGORY_COLORS[p.category] || '#6b7280'}20`,
                      color: CATEGORY_COLORS[p.category] || '#94a3b8',
                    }}>{p.category}</span>
                  </td>
                  <td className="text-slate-400">Day {p.dueDay}</td>
                  <td className="text-right font-semibold text-slate-200">{formatCurrency(p.amount)}</td>
                  <td>
                    <button onClick={() => toggleActive(p)}
                      className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/25 transition-colors">
                      Active
                    </button>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="text-slate-500 hover:text-slate-300 p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="text-slate-500 hover:text-red-400 p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paused */}
      {inactive.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-slate-400 text-sm">Paused ({inactive.length})</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {inactive.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 opacity-60">
                <span className="text-sm text-slate-400 line-through">{p.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{formatCurrency(p.amount)}</span>
                  <button onClick={() => toggleActive(p)} className="badge bg-slate-500/15 text-slate-400 cursor-pointer hover:bg-slate-500/25 text-xs">Resume</button>
                  <button onClick={() => handleDelete(p.id)} className="text-slate-600 hover:text-red-400 p-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-content p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-100">{editId ? 'Edit Payment' : 'Add Recurring Payment'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Payment Name</label>
                <input type="text" required className="input-dark" placeholder="e.g. Netflix, Rent, Internet"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Monthly Amount ($)</label>
                <input type="number" step="0.01" min="0.01" required className="input-dark" placeholder="0.00"
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                <select required className="select-dark" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Day of Month</label>
                <input type="number" min="1" max="31" required className="input-dark" placeholder="1-31"
                  value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Saving...' : (editId ? 'Update' : 'Add Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
