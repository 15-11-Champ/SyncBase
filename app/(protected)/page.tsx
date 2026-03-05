import AnalyticsDashboard from '@/components/analytics-dashboard'
import TestSupabase from '@/components/TestSupabase'

export default function Home() {
  return (
    <div className="flex-1 overflow-auto p-6">
      <AnalyticsDashboard />
      <TestSupabase />
    </div>
  )
}
