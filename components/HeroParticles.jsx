'use client'

export default function HeroParticles() {
  const dots = [
    { top: '18%', left: '12%', delay: '0s' },
    { top: '28%', left: '78%', delay: '1.2s' },
    { top: '62%', left: '22%', delay: '2.1s' },
    { top: '70%', left: '68%', delay: '0.6s' },
    { top: '42%', left: '88%', delay: '1.8s' },
    { top: '80%', left: '45%', delay: '2.8s' },
    { top: '15%', left: '55%', delay: '3.2s' },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-hero-glow animate-shimmer bg-[length:200%_200%]" />
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute h-1 w-1 rounded-full bg-gavfather-gold/40 animate-particle"
          style={{ top: d.top, left: d.left, animationDelay: d.delay }}
        />
      ))}
    </div>
  )
}
