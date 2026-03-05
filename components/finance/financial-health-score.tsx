// components/finance/financial-health-score.tsx
"use client";

import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface FinancialHealthScoreProps {
    profit: number;
    expenses: number;
}

export function FinancialHealthScore({ profit, expenses }: FinancialHealthScoreProps) {
    // Calculate health score (0-100)
    const calculateHealthScore = () => {
        if (profit === 0) return 0;

        const profitMargin = ((profit - expenses) / profit) * 100;
        const savingsRate = profit > 0 ? ((profit - expenses) / profit) * 100 : 0;

        // Score factors
        let score = 50; // Base score

        // Profit margin impact (0-30 points)
        if (profitMargin >= 60) score += 30;
        else if (profitMargin >= 40) score += 20;
        else if (profitMargin >= 20) score += 10;
        else if (profitMargin < 0) score -= 20;

        // Savings rate impact (0-20 points)
        if (savingsRate >= 50) score += 20;
        else if (savingsRate >= 30) score += 15;
        else if (savingsRate >= 10) score += 10;

        return Math.max(0, Math.min(100, Math.round(score)));
    };

    const score = calculateHealthScore();

    const getScoreColor = () => {
        if (score >= 80) return { bg: "bg-green-500", text: "text-green-600", label: "Excellent", icon: CheckCircle };
        if (score >= 60) return { bg: "bg-blue-500", text: "text-blue-600", label: "Good", icon: TrendingUp };
        if (score >= 40) return { bg: "bg-yellow-500", text: "text-yellow-600", label: "Fair", icon: AlertTriangle };
        return { bg: "bg-red-500", text: "text-red-600", label: "Poor", icon: AlertTriangle };
    };

    const { bg, text, label, icon: Icon } = getScoreColor();

    return (
        <div className="rounded-2xl shadow-xl bg-gradient-to-br from-purple-50 to-indigo-100 overflow-hidden relative p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full -mr-16 -mt-16" />
            <div className="relative">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Financial Health Score</p>
                        <p className="text-xs text-gray-500">Based on profit margin & savings</p>
                    </div>
                    <Icon className={`h-8 w-8 ${text}`} />
                </div>

                {/* Circular Progress */}
                <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32">
                        <svg className="transform -rotate-90 w-32 h-32">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                className="text-gray-200"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${(score / 100) * 351.68} 351.68`}
                                className={text.replace('text-', 'text-')}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-gray-900">{score}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-3 bg-${bg.split('-')[1]}-600/20 ${text} border border-${bg.split('-')[1]}-600/30`}>
                            {label} Health
                        </div>
                        <p className="text-sm text-gray-600">
                            {score >= 80 && "Your finances are in excellent shape! Keep up the great work."}
                            {score >= 60 && score < 80 && "Good financial health. Look for ways to increase savings."}
                            {score >= 40 && score < 60 && "Fair financial health. Consider reducing expenses."}
                            {score < 40 && "Your finances need attention. Focus on increasing profit or reducing costs."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
