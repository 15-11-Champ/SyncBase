"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface FinanceEntry {
    id: number;
    date: string | null;
    profit: number | null;
    expenses: number | null;
    expense_name: string | null;   // FIXED naming
    created_at: string | null;
}

interface EntryListProps {
    entries?: FinanceEntry[];
    onEdit: (entry: FinanceEntry) => void;
    onDelete: (entry: FinanceEntry) => void;
}

export function EntryList({ entries = [], onEdit, onDelete }: EntryListProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
  if (!dateStr) return "No date";

  const [year, month, day] = dateStr.split("-");

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return `${day} ${months[Number(month) - 1]} ${year}`;
};



    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString("en-IN");
    };

    // Empty state
    if (!entries || entries.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium mb-1">No entries yet</p>
                <p className="text-sm text-gray-400">Add your first financial entry above</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-96 overflow-y-auto">
            {entries.map((entry) => {
                const netRow = (Number(entry.profit) || 0) - (Number(entry.expenses) || 0);
                const isProfit = netRow >= 0;

                return (
                    <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all bg-white"
                    >
                        {/* LEFT CONTENT */}
                        <div className="flex items-center gap-4">
                            <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                    isProfit ? "bg-green-100" : "bg-red-100"
                                }`}
                            >
                                {isProfit ? (
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-6 w-6 text-red-600" />
                                )}
                            </div>

                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <p className="font-semibold text-gray-900">
                                        {entry.date ? formatDate(entry.date) : "No date"}
                                    </p>

                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                            isProfit
                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                : "bg-red-100 text-red-700 border border-red-200"
                                        }`}
                                    >
                                        Net: {formatCurrency(Math.abs(netRow))}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-500">
                                    •{" "}
                                    <span className="text-red-600 font-medium">
                                        Expenses: {formatCurrency(Number(entry.expenses || 0))}
                                    </span>{" "}
                                    •{" "}
                                    <span className="text-red-600 font-medium">
                                        Name: {entry.expense_name || "None"}
                                    </span>
                                </p>
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => onEdit(entry)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() => onDelete(entry)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* TIMESTAMP */}
                        {entry.created_at && (
                            <p className="text-xs text-gray-400">{formatDateTime(entry.created_at)}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
