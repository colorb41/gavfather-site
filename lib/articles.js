import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import html from 'remark-html'
import { LAUNCH_YEAR } from './site'

const ARTICLES_DIR = path.join(process.cwd(), 'public', 'articles')

function ensureDir() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    fs.mkdirSync(ARTICLES_DIR, { recursive: true })
  }
}

function slugFromFilename(filename) {
  return filename.replace(/\.md$/i, '')
}

function articleYear(article) {
  if (!article?.date) return null
  const y = new Date(article.date).getFullYear()
  return Number.isFinite(y) ? y : null
}

/** True when the article belongs to a live published season. */
export function isLiveArticle(article) {
  const y = articleYear(article)
  return y != null && y >= LAUNCH_YEAR
}

/** Calendar YYYY-MM-DD in America/New_York (publish schedule is Eastern). */
function easternTodayIso() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/**
 * True when the article's publish date is today or earlier (Eastern calendar day).
 * Articles without a date are treated as published.
 */
export function isPublishedArticle(article) {
  if (!article?.date) return true
  const dateStr = String(article.date).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return true
  return dateStr <= easternTodayIso()
}

function readArticleFile(filename) {
  const fullPath = path.join(ARTICLES_DIR, filename)
  const raw = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(raw)
  const slug = slugFromFilename(filename)

  return {
    slug,
    title: data.title || slug,
    date: data.date || '',
    week: data.week ?? null,
    theme: data.theme || '',
    category: String(data.category || 'research').toLowerCase(),
    excerpt: data.excerpt || '',
    readTime: data.readTime || estimateReadTime(content),
    content,
  }
}

function estimateReadTime(content) {
  const words = String(content || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 220))
  return `${minutes} min read`
}

/** Legacy CI copies of the same Friday camp report (do not list as cards). */
function isDuplicateCampFilename(filename) {
  const name = String(filename || '').toLowerCase()
  return name === 'friday_latest.md' || /^friday_\d{4}-\d{2}-\d{2}\.md$/.test(name)
}

/** Collapse identical title+date so the homepage cannot show the same post 3x. */
function dedupeArticles(articles) {
  const seen = new Set()
  const out = []
  for (const article of articles) {
    const key = `${String(article.title || '').trim().toLowerCase()}|${String(article.date || '').slice(0, 10)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(article)
  }
  return out
}

/**
 * Published articles only (hides future-dated drafts), newest first.
 */
export function getAllArticles() {
  ensureDir()
  const files = fs
    .readdirSync(ARTICLES_DIR)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .filter((f) => !isDuplicateCampFilename(f))
    // Prefer camp-report-*.md when both a report and a leftover clone exist
    .sort((a, b) => {
      const ac = a.toLowerCase().startsWith('camp-report-') ? 0 : 1
      const bc = b.toLowerCase().startsWith('camp-report-') ? 0 : 1
      return ac - bc
    })

  const allArticles = files.map(readArticleFile)
  const publishedArticles = dedupeArticles(allArticles.filter(isPublishedArticle))

  return publishedArticles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

/**
 * Articles in live seasons only (hides pre-launch sample content).
 */
export function getLiveArticles() {
  return getAllArticles().filter(isLiveArticle)
}

/**
 * Single published article by slug.
 * Returns null for missing files or future-dated articles (404).
 */
export function getArticleBySlug(slug) {
  ensureDir()
  const filename = `${slug}.md`
  const fullPath = path.join(ARTICLES_DIR, filename)
  if (!fs.existsSync(fullPath)) return null

  const article = readArticleFile(filename)
  if (!isPublishedArticle(article)) return null
  return article
}

/**
 * Filter by category frontmatter.
 */
export function getArticlesByCategory(category) {
  const cat = String(category || '').toLowerCase()
  if (!cat || cat === 'all') return getAllArticles()
  return getAllArticles().filter((a) => a.category === cat)
}

/**
 * Render Markdown body to HTML.
 */
export async function renderMarkdown(content) {
  const result = await remark().use(remarkGfm).use(html, { sanitize: false }).process(content)
  return result.toString()
}

/**
 * Wrap known player names in rankings links inside rendered HTML.
 */
export function linkPlayerNames(html, players = []) {
  if (!html || !players.length) return html
  const names = [...new Set(players.map((p) => p.name).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  )
  let out = html
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(?<!["/_-])\\b(${escaped})\\b(?![^<]*>)`, 'g')
    out = out.replace(
      re,
      `<a href="/rankings?search=${encodeURIComponent(name)}" class="player-link">$1</a>`,
    )
  }
  return out
}

export function getAdjacentArticles(slug) {
  const all = getAllArticles()
  const idx = all.findIndex((a) => a.slug === slug)
  if (idx < 0) return { prev: null, next: null }
  return {
    prev: all[idx + 1] || null,
    next: all[idx - 1] || null,
  }
}

/**
 * Related articles by category, excluding current.
 */
export function getRelatedArticles(slug, limit = 3) {
  const current = getArticleBySlug(slug)
  if (!current) return []
  return getAllArticles()
    .filter((a) => a.slug !== slug && a.category === current.category)
    .slice(0, limit)
}
