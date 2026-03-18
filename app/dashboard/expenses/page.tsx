'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, CATEGORY_COLORS } from '@/lib/utils';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  paymentSourceType: string | null;
  paymentSourceId: string | null;
  fromAccountId: string | null;
}

interface Account {
  id: string;
  name: string;
  bank: string | null;
  balance: number;
}

interface CreditCard {
  id: string;
  name: string;
  bank: string;
  balance: number;
  color: string;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ExpensesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    amount: '',
    category: 'Food & Dining',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentSource: '', // "account_<id>" or "creditCard_<id>" or ""
    fromAccountId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (filterCat) params.set('category', filterCat);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data);
    setLoading(false);
  }, [month, year, filterCat]);

  async function fetchPaymentSources() {
    const [accRes, cardRes] = await Promise.all([
      fetch('/api/accounts'),
      fetch('/api/credit-cards'),
    ]);
    setAccounts(await accRes.json());
    setCards(await cardRes.json());
  }

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchPaymentSources(); }, []);

  function paymentSourceValue(type: string | null, id: string | null) {
    if (!type || !id) return '';
    return `${type}_${id}`;
  }

  function openAddForm() {
    setForm({ amount: '', category: 'Food & Dining', description: '', date: new Date().toISOString().split('T')[0], paymentSource: '', fromAccountId: '' });
    setEditId(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(expense: Expense) {
    setForm({
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description || '',
      date: new Date(expense.date).toISOString().split('T')[0],
      paymentSource: paymentSourceValue(expense.paymentSourceType, expense.paymentSourceId),
      fromAccountId: expense.fromAccountId || '',
    });
    setEditId(expense.id);
    setFormError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    let paymentSourceType: string | null = null;
    let paymentSourceId: string | null = null;
    if (form.paymentSource) {
      const [type, ...rest] = form.paymentSource.split('_');
      paymentSourceType = type;
      paymentSourceId = rest.join('_');
    }

    const fromAccountId = form.category === 'Credit Card Payment' ? (form.fromAccountId || null) : null;

    try {
      const url = editId ? `/api/expenses/${editId}` : '/api/expenses';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, paymentSourceType, paymentSourceId, fromAccountId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || `Server error (${res.status}). Please try again.`);
        return;
      }

      setShowForm(false);
      fetchExpenses();
      fetchPaymentSources();
    } catch (err) {
      setFormError('Network error. Make sure the server is running.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    fetchExpenses();
    fetchPaymentSources();
  }

  function getPaymentSourceLabel(type: string | null, id: string | null) {
    if (!type || !id) return null;
    if (type === 'account') {
      const acct = accounts.find(a => a.id === id);
      return acct ? `${acct.name}${acct.bank ? ` (${acct.bank})` : ''}` : 'Account';
    }
    if (type === 'creditCard') {
      const card = cards.find(c => c.id === id);
      return card ? `${card.name} — ${card.bank}` : 'Credit Card';
    }
    return null;
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const years = [now.getFullYear(), now.getFullYear() - 1, now.getFullYear() - 2];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Expenses</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and manage your spending</p>
        </div>
        <button onClick={openAddForm} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <select className="select-dark w-36" value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select className="select-dark w-28" value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="select-dark w-44" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="ml-auto">
          <span className="text-sm text-slate-400">Total: </span>
          <span className="text-sm font-bold text-red-400">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Category summary chips */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
              style={{
                background: filterCat === cat ? `${CATEGORY_COLORS[cat] || '#6b7280'}30` : 'rgba(255,255,255,0.04)',
                borderColor: filterCat === cat ? `${CATEGORY_COLORS[cat] || '#6b7280'}60` : 'rgba(255,255,255,0.08)',
                color: CATEGORY_COLORS[cat] || '#94a3b8',
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[cat] || '#6b7280' }} />
              {cat}: {formatCurrency(amt)}
            </button>
          ))}
        </div>
      )}

      {/* Expense list */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading...</div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-400 font-medium">No expenses found</p>
            <p className="text-slate-500 text-sm mt-1">Add an expense to get started</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Paid With</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(expense => {
                const sourceLabel = getPaymentSourceLabel(expense.paymentSourceType, expense.paymentSourceId);
                const isCreditCard = expense.paymentSourceType === 'creditCard';
                return (
                  <tr key={expense.id}>
                    <td className="text-slate-400 whitespace-nowrap">{formatDate(expense.date)}</td>
                    <td>
                      <span className="text-slate-200 font-medium">{expense.description || '—'}</span>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: `${CATEGORY_COLORS[expense.category] || '#6b7280'}20`,
                        color: CATEGORY_COLORS[expense.category] || '#94a3b8',
                      }}>
                        {expense.category}
                      </span>
                    </td>
                    <td>
                      {sourceLabel ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-300">
                          {isCreditCard ? (
                            <svg className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                          )}
                          {sourceLabel}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="text-right font-semibold text-red-400">{formatCurrency(expense.amount)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditForm(expense)} className="text-slate-500 hover:text-slate-300 transition-colors p-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDelete(expense.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-content p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-100">{editId ? 'Edit Expense' : 'Add Expense'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount ($)</label>
                <input type="number" step="0.01" min="0.01" required className="input-dark" placeholder="0.00"
                  value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                <select required className="select-dark" value={form.category} onChange={e => {
                  const newCat = e.target.value;
                  const isSwitchingToPayment = newCat === 'Credit Card Payment';
                  const isSwitchingFromPayment = form.category === 'Credit Card Payment';
                  setForm({
                    ...form,
                    category: newCat,
                    paymentSource: (isSwitchingToPayment || isSwitchingFromPayment) ? '' : form.paymentSource,
                    fromAccountId: isSwitchingFromPayment ? '' : form.fromAccountId,
                  });
                }}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {form.category === 'Credit Card Payment' ? 'Which Card' : 'Paid With'}
                </label>
                <select className="select-dark" value={form.paymentSource} onChange={e => setForm({ ...form, paymentSource: e.target.value })}>
                  <option value="">— Not specified —</option>
                  {form.category === 'Credit Card Payment' ? (
                    cards.map(c => (
                      <option key={c.id} value={`creditCard_${c.id}`}>
                        {c.name} — {c.bank} (Balance: {formatCurrency(c.balance)})
                      </option>
                    ))
                  ) : (
                    <>
                      {accounts.length > 0 && (
                        <optgroup label="Bank Accounts">
                          {accounts.map(a => (
                            <option key={a.id} value={`account_${a.id}`}>
                              {a.name}{a.bank ? ` (${a.bank})` : ''} — {formatCurrency(a.balance)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {cards.length > 0 && (
                        <optgroup label="Credit Cards">
                          {cards.map(c => (
                            <option key={c.id} value={`creditCard_${c.id}`}>
                              {c.name} — {c.bank}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </>
                  )}
                </select>
                {form.paymentSource && (
                  <p className="text-xs text-slate-500 mt-1">
                    {form.category === 'Credit Card Payment'
                      ? "This card's balance will be reduced by this amount."
                      : form.paymentSource.startsWith('account_')
                        ? 'Balance will be decreased by this amount.'
                        : 'Credit card balance will be increased by this amount.'}
                  </p>
                )}
              </div>
              {form.category === 'Credit Card Payment' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Paid From Account (optional)</label>
                  <select
                    className="select-dark"
                    value={form.fromAccountId}
                    onChange={e => setForm({ ...form, fromAccountId: e.target.value })}
                  >
                    <option value="">— Not specified —</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}{a.bank ? ` (${a.bank})` : ''} — {formatCurrency(a.balance)}
                      </option>
                    ))}
                  </select>
                  {form.fromAccountId && (
                    <p className="text-xs text-slate-500 mt-1">This account&apos;s balance will also be decreased by this amount.</p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (optional)</label>
                <input type="text" className="input-dark" placeholder="e.g. Grocery run"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Date</label>
                <input type="date" required className="input-dark" value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              {formError && (
                <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? 'Saving...' : (editId ? 'Update' : 'Add Expense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
