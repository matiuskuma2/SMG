import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'

export type Theme = {
  theme_id: string
  theme_name: string
}

export const useThemes = () => {
  const [themes, setThemes] = useState<Theme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)

  useEffect(() => {
    const fetchThemes = async () => {
      const supabase = createClient()

      try {
        setLoading(true)

        const { data, error: fetchError } = await supabase
          .from('mst_theme')
          .select('theme_id, theme_name')
          .is('deleted_at', null)
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError

        setThemes(data || [])
      } catch (error) {
        setError(error as PostgrestError)
        console.error('Error fetching themes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchThemes()
  }, [])

  return { themes, loading, error }
}
