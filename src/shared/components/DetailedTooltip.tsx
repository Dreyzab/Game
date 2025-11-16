import React from 'react'

type DetailedTooltipProps = {
  title: string
  subtitle?: string
  description?: string
  position: { x: number; y: number }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const DetailedTooltip: React.FC<React.PropsWithChildren<DetailedTooltipProps>> = ({
  title,
  subtitle,
  description,
  position,
  children,
}) => {
  const width = 260
  const height = 160
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : width + 24
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : height + 24
  const left = clamp(position.x + 16, 12, viewportWidth - width - 12)
  const top = clamp(position.y + 16, 12, viewportHeight - height - 12)

  return (
    <div
      className="pointer-events-none fixed z-[9999] w-[260px] rounded-lg border border-amber-500/40 bg-slate-950/95 p-3 text-xs text-[color:var(--color-text-secondary)] shadow-2xl backdrop-blur"
      style={{ left, top }}
    >
      <div className="mb-1 text-[color:var(--color-text-primary)]">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle ? (
          <div className="text-[10px] uppercase tracking-[0.3em] text-amber-300">{subtitle}</div>
        ) : null}
      </div>
      {description ? <p className="mb-2">{description}</p> : null}
      {children}
    </div>
  )
}

export default DetailedTooltip

