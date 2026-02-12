import { useState, useEffect, useCallback } from 'react'
import { cache, CACHE_KEYS } from '@/src/utils/cache'

interface UseCachedDataOptions<T> {
  key: string
  fetcher: () => Promise<T>
  initialData?: T
  ttl?: number
  enabled?: boolean
}

export function useCachedData<T>({
  key,
  fetcher,
  initialData,
  ttl,
  enabled = true
}: UseCachedDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      // Check cache first
      const cachedData = cache.get<T>(key)
      if (cachedData) {
        setData(cachedData)
        setLoading(false)
        return
      }

      // Fetch fresh data
      const freshData = await fetcher()
      setData(freshData)
      cache.set(key, freshData, ttl)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl, enabled])

  const refetch = useCallback(() => {
    cache.delete(key)
    return fetchData()
  }, [key, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch
  }
}

// Predefined hooks for common data types
const fetchTeams = async () => {
  const response = await fetch('/api/teams')
  if (!response.ok) throw new Error('Failed to fetch teams')
  const data = await response.json()
  return data.teams || []
}

export function useTeams() {
  return useCachedData({
    key: CACHE_KEYS.TEAMS,
    fetcher: fetchTeams
  })
}

const fetchFilters = async () => {
  const response = await fetch('/api/filters')
  if (!response.ok) throw new Error('Failed to fetch filters')
  return await response.json()
}

export function useFilters() {
  return useCachedData({
    key: CACHE_KEYS.FILTERS,
    fetcher: fetchFilters
  })
}

export function useStats(params: string = '') {
  const fetcher = useCallback(async () => {
    const response = await fetch(`/api/stats?${params}`)
    if (!response.ok) throw new Error('Failed to fetch stats')
    return await response.json()
  }, [params])

  return useCachedData({
    key: `${CACHE_KEYS.STATS}_${params}`,
    fetcher,
    ttl: 2 * 60 * 1000 // 2 minutes for stats
  })
}
