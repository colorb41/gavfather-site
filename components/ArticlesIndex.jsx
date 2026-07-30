'use client'

import { useMemo, useState } from 'react'
import ArticleCard from './ArticleCard'

function labelForCategory(id) {
  if (id === 'all') return 'ALL'
  return String(id)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export default function ArticlesIndex({ articles }) {
  const categories = useMemo(
    () => ['all', ...new Set(articles.map((a) => a.category).filter(Boolean))],
    [articles],
  )
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
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
              filter === id
                ? 'bg-gavfather-gold text-gavfather-navy'
                : 'border border-gavfather-border text-gavfather-muted hover:border-gavfather-gold/40 hover:text-gavfather-gold'
            }`}
          >
            {labelForCategory(id)}
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
