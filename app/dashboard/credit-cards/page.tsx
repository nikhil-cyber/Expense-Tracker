'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface CreditCard {
  id: string;
  name: string;
  bank: string;
  balance: number;
  creditLimit: number;
  apr: number;
  minimumPayment: number;
  dueDay: number;
  color: string;
}

const CARD_COLORS = [
  '#6c63ff', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4',
];

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', bank: '', balance: '', creditLimit: '', apr: '', minimumPayment: '', dueDay: '1', color: '#6c63ff' });
  const [submitting, setSubmitting] = useState(false);

  async function fetchCards() {
    setLoading(true);
    const cardRes = await fetch('/api/credit-cards');
    setCards(await cardRes.json());
    setLoading(false);
  }

  useEffect(() => { fetchCards(); }, []);

  function openAdd() {
    setForm({ name: '', bank: '', balance: '', creditLimit: '', apr: '', minimumPayment: '', dueDay: '1', color: '#6c63ff' });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(c: CreditCard) {
    setForm({ name: c.name, bank: c.bank, balance: String(c.balance), creditLimit: String(c.creditLimit), apr: String(c.apr), minimumPayment: String(c.minimumPayment), dueDay: String(c.dueDay), color: c.color });
    setEditId(c.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await fetch(`/api/credit-cards/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        await fetch('/api/credit-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      }
      setShowForm(false);
      fetchCards();
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this credit card?')) return;
    await fetch(`/api/credit-cards/${id}`, { method: 'DELETE' });
    fetchCards();
  }

  const totalDebt = cards.reduce((s, c) => s + c.balance, 0);
  const totalLimit = cards.reduce((s, c) => s + c.creditLimit, 0);
  const totalMinPayment = cards.reduce((s, c) => s + c.minimumPayment, 0);
  const overallUtilization = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;
  const monthlyInterest = cards.reduce((s, c) => s + (c.balance * (c.apr / 100) / 12), 0);

  // Avalanche order
  const avalancheOrder = [...cards].sort((a, b) => b.apr - a.apr);
  const snowballOrder = [...cards].sort((a, b) => a.balance - b.balance);

  const today = new Date().getDate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Credit Cards</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage balances, track utilization, plan payoff</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/recommendations" className="btn-secondary text-sm">
            Get Payoff Plan
          </Link>
          <button onClick={openAdd} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Card
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Debt', value: formatCurrency(totalDebt), color: 'text-red-400', sub: `${cards.length} card${cards.length !== 1 ? 's' : ''}` },
          { label: 'Total Credit', value: formatCurrency(totalLimit), color: 'text-blue-400', sub: 'Available credit limit' },
          { label: 'Utilization', value: `${overallUtilization.toFixed(0)}%`, color: overallUtilization > 50 ? 'text-red-400' : overallUtilization > 30 ? 'text-amber-400' : 'text-emerald-400', sub: overallUtilization > 30 ? 'Above ideal (30%)' : 'Good standing' },
          { label: 'Monthly Interest', value: formatCurrency(monthlyInterest), color: 'text-amber-400', sub: `Min payments: ${formatCurrency(totalMinPayment)}` },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Overall utilization bar */}
      {cards.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Overall Credit Utilization</span>
            <span className={`text-sm font-bold ${overallUtilization > 50 ? 'text-red-400' : overallUtilization > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {overallUtilization.toFixed(0)}%
            </span>
          </div>
          <div className="progress-bar h-3">
            <div className="progress-fill h-3" style={{
              width: `${overallUtilization}%`,
              background: overallUtilization > 50 ? '#ef4444' : overallUtilization > 30 ? '#f59e0b' : '#10b981',
            }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>0%</span>
            <span className="text-emerald-500">30% ideal</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : cards.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-slate-400 font-medium">No credit cards added</p>
          <button onClick={openAdd} className="text-purple-400 text-sm mt-1 hover:text-purple-300">Add your first card</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cards.map(card => {
            const util = (card.balance / card.creditLimit) * 100;
            const monthlyInt = (card.balance * (card.apr / 100)) / 12;
            const isDueSoon = Math.abs(card.dueDay - today) <= 3 || card.dueDay < today;

            return (
              <div key={card.id} className="glass-card overflow-hidden">
                {/* Card visual */}
                <div className="h-32 p-5 flex flex-col justify-between relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${card.color}40, ${card.color}20)`, borderBottom: `1px solid ${card.color}30` }}>
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10" style={{ background: card.color }} />
                  <div className="absolute -right-2 bottom-4 w-16 h-16 rounded-full opacity-10" style={{ background: card.color }} />
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400">{card.bank}</p>
                      <p className="font-bold text-slate-100">{card.name}</p>
                    </div>
                    {isDueSoon && (
                      <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">Due Day {card.dueDay}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-100">{formatCurrency(card.balance)}</p>
                    <p className="text-xs text-slate-400">of {formatCurrency(card.creditLimit)} limit</p>
                  </div>
                </div>

                {/* Card details */}
                <div className="p-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Utilization</span>
                      <span className={util > 50 ? 'text-red-400' : util > 30 ? 'text-amber-400' : 'text-emerald-400'}>{util.toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(util, 100)}%`, background: util > 50 ? '#ef4444' : util > 30 ? '#f59e0b' : '#10b981' }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">APR</p>
                      <p className="text-sm font-semibold text-slate-200">{card.apr}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Min Pay</p>
                      <p className="text-sm font-semibold text-slate-200">{formatCurrency(card.minimumPayment)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Interest/mo</p>
                      <p className="text-sm font-semibold text-amber-400">{formatCurrency(monthlyInt)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openEdit(card)} className="btn-secondary flex-1 justify-center text-xs py-2">Edit</button>
                    <button onClick={() => handleDelete(card.id)} className="btn-danger text-xs py-2 px-3">Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payoff strategy */}
      {cards.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Avalanche Method</h3>
                <p className="text-xs text-slate-500">Saves most interest</p>
              </div>
            </div>
            <ol className="space-y-2">
              {avalancheOrder.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-slate-200">{c.name}</span>
                    <span className="text-xs text-slate-500 ml-2">{c.apr}% APR</span>
                  </div>
                  <span className="text-xs text-red-400">{formatCurrency(c.balance)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Snowball Method</h3>
                <p className="text-xs text-slate-500">Psychological wins</p>
              </div>
            </div>
            <ol className="space-y-2">
              {snowballOrder.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-slate-200 flex-1">{c.name}</span>
                  <span className="text-xs text-red-400">{formatCurrency(c.balance)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Add/Edit Card Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-content p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-100">{editId ? 'Edit Card' : 'Add Credit Card'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Card Name</label>
                  <input type="text" required className="input-dark" placeholder="e.g. Chase Sapphire"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Bank / Issuer</label>
                  <input type="text" required className="input-dark" placeholder="e.g. Chase"
                    value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Balance ($)</label>
                  <input type="number" step="0.01" min="0" required className="input-dark" placeholder="0.00"
                    value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Credit Limit ($)</label>
                  <input type="number" step="0.01" min="1" required className="input-dark" placeholder="5000"
                    value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">APR (%)</label>
                  <input type="number" step="0.01" min="0" required className="input-dark" placeholder="22.99"
                    value={form.apr} onChange={e => setForm({ ...form, apr: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Min. Payment ($)</label>
                  <input type="number" step="0.01" min="0" required className="input-dark" placeholder="25"
                    value={form.minimumPayment} onChange={e => setForm({ ...form, minimumPayment: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Due Day of Month</label>
                  <input type="number" min="1" max="31" required className="input-dark" placeholder="1-31"
                    value={form.dueDay} onChange={e => setForm({ ...form, dueDay: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Card Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {CARD_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110 border-2"
                        style={{ background: c, borderColor: form.color === c ? 'white' : 'transparent' }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Saving...' : (editId ? 'Update Card' : 'Add Card')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
