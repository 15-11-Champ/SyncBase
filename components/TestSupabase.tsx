'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestSupabase() {
  useEffect(() => {
    async function runTest() {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1)

      console.log("Supabase Test Data:", data)
      console.log("Supabase Test Error:", error)
    }

    runTest()
  }, [])

  return null
}
