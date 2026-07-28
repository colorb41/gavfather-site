const COLORS = {
  QB: 'bg-gavfather-qb text-white',
  RB: 'bg-gavfather-rb text-white',
  WR: 'bg-gavfather-wr text-white',
  TE: 'bg-gavfather-te text-white',
}

export default function PositionBadge({ position, className = '' }) {
  const pos = String(position || '').toUpperCase()
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
        COLORS[pos] || 'bg-gray-600 text-white'
      } ${className}`}
    >
      {pos || '—'}
    </span>
  )
}
