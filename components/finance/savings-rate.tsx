// components/finance/savings-rate.tsx
"use client";

import { PiggyBank, TrendingUp } from "lucide-react";

interface SavingsRateProps {
    profit: number;
    expenses: number;
}

export function SavingsRate({ profit, expenses }: SavingsRateProps) {
    const net = profit - expenses;
    const savingsRate = profit > 0 ? ((net / profit) * 100).toFixed(1) : "0.0";
    const isPositive = net >= 0;

    return (
        <div className={`rounded-2xl shadow-lg overflow-hidden relative p-6 ${isPositive ? 'bg-gradient-to-br from-emerald-50 to-teal-100' : 'bg-gradient-to-br from-gray-50 to-gray-100'
            }`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPositive ? 'bg-emerald-600' : 'bg-gray-400'
                        }`}>
                        <PiggyBank className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 font-medium">Savings Rate</p>
                        <p className={`text-3xl font-bold ${isPositive ? 'text-emerald-600' : 'text-gray-600'
                            }`}>
                            {savingsRate}%
                        </p>
                    </div>
                </div>
                {isPositive && (
                    <TrendingUp className="h-8 w-8 text-emerald-600" />
                )}
            </div>
            <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${isPositive ? 'bg-emerald-600' : 'bg-gray-400'
                            }`}
                        style={{ width: `${Math.min(parseFloat(savingsRate), 100)}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {isPositive
                        ? `You're saving ${savingsRate}% of your profit`
                        : "Focus on reducing expenses to start saving"}
                </p>
            </div>
        </div>
    );
}
