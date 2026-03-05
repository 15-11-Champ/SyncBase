// components/finance/quick-insights.tsx
"use client";

import { Lightbulb, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

interface QuickInsightsProps {
    profit: number;
    expenses: number;
    entryCount: number;
}

export function QuickInsights({ profit, expenses, entryCount }: QuickInsightsProps) {
    const net = profit - expenses;
    const avgDailyProfit = entryCount > 0 ? profit / entryCount : 0;
    const avgDailyExpenses = entryCount > 0 ? expenses / entryCount : 0;
    const profitMargin = profit > 0 ? ((net / profit) * 100).toFixed(1) : "0";

    const insights = [];

    // Generate insights based on data
    if (parseFloat(profitMargin) >= 50) {
        insights.push({
            type: "success",
            icon: CheckCircle2,
            message: `Excellent profit margin of ${profitMargin}%! You're running a very profitable operation.`,
        });
    } else if (parseFloat(profitMargin) >= 30) {
        insights.push({
            type: "good",
            icon: TrendingUp,
            message: `Good profit margin of ${profitMargin}%. Consider optimizing costs to increase further.`,
        });
    } else if (parseFloat(profitMargin) > 0) {
        insights.push({
            type: "warning",
            icon: AlertCircle,
            message: `Profit margin is ${profitMargin}%. Focus on reducing expenses or increasing revenue.`,
        });
    } else {
        insights.push({
            type: "alert",
            icon: AlertCircle,
            message: "You're operating at a loss. Urgent action needed to reduce costs or increase income.",
        });
    }

    if (avgDailyProfit > 0) {
        insights.push({
            type: "info",
            icon: Lightbulb,
            message: `Average daily profit: ₹${avgDailyProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
        });
    }

    if (expenses > profit) {
        insights.push({
            type: "warning",
            icon: AlertCircle,
            message: "Expenses exceed profit. Review spending categories and cut unnecessary costs.",
        });
    }

    const getColors = (type: string) => {
        switch (type) {
            case "success":
                return "bg-green-50 border-green-200 text-green-700";
            case "good":
                return "bg-blue-50 border-blue-200 text-blue-700";
            case "warning":
                return "bg-yellow-50 border-yellow-200 text-yellow-700";
            case "alert":
                return "bg-red-50 border-red-200 text-red-700";
            default:
                return "bg-gray-50 border-gray-200 text-gray-700";
        }
    };

    return (
        <div className="rounded-2xl shadow-lg bg-white border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900">Financial Insights</h3>
            </div>
            <div className="space-y-3">
                {insights.length > 0 ? (
                    insights.map((insight, index) => {
                        const Icon = insight.icon;
                        return (
                            <div
                                key={index}
                                className={`flex items-start gap-3 p-4 rounded-lg border ${getColors(insight.type)}`}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <p className="text-sm font-medium">{insight.message}</p>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-sm text-gray-500">Add financial entries to see personalized insights</p>
                )}
            </div>
        </div>
    );
}
