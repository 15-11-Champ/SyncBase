// components/ui/finance-client.tsx
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SummaryCard } from "@/components/finance/summary-card";
import { EntryForm } from "@/components/finance/entry-form";
import { EntryList } from "@/components/finance/entry-list";
import { FinancialHealthScore } from "@/components/finance/financial-health-score";
import { SavingsRate } from "@/components/finance/savings-rate";
import { QuickInsights } from "@/components/finance/quick-insights";
import { MonthlyComparison } from "@/components/finance/monthly-comparison";
import { CashFlowOverview } from "@/components/finance/cash-flow-overview";

type FinanceItem = {
  id: number;
  date: string | null;
  profit: number | null;
  expenses: number | null;
  created_at: string | null;
};

type FinanceListResponse = {
  items: FinanceItem[];
};

export function FinanceClient() {
  const [date, setDate] = useState("");
  const [profit, setProfit] = useState("");
  const [expenses, setExpenses] = useState("");
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalProfit = items.reduce(
    (sum, item) => sum + (Number(item.profit) || 0),
    0
  );
  const totalExpenses = items.reduce(
    (sum, item) => sum + (Number(item.expenses) || 0),
    0
  );
  const net = totalProfit - totalExpenses;
  const profitMargin = totalProfit > 0 ? parseFloat(((net / totalProfit) * 100).toFixed(1)) : 0;

  async function loadFinance() {
    try {
      setError(null);
      const res = await fetch("/api/finance");
      if (!res.ok) throw new Error("Failed to load finance data");
      const json: FinanceListResponse = await res.json();
      setItems(json.items ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFinance();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const p = Number(profit);
    const ex = Number(expenses);

    if (!date) {
      setError("Date is required");
      return;
    }
    if (Number.isNaN(p) || Number.isNaN(ex)) {
      setError("Profit and expenses must be numbers");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, profit: p, expenses: ex }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }

      const data = await res.json();
      setItems((prev) => [data.item, ...prev]);
      setDate("");
      setProfit("");
      setExpenses("");
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">Loading finance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Financial Health Management
        </h1>
        <p className="text-gray-500 mt-1">
          Comprehensive financial insights, tracking, and analysis
        </p>
      </div>

      {/* Primary Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <SummaryCard title="Total Profit" amount={totalProfit} type="profit" />
        <SummaryCard title="Total Expenses" amount={totalExpenses} type="expense" />
        <SummaryCard
          title={`Net ${net >= 0 ? "Profit" : "Loss"}`}
          amount={net}
          type="net"
          profitMargin={profitMargin}
        />
      </div>

      {/* Financial Health Dashboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FinancialHealthScore profit={totalProfit} expenses={totalExpenses} />
        <div className="space-y-6">
          <SavingsRate profit={totalProfit} expenses={totalExpenses} />
          <MonthlyComparison entries={items} />
        </div>
      </div>

      {/* Analysis Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CashFlowOverview
          profit={totalProfit}
          expenses={totalExpenses}
          entryCount={items.length}
        />
        <QuickInsights
          profit={totalProfit}
          expenses={totalExpenses}
          entryCount={items.length}
        />
      </div>

      {/* Entry Form */}
      <EntryForm
        date={date}
        profit={profit}
        expenses={expenses}
        saving={saving}
        error={error}
        onDateChange={setDate}
        onProfitChange={setProfit}
        onExpensesChange={setExpenses}
        onSubmit={handleSubmit}
      />

      {/* Entries List */}
      <div className="rounded-2xl shadow-lg bg-white border border-gray-100">
        <div className="border-b bg-gradient-to-r from-gray-50 to-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
              <p className="text-sm text-gray-500 mt-1">
                All your financial entries
              </p>
            </div>
            <span className="inline-block px-4 py-2 rounded-lg border-2 border-gray-200 bg-white text-base font-medium text-gray-700">
              {items.length} {items.length === 1 ? "Entry" : "Entries"}
            </span>
          </div>
        </div>
        <div className="p-6">
          <EntryList entries={items} />
        </div>
      </div>
    </div>
  );
}
