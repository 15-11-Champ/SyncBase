"use client";

import { useEffect, useState } from "react";

export function EditEntryModal({ open, onClose, entry, onSave }) {
  const [date, setDate] = useState("");
  const [expenses, setExpenses] = useState("");
  const [expenseName, setExpenseName] = useState("");

  useEffect(() => {
    if (entry) {
      setDate(entry.date || "");
      setExpenses(entry.expenses?.toString() || "");
      setExpenseName(entry.expense_name || "");
    }
  }, [entry]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md space-y-4">

        <h2 className="text-lg font-semibold">Edit Entry</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Expenses</label>
            <input
              type="number"
              className="border rounded-lg px-3 py-2 w-full"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Name of Expense</label>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 w-full"
              value={expenseName}
              onChange={(e) => setExpenseName(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            className="px-4 py-2 border rounded-lg"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-black text-white rounded-lg"
            onClick={() =>
              onSave({
                ...entry,
                date,
                expenses: Number(expenses),
                expense_name: expenseName,
              })
            }
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
