'use client';

import { useEffect, useRef, useState } from 'react'
import StaffManagement from '@/components/staff-management'
import StaffPerformance from '@/components/staff-performance'

export default function StaffPage() {
  const [showPerformance, setShowPerformance] = useState(false)
  const performanceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const flag = localStorage.getItem('openStaffPerformance')

    if (flag === 'true') {
      setShowPerformance(true)

      setTimeout(() => {
        performanceRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 200)

      localStorage.removeItem('openStaffPerformance')
    }
  }, [])

  return (
    <div className="flex-1 overflow-auto p-6 space-y-12">
      {/* Staff Management */}
      <StaffManagement />

      {/* Staff Performance (visible only when needed) */}
      {showPerformance && (
        <div ref={performanceRef}>
          <StaffPerformance />
        </div>
      )}
    </div>
  )
}
