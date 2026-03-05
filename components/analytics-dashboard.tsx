"use client"

import { useState, useRef, useEffect } from "react"
import { useTenant } from "@/lib/tenant-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Calendar, Users, Scissors, FileText, DollarSign, CheckCircle, Clock, XCircle, UserCheck, Wallet, Target, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Format price helper function
const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

type TimePeriod = "today" | "weekly" | "monthly" | "ytd"

export default function AnalyticsDashboard() {
  const { currentTenant, isLoading: isTenantLoading } = useTenant()
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("today")
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const dashboardRef = useRef<HTMLDivElement>(null)

  // fetch analytics when period or dates change
  const fetchAnalytics = async () => {
    if (!currentTenant) return
    try {
      setLoading(true)
      const mapped = selectedPeriod === "ytd" ? "year" : selectedPeriod
      const res = await fetch(`/api/analytics?period=${mapped}&from=${fromDate}&to=${toDate}`, {
        headers: {
          'x-tenant-id': currentTenant.id
        }
      });
      const json = await res.json()
      setAnalytics(json)
    } catch (err) {
      console.error("Failed to load analytics", err)
    } finally {
      setLoading(false)
    }
  }

  // Only fetch when period is clicked (not dates)
  useEffect(() => {
    if (!isTenantLoading && currentTenant) {
      fetchAnalytics()
    }
  }, [selectedPeriod, currentTenant, isTenantLoading])

  // small helpers to safely access analytics
  const safe = (path: string[], fallback: any = 0) => {
    try {
      let cur: any = analytics
      for (const p of path) {
        if (cur == null) return fallback
        cur = cur[p]
      }
      return cur ?? fallback
    } catch {
      return fallback
    }
  }

  // KPIs
  const revenue = safe(["revenue", "total"], 0)
  const costs = safe(["finance", "expenses"], 0)
  const profit = revenue - costs

  const margin = safe(["revenue", "margin"], revenue > 0 ? Math.round((profit / revenue) * 100) : 0)

  const appointmentsTotal = safe(["appointments", "total"], 0)
  const appointmentsCompleted = safe(["appointments", "completed"], 0)
  const appointmentsPending = safe(["appointments", "pending"], 0)
  const appointmentsCancelled = safe(["appointments", "cancelled"], 0)
  const appointmentsNoShows = safe(["appointments", "noShows"], 0)
  const completionRate = safe(["appointments", "completionRate"], 0)

  const clientsNew = safe(["clients", "new"], 0)
  const clientsReturning = safe(["clients", "returning"], 0)
  const clientsTotalUnique = safe(["clients", "totalUnique"], 0)
  const retention = safe(["clients", "retention"], 0)

  const invoicesGenerated = safe(["invoices", "generated"], 0)
  const invoicesPaid = safe(["invoices", "paid"], 0)
  const invoicesPending = safe(["invoices", "pending"], 0)
  const invoicesCollected = safe(["invoices", "collected"], 0)

  // appointment trend (derive a simple 7-day or weekday series using peak.daily or fallback to hourly)
  const appointmentTrend = (() => {
    const daily = analytics?.peak?.daily ?? null
    if (daily) {
      // daily is { '2025-11-28': 12, ... } -> convert to array of { name: 'YYYY-MM-DD', appointments: n } sorted ascending
      const entries = Object.entries(daily).map(([d, v]) => ({ name: d, appointments: v }))
      entries.sort((a: any, b: any) => (a.name > b.name ? 1 : -1))
      // if more than 7 days, take last 7
      return entries.slice(Math.max(0, entries.length - 7))
    }
    // fallback stub (weekday)
    return [
      { name: 'Mon', appointments: 0 },
      { name: 'Tue', appointments: 0 },
      { name: 'Wed', appointments: 0 },
      { name: 'Thu', appointments: 0 },
      { name: 'Fri', appointments: 0 },
      { name: 'Sat', appointments: 0 },
      { name: 'Sun', appointments: 0 }
    ]
  })()

  // staff leaderboard
  const staffLeaderboard = analytics?.staffLeaderboard ?? []

  // download PDF
  const downloadPDF = async () => {
    if (!dashboardRef.current) return
    try {
      const html2canvas = (await import("html2canvas")).default
      const jsPDF = (await import("jspdf")).default

      const element = dashboardRef.current
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const periodLabel = selectedPeriod === "ytd" ? "YTD" : selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)
      pdf.save(`Analytics-Report-${periodLabel}-${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (err) {
      console.error("Error generating PDF", err)
    }
  }

  const getKPIStatus = (value: number, metric: string) => {
    if (metric === 'margin' && value >= 55) return { status: 'Excellent', color: '#228B22', icon: CheckCircle }
    if (metric === 'margin' && value >= 45) return { status: 'On Track', color: '#4169E1', icon: TrendingUp }
    if (metric === 'retention' && value >= 80) return { status: 'Excellent', color: '#228B22', icon: CheckCircle }
    if (metric === 'retention' && value >= 70) return { status: 'On Track', color: '#4169E1', icon: TrendingUp }
    if (metric === 'completion' && value >= 85) return { status: 'Excellent', color: '#228B22', icon: CheckCircle }
    if (metric === 'completion' && value >= 75) return { status: 'On Track', color: '#4169E1', icon: TrendingUp }
    return { status: 'Critical', color: '#DC143C', icon: CheckCircle }
  }

  const kpis = [
    { label: 'Profit Margin', value: `${margin}%`, status: getKPIStatus(margin, 'margin'), trend: margin >= 0 ? `+${margin}%` : `${margin}%` },
    { label: 'Appointment Completion', value: `${completionRate}%`, status: getKPIStatus(completionRate, 'completion'), trend: '+2%' },
    { label: 'Revenue Growth', value: revenue > 0 ? `${Math.round((revenue / 1000))}k` : '+0%', status: { status: 'On Track', color: '#228B22', icon: TrendingUp }, trend: '+12%' }
  ]

  // build appointment cards array same template you used
  const appointmentCards = [
    { label: 'Total', value: appointmentsTotal, icon: Calendar, color: 'black' },
    { label: 'Completed', value: appointmentsCompleted, icon: CheckCircle, color: '#228B22' },
    { label: 'Pending', value: appointmentsPending, icon: Clock, color: '#4169E1' },
    { label: 'Cancelled', value: appointmentsCancelled + appointmentsNoShows, icon: XCircle, color: '#DC143C' }
  ]

  // clients cards
  const clientCards = [
    { label: 'New Clients', value: clientsNew, icon: Users, color: '#4169E1' },
    { label: 'Total Served', value: clientsTotalUnique, icon: Users, color: 'black' }
  ]

  // invoice cards
  const invoiceCards = [
    { label: 'Generated', value: invoicesGenerated, icon: FileText, color: 'black' },
    { label: 'Paid', value: invoicesPaid, icon: CheckCircle, color: '#228B22' }
  ]

  // small helper for avg
  const servicesAvg = (revenue: number, servicesSold: number) => {
    if (!servicesSold || servicesSold <= 0) return 0
    return Math.round(revenue / servicesSold)
  }

  if (isTenantLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!currentTenant) {
    return <div className="min-h-screen flex items-center justify-center">No tenant selected</div>
  }

  return (
    <div ref={dashboardRef} className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-500 mt-1">Real-time insights and performance metrics</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2 p-1 bg-white rounded-full shadow-sm w-fit border border-gray-200">
              {(['today', 'weekly', 'monthly', 'ytd'] as TimePeriod[]).map((period) => (
                <Button
                  key={period}
                  variant="ghost"
                  onClick={() => setSelectedPeriod(period)}
                  className={`rounded-full px-6 py-2 transition-all duration-200 ${selectedPeriod === period ? "bg-black text-white shadow-md hover:bg-gray-800" : "hover:bg-gray-100"}`}
                >
                  {period === 'ytd' ? 'YTD' : period.charAt(0).toUpperCase() + period.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <span className="text-sm font-medium text-gray-600">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate || undefined}
                className="px-3 py-1 text-sm border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-600">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate || undefined}
                className="px-3 py-1 text-sm border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
              />

              {/* GENERATE BUTTON */}
              <Button
                onClick={fetchAnalytics}
                className="ml-3 rounded-full px-6 py-2 bg-black text-white hover:bg-gray-800 shadow-md"
                disabled={loading}
              >
                {loading ? "Loading..." : "Generate"}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Key Performance Indicators</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi, index) => {
              const StatusIcon = kpi.status.icon
              return (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: kpi.status.color }} />
                        <span className="text-sm font-medium text-gray-600">{kpi.label}</span>
                      </div>
                      <StatusIcon className="h-5 w-5 opacity-40" style={{ color: kpi.status.color }} />
                    </div>
                    <div className="space-y-3">
                      <div className="text-4xl font-bold tracking-tight text-gray-900">{kpi.value}</div>
                      <div className="flex items-center justify-between">
                        <Badge
                          className="font-medium"
                          style={{
                            backgroundColor: `${kpi.status.color}15`,
                            color: kpi.status.color,
                            border: `1px solid ${kpi.status.color}30`
                          }}
                        >
                          {kpi.status.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: kpi.status.color }}>
                          {kpi.trend.startsWith('+') ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {kpi.trend}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* NET PROFIT */}
        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black">
          <CardContent className="p-0">
            <div className="p-10">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-gray-400 text-sm font-medium tracking-wider uppercase mb-3">Net Profit </p>
                  <h2 className="text-6xl font-bold text-green-400">{formatPrice(profit)}</h2>
                </div>
                <div className="flex items-center gap-3 bg-green-600/20 px-4 py-3 rounded-2xl border border-green-600/30">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-green-400">{margin}%</div>
                    <div className="text-xs text-green-300">Margin</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-800">
                <div>
                  <p className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-2">Total Sale</p>
                  <p className="text-3xl font-bold text-white">{formatPrice(revenue)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-medium tracking-wider uppercase mb-2">Total Costs</p>
                  <p className="text-3xl font-bold text-red-400">{formatPrice(costs)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* APPOINTMENTS */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Appointments</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {appointmentCards.map((item, index) => {
              const Icon = item.icon
              return (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-gray-600">{item.label}</p>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}10` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: item.color }} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: item.color }}>{item.value}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold">Appointment Trends</CardTitle>
              <CardDescription>Recent appointment distribution</CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={appointmentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="appointments" stroke="#228B22" strokeWidth={3} dot={{ fill: '#228B22', r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* CLIENTS */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Clients</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {clientCards.map((item, index) => {
              const Icon = item.icon
              return (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-gray-600">{item.label}</p>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}10` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: item.color }} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: item.color }}>{item.value}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* INVOICES */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Invoices</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {invoiceCards.map((item, index) => {
              const Icon = item.icon
              return (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-gray-600">{item.label}</p>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}10` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: item.color }} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: item.color }}>{item.value}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* REVENUE & PROFITABILITY */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Revenue & Profitability</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Revenue', value: formatPrice(revenue), icon: DollarSign, color: '#228B22' },
              { label: 'Avg Service Price', value: formatPrice(servicesAvg(revenue, appointmentsTotal)), icon: Target, color: '#4169E1' },
              { label: 'Services Sold', value: appointmentsTotal, icon: Scissors, color: 'black' },
              { label: 'Profit Margin', value: `${margin}%`, icon: TrendingUp, color: '#228B22' }
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-medium text-gray-600">{item.label}</p>
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}10` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: item.color }} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: item.color }}>{item.value}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
