import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncState<T> {
  data: T | null
  error: string | null
  loading: boolean
  /** True while a request is in flight after the first successful load. */
  refreshing: boolean
  reload: () => void
}

/**
 * Loads async data tied to `deps`.
 * Clears stale `data` when dependencies change so filters cannot flash old rows.
 * Soft `reload()` keeps previous data visible while refreshing.
 */
export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tick, setTick] = useState(0)
  const softReloadRef = useRef(false)
  const depsKey = JSON.stringify(deps)
  const prevDepsKey = useRef(depsKey)

  const reload = useCallback(() => {
    softReloadRef.current = true
    setTick((value) => value + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    const depsChanged = prevDepsKey.current !== depsKey
    prevDepsKey.current = depsKey
    const soft = softReloadRef.current && !depsChanged
    softReloadRef.current = false

    if (soft) {
      setRefreshing(true)
    } else {
      setLoading(true)
      setData(null)
    }
    setError(null)

    loader()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Request failed')
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, depsKey])

  return { data, error, loading, refreshing, reload }
}
