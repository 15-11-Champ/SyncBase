// components/finance/summary-card.tsx
"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface SummaryCardProps {
    title: string;
    amount: number;
    type: "profit" | "expense" | "net";
    profitMargin?: number;
}

export function SummaryCard({ title, amount, type, profitMargin }: SummaryCardProps) {
    const isProfit = type === "profit";
    const isExpense = type === "expense";
    const isNet = type === "net";
    const isPositiveNet = amount >= 0;

    const bgGradient = isProfit
        ? "bg-gradient-to-br from-green-50 to-emerald-100"
        : isExpense
            ? "bg-gradient-to-br from-red-50 to-rose-100"
            : isPositiveNet
                ? "bg-gradient-to-br from-blue-50 to-indigo-100"
                : "bg-gradient-to-br from-orange-50 to-amber-100";

    const iconBg = isProfit
        ? "bg-green-600"
        : isExpense
            ? "bg-red-600"
            : isPositiveNet
                ? "bg-blue-600"
                : "bg-orange-600";

    const textColor = isProfit
        ? "text-green-600"
        : isExpense
            ? "text-red-600"
            : isPositiveNet
                ? "text-blue-600"
                : "text-orange-600";

    const badgeBg = isProfit
        ? "bg-green-600/20 text-green-700 border border-green-600/30"
        : isExpense
            ? "bg-red-600/20 text-red-700 border border-red-600/30"
            : isPositiveNet
                ? "bg-blue-600/20 text-blue-700 border border-blue-600/30"
                : "bg-orange-600/20 text-orange-700 border border-orange-600/30";

    const Icon = isProfit ? TrendingUp : isExpense ? TrendingDown : Wallet;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className={`rounded-2xl shadow-xl overflow-hidden relative p-8 ${bgGradient}`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-10 ${iconBg}`} />
            <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">{title}</p>
                </div>
                <p className={`text-5xl font-bold mb-2 ${textColor}`}>
                    {type === "net"
  ? formatCurrency(amount)
  : formatCurrency(Math.abs(amount))}
                </p>
                {isNet && profitMargin !== undefined && (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${badgeBg}`}>
                        {isPositiveNet ? `+${profitMargin}%` : `${profitMargin}%`} Margin
                    </span>
                )}
                {isProfit && (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${badgeBg}`}>
                        Revenue Generated
                    </span>
                )}
                {isExpense && (
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${badgeBg}`}>
                        Costs Incurred
                    </span>
                )}
            </div>
        </div>
    );
}
