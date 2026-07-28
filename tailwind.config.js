/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        gavfather: {
          navy: '#0a0e1a',
          slate: '#141824',
          hover: '#1a2035',
          gold: '#d4af37',
          'gold-light': '#e8c84a',
          smash: '#10b981',
          play: '#f59e0b',
          fade: '#ef4444',
          neutral: '#6b7280',
          text: '#f8fafc',
          muted: '#aab4c8',
          border: '#1e2740',
          qb: '#7c3aed',
          rb: '#059669',
          wr: '#2563eb',
          te: '#d97706',
          'hard-fade': '#7f1d1d',
          'fade-badge': '#dc2626',
          'neutral-badge': '#374151',
        },
      },
      fontFamily: {
        display: ['var(--font-cinzel)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        gold: '0 0 28px rgba(212, 175, 55, 0.28)',
        'gold-sm': '0 0 14px rgba(212, 175, 55, 0.2)',
        lift: '0 12px 40px rgba(0, 0, 0, 0.45)',
      },
      backgroundImage: {
        'hero-glow':
          'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, transparent 45%, rgba(212,175,55,0.04) 100%)',
      },
      keyframes: {
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.55' },
          '50%': { transform: 'translateY(8px)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        floatParticle: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)', opacity: '0.15' },
          '50%': { transform: 'translateY(-18px) translateX(6px)', opacity: '0.45' },
        },
      },
      animation: {
        'bounce-slow': 'bounceSlow 2.4s ease-in-out infinite',
        shimmer: 'shimmer 8s ease-in-out infinite alternate',
        particle: 'floatParticle 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
