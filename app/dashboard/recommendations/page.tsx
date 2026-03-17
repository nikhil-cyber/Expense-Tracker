'use client';

import { useState } from 'react';

interface RecommendationType {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

const TYPES: RecommendationType[] = [
  {
    id: 'full_analysis',
    label: 'Full Financial Analysis',
    description: 'Complete overview of your finances with a health score and 90-day action plan',
    icon: '📊',
    color: '#6c63ff',
    gradient: 'from-purple-500/15 to-violet-500/5 border-purple-500/25',
  },
  {
    id: 'expense_reduction',
    label: 'Reduce Expenses',
    description: 'Personalized tips to cut spending based on your actual spending patterns',
    icon: '✂️',
    color: '#ef4444',
    gradient: 'from-red-500/15 to-rose-500/5 border-red-500/25',
  },
  {
    id: 'credit_cards',
    label: 'Credit Card Strategy',
    description: 'Avalanche vs snowball analysis, payoff timeline, and interest calculations',
    icon: '💳',
    color: '#f59e0b',
    gradient: 'from-amber-500/15 to-yellow-500/5 border-amber-500/25',
  },
  {
    id: 'savings_allocation',
    label: 'Savings Allocation',
    description: 'How to split money across emergency fund, vacation, retirement, and more',
    icon: '🎯',
    color: '#10b981',
    gradient: 'from-emerald-500/15 to-green-500/5 border-emerald-500/25',
  },
  {
    id: 'investments',
    label: 'Investment Strategy',
    description: '401k, Roth IRA, index funds, and long-term wealth building roadmap',
    icon: '📈',
    color: '#3b82f6',
    gradient: 'from-blue-500/15 to-cyan-500/5 border-blue-500/25',
  },
];

function formatMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key++} className="text-xl font-bold text-slate-100 mt-6 mb-3 pb-2 border-b border-white/[0.08]">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key++} className="text-base font-semibold text-purple-300 mt-5 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
      elements.push(<p key={key++} className="font-semibold text-slate-100 my-1">{line.slice(2, -2)}</p>);
    } else if (line.startsWith('- **')) {
      const boldEnd = line.indexOf('**', 4);
      if (boldEnd > 0) {
        const boldText = line.slice(4, boldEnd);
        const rest = line.slice(boldEnd + 2);
        elements.push(
          <div key={key++} className="flex gap-2 my-1.5 ml-2">
            <span className="text-purple-400 mt-0.5 flex-shrink-0">•</span>
            <p className="text-slate-300 text-sm"><strong className="text-slate-100">{boldText}</strong>{rest}</p>
          </div>
        );
      } else {
        elements.push(<div key={key++} className="flex gap-2 my-1.5 ml-2"><span className="text-purple-400 mt-0.5">•</span><p className="text-slate-300 text-sm">{line.slice(2)}</p></div>);
      }
    } else if (line.startsWith('- ')) {
      elements.push(
        <div key={key++} className="flex gap-2 my-1 ml-2">
          <span className="text-slate-500 mt-0.5 flex-shrink-0">•</span>
          <p className="text-slate-300 text-sm">{parseBold(line.slice(2))}</p>
        </div>
      );
    } else if (line.match(/^\*\*\d+\./)) {
      elements.push(<p key={key++} className="font-semibold text-slate-100 mt-4 mb-1">{parseBold(line)}</p>);
    } else if (line.startsWith('  →')) {
      elements.push(<p key={key++} className="text-slate-400 text-sm ml-4 my-0.5">{parseBold(line)}</p>);
    } else if (line.startsWith('→')) {
      elements.push(<p key={key++} className="text-slate-400 text-sm ml-2 my-0.5">{parseBold(line)}</p>);
    } else if (line.startsWith('---')) {
      elements.push(<hr key={key++} className="border-white/[0.08] my-4" />);
    } else if (line.startsWith('| ')) {
      elements.push(<p key={key++} className="text-slate-400 text-xs font-mono my-0.5">{line}</p>);
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      elements.push(<p key={key++} className="text-slate-300 text-sm my-1">{parseBold(line)}</p>);
    }
  }

  return elements;
}

function parseBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-slate-100 font-semibold">{part}</strong> : part
  );
}

export default function RecommendationsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(typeId: string) {
    setSelectedType(typeId);
    setResult('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate recommendations');
      } else {
        setResult(data.recommendation);
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const currentType = TYPES.find(t => t.id === selectedType);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Financial Insights</h1>
        <p className="text-slate-400 text-sm mt-0.5">Personalized recommendations based on your financial data</p>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => handleGenerate(type.id)}
            disabled={loading}
            className={`glass-card p-5 text-left transition-all hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-br ${type.gradient} border ${selectedType === type.id ? 'ring-1' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ '--tw-ring-color': `${type.color}50` } as React.CSSProperties}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">{type.icon}</span>
              <div>
                <h3 className="font-semibold text-slate-100 mb-1">{type.label}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{type.description}</p>
              </div>
            </div>
            {selectedType === type.id && loading && (
              <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: type.color }}>
                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing your data...
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      {error && (
        <div className="glass-card p-4 border border-red-500/20 bg-red-500/5">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {result && currentType && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.08]">
            <span className="text-2xl">{currentType.icon}</span>
            <div>
              <h2 className="font-bold text-slate-100">{currentType.label}</h2>
              <p className="text-xs text-slate-500">Based on your current financial data</p>
            </div>
            <button onClick={() => { setResult(''); setSelectedType(null); }}
              className="ml-auto text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="prose prose-invert max-w-none">
            {formatMarkdown(result)}
          </div>
          <div className="mt-6 pt-4 border-t border-white/[0.06] flex gap-3">
            <button onClick={() => handleGenerate(currentType.id)} className="btn-secondary text-sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="glass-card py-16 text-center">
          <p className="text-5xl mb-4">💡</p>
          <p className="text-slate-300 font-semibold text-lg">Select an insight above to get started</p>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">
            Your personalized recommendations are generated from your actual financial data — no guesswork.
          </p>
        </div>
      )}
    </div>
  );
}
