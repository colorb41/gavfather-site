'use client'

import { useMemo, useState } from 'react'
import ArticleCard from './ArticleCard'

const FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'sleepers', label: 'Sleepers' },
  { id: 'busts', label: 'Busts' },
  { id: 'rankings', label: 'Rankings' },
  { id: 'research', label: 'Research' },
  { id: 'deep dive', label: 'Deep Dive' },
]

export default function ArticlesIndex({ articles }) {
  const [filter, setFilter] = useState('all')

  const visible = useMemo(() => {
    if (filter === 'all') return articles
    return articles.filter((a) => a.category === filter)
  }, [articles, filter])

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-wide text-gavfather-gold md:text-5xl">
          FROM THE FAMILY
        </h1>
        <p className="mt-3 max-w-2xl text-gavfather-muted">
          Data-driven analysis. Every week, a new theme. Always an offer.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
              filter === f.id
                ? 'bg-gavfather-gold text-gavfather-navy'
                : 'border border-gavfather-border text-gavfather-muted hover:border-gavfather-gold/40 hover:text-gavfather-gold'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {!visible.length && (
        <p className="mt-12 text-center text-gavfather-muted">
          No articles in this category yet.
        </p>
      )}
    </div>
  )
}
