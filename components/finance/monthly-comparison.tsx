// components/finance/monthly-comparison.tsx
import React from 'react';

type Entry = {
  id?: string;
  date?: string;
  profits?: number;
  expenses?: number;
  netIncome?: number;
  profitMargin?: number;
};

type Props = {
  entries?: Entry[]; // optional, defaulted
};

export function MonthlyComparison({ entries = [] }: Props) {
  // Helper to sum profits & expenses for a given month offset (0 = current month, 1 = previous)
  const getMonthSums = (monthOffset = 0) => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const targetMonth = target.getMonth();
    const targetYear = target.getFullYear();

    const filtered = entries.filter((entry) => {
      if (!entry || !entry.date) return false;
      const d = new Date(entry.date);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    const profits = filtered.reduce((s, e) => s + (e.profits ?? 0), 0);
    const expenses = filtered.reduce((s, e) => s + (e.expenses ?? 0), 0);
    const net = profits - expenses;

    return { profits, expenses, net };
  };

  const current = getMonthSums(0);
  const previous = getMonthSums(1);

  // compute percent change safely
  const percentChange = (currentVal: number, prevVal: number) => {
    if (prevVal === 0) return currentVal === 0 ? 0 : 100;
    return ((currentVal - prevVal) / Math.abs(prevVal)) * 100;
  };

  const profitChange = percentChange(current.profits, previous.profits);
  const expenseChange = percentChange(current.expenses, previous.expenses);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Monthly Comparison</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium mb-1">Profit This Month</div>
          <div className="text-2xl font-bold text-green-700">
            {current.profits.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
          </div>
          <div className="text-sm text-red-500 mt-2">
            {profitChange >= 0 ? '▲' : '▼'} {Math.abs(profitChange).toFixed(1)}% vs last month
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-sm text-red-600 font-medium mb-1">Expenses This Month</div>
          <div className="text-2xl font-bold text-red-700">
            {current.expenses.toLocaleString(undefined, { style: 'currency', currency: 'INR' })}
          </div>
          <div className="text-sm text-red-500 mt-2">
            {expenseChange >= 0 ? '▲' : '▼'} {Math.abs(expenseChange).toFixed(1)}% vs last month
          </div>
        </div>
      </div>
    </div>
  );
}
