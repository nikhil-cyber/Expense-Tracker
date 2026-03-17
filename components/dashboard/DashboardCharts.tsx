'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CATEGORY_COLORS } from '@/lib/utils';

interface Props {
  monthlyData: { month: string; amount: number }[];
  categoryBreakdown: Record<string, number>;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-slate-300 text-sm font-medium">{label}</p>
        <p className="text-emerald-400 text-sm font-bold">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-slate-300 text-sm font-medium">{payload[0].name}</p>
        <p className="text-purple-400 text-sm font-bold">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ monthlyData, categoryBreakdown }: Props) {
  const pieData = Object.entries(categoryBreakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Monthly Spending Bar Chart */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4">Spending Trend (6 months)</h3>
        {monthlyData.every(d => d.amount === 0) ? (
          <div className="flex items-center justify-center h-44 text-slate-500 text-sm">
            No spending data yet — add some expenses to see trends
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="amount" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c63ff" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.5} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category Pie Chart */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-slate-200 mb-4">Spending by Category</h3>
        {pieData.length === 0 ? (
          <div className="flex items-center justify-center h-44 text-slate-500 text-sm">
            No expenses this month — start tracking to see breakdown
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORY_COLORS[entry.name] || '#6b7280'}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
