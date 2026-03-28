import { Button } from '~/components/ui/button'

export function AuthBootstrapError({
  message,
  detail,
  onRetry,
}: {
  message: string
  detail?: string
  onRetry?: () => void
}) {
  return (
    <div className="space-y-4 border-3 border-destructive/50 bg-card p-5 sm:p-6 brutalist-shadow-sm">
      <div className="space-y-2">
        <p className="section-label text-destructive">Auth Error</p>
        <h1 className="text-xl font-black tracking-tight sm:text-2xl">
          We couldn&apos;t finish signing you in
        </h1>
        <p className="text-sm text-muted-foreground font-mono">{message}</p>
        {detail ? (
          <p className="text-xs text-muted-foreground/80 font-mono">{detail}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {onRetry ? (
          <Button onClick={onRetry} className="w-full sm:w-auto">
            Retry
          </Button>
        ) : null}
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full sm:w-auto"
        >
          Reload Page
        </Button>
      </div>
    </div>
  )
}
