"use client";

import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface CashFlowOverviewProps {
    profit: number;
    expenses: number;
    entryCount: number;
}

export function CashFlowOverview({ profit, expenses, entryCount }: CashFlowOverviewProps) {
    const net = profit - expenses;
    const avgDailyNet = entryCount > 0 ? net / entryCount : 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
        }).format(Math.abs(value));
    };

    return (
        <div className="rounded-2xl shadow-lg bg-gradient-to-br from-slate-50 to-gray-100 border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-slate-600" />
                <h3 className="text-lg font-bold text-gray-900">Cash Flow Overview</h3>
            </div>

            <div className="space-y-4">
                {/* Inflow */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Cash Inflow</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(profit)}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Avg/Day</p>
                        <p className="text-sm font-semibold text-gray-700">
                            {formatCurrency(entryCount > 0 ? profit / entryCount : 0)}
                        </p>
                    </div>
                </div>

                {/* Outflow */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <TrendingDown className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Cash Outflow</p>
                            <p className="text-lg font-bold text-red-600">{formatCurrency(expenses)}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Avg/Day</p>
                        <p className="text-sm font-semibold text-gray-700">
                            {formatCurrency(entryCount > 0 ? expenses / entryCount : 0)}
                        </p>
                    </div>
                </div>

                {/* Net Flow */}
                <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
                    }`}>
                    <div>
                        <p className="text-xs text-gray-600 font-medium mb-1">Net Cash Flow</p>
                        <p className={`text-2xl font-bold ${net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {net >= 0 ? '+' : '-'}{formatCurrency(net)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-600 mb-1">Daily Average</p>
                        <p className={`text-lg font-bold ${avgDailyNet >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {avgDailyNet >= 0 ? '+' : '-'}{formatCurrency(avgDailyNet)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}