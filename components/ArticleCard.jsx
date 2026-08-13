import Link from 'next/link'

const GRADIENTS = {
  rankings: 'from-gavfather-gold/30 via-gavfather-slate to-gavfather-navy',
  busts: 'from-gavfather-fade/40 via-gavfather-slate to-gavfather-navy',
  sleepers: 'from-gavfather-smash/35 via-gavfather-slate to-gavfather-navy',
  research: 'from-blue-500/35 via-gavfather-slate to-gavfather-navy',
  coaching: 'from-amber-500/30 via-gavfather-slate to-gavfather-navy',
  draft: 'from-emerald-500/30 via-gavfather-slate to-gavfather-navy',
  'tight-ends': 'from-cyan-500/30 via-gavfather-slate to-gavfather-navy',
  injuries: 'from-gavfather-fade/40 via-gavfather-slate to-gavfather-navy',
  'running-backs': 'from-emerald-500/30 via-gavfather-slate to-gavfather-navy',
  'wide-receivers': 'from-gavfather-smash/35 via-gavfather-slate to-gavfather-navy',
  quarterbacks: 'from-purple-500/30 via-gavfather-slate to-gavfather-navy',
  about: 'from-gavfather-border via-gavfather-slate to-gavfather-navy',
  'deep dive': 'from-purple-500/30 via-gavfather-slate to-gavfather-navy',
  default: 'from-gavfather-border via-gavfather-slate to-gavfather-navy',
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ArticleCard({ article }) {
  const cat = String(article.category || 'default').toLowerCase()
  const gradient = GRADIENTS[cat] || GRADIENTS.default

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-gavfather-border bg-gavfather-slate transition duration-300 hover:-translate-y-1 hover:border-gavfather-gold/50 hover:shadow-gold-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gavfather-gold"
    >
      <div className={`h-28 bg-gradient-to-br ${gradient}`} />
      <div className="flex flex-1 flex-col p-5">
        {(article.theme || article.category) && (
          <span className="mb-2 inline-flex w-fit rounded border border-gavfather-gold/30 bg-gavfather-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gavfather-gold">
            {article.theme || article.category}
          </span>
        )}
        <h3 className="line-clamp-2 font-display text-xl font-semibold text-gavfather-text transition group-hover:text-gavfather-gold">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-gavfather-muted">
          {article.excerpt}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-gavfather-muted">
          <span>
            {formatDate(article.date)}
            {article.readTime ? ` · ${article.readTime}` : ''}
          </span>
        </div>
        <span className="mt-3 text-sm font-medium text-gavfather-gold transition group-hover:text-gavfather-gold-light">
          Read →
        </span>
      </div>
    </Link>
  )
}
