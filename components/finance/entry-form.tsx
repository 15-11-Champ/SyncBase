// components/finance/entry-form.tsx
"use client";

import { useState } from "react";
import { Calendar, DollarSign, PiggyBank, Plus, Loader2 } from "lucide-react";

interface EntryFormProps {
    onSubmit: (date: string,expenses: number,expenseName: string) => void;
}

export function EntryForm({ onSubmit }: EntryFormProps) {
    const [date, setDate] = useState("");
    const [expenses, setExpenses] = useState("");
    const [expenseName, setExpenseName] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const result = await onSubmit(date, expenses , expenseName);

  if (!result.success) {
    setError(result.message);
  } else {
    setDate("");
    setExpenses("");
    setError(null);
  }
};


    return (
        <div className="rounded-2xl shadow-lg bg-white border border-gray-100">
            <div className="border-b bg-gradient-to-r from-gray-50 to-white p-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                        <Plus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Add Financial Entry</h2>
                        <p className="text-sm text-gray-500 mt-1">Record your daily expenses</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* DATE */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-black focus:outline-none transition-colors"
                                required
                            />
                        </div>

                        
                        

                        {/* EXPENSES */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <PiggyBank className="h-4 w-4 text-red-600" />
                                Expenses
                            </label>
                            <input
                                type="number"
                                value={expenses}
                                onChange={(e) => setExpenses(e.target.value)}
                                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-red-500 focus:outline-none transition-colors"
                                placeholder="e.g. 2000"
                                required
                            />
                        </div>
                            {/* EXPENSE NAME */}
                            <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-blue-600" />
                                Name of Expense
                            </label>
                            <input
                                type="text"
                                value={expenseName}
                                onChange={(e) => setExpenseName(e.target.value)}
                                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                placeholder="e.g. Equipment"
                                required
                            />
                            </div>


                    </div>

                    {/* ERROR MESSAGE */}
                    {error && (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {/* SAVE BUTTON */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center px-6 py-3 text-base font-medium rounded-lg text-white bg-black hover:bg-gray-800 shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-5 w-5" />
                                Save Entry
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
