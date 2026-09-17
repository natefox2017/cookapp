import { Moon, RefreshCw, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { pageTitleForPath } from '@/components/layout/nav'
import { isMockMode } from '@/api'

export function Header({ onRefresh }: { onRefresh?: () => void }) {
  const location = useLocation()
  const title = pageTitleForPath(location.pathname)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-card/90 px-5 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {isMockMode() ? (
          <Badge variant="warning" className="hidden sm:inline-flex">
            Mock data
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {onRefresh ? (
          <Button variant="outline" size="sm" onClick={onRefresh} aria-label="Refresh data">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="icon"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setDark((value) => !value)}
        >
          {dark ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  )
}
