function letterFromGrade(grade) {
  const g = Number(grade) || 0
  if (g >= 80) return { letter: 'A', color: 'bg-gavfather-smash' }
  if (g >= 65) return { letter: 'B', color: 'bg-gavfather-play' }
  if (g >= 50) return { letter: 'C', color: 'bg-orange-500' }
  return { letter: g >= 35 ? 'D' : 'F', color: 'bg-gavfather-fade' }
}

export default function ScarcityMeter({ grade, label = 'Matchup', className = '' }) {
  const value = Math.max(0, Math.min(100, Number(grade) || 0))
  const { letter, color } = letterFromGrade(value)

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-gavfather-muted">
        <span>{label}</span>
        <span className="font-mono text-gavfather-text">
          {value.toFixed(0)} · {letter}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gavfather-border">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
