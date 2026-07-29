const STYLES = {
  SMASH: 'bg-gavfather-smash text-white',
  ELITE: 'bg-gavfather-smash text-white',
  PLAY: 'bg-gavfather-play text-black',
  QB1: 'bg-gavfather-play text-black',
  'RB1/2': 'bg-gavfather-play text-black',
  'WR1/2': 'bg-gavfather-play text-black',
  TE1: 'bg-gavfather-play text-black',
  NEUTRAL: 'bg-gavfather-neutral-badge text-white',
  FADE: 'bg-gavfather-fade-badge text-white',
  HARD_FADE: 'bg-gavfather-hard-fade text-white',
  AVOID: 'bg-gavfather-hard-fade text-white',
}

export default function OutlookBadge({ outlook, className = '' }) {
  const key = String(outlook || 'NEUTRAL')
    .toUpperCase()
    .replace(/\s+/g, '_')
  const label = key === 'HARD_FADE' ? 'HARD FADE' : key
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        STYLES[key] || STYLES.NEUTRAL
      } ${className}`}
    >
      {label}
    </span>
  )
}
