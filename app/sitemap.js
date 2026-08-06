import { SITE_URL } from '../lib/site'
import { getAllArticles } from '../lib/articles'
import { getAllWeeks } from '../lib/rankings'

export default function sitemap() {
  const lastMod = new Date()
  const staticRoutes = ['', '/rankings', '/offers', '/articles', '/about'].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: lastMod,
    changeFrequency:
      route === '' || route === '/rankings' || route === '/offers' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }))

  const articles = getAllArticles().map((a) => ({
    url: `${SITE_URL}/articles/${a.slug}`,
    lastModified: a.date ? new Date(a.date) : lastMod,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const weeks = getAllWeeks().map((w) => ({
    url: `${SITE_URL}/rankings?week=${w.week}&year=${w.year}`,
    lastModified: lastMod,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...articles, ...weeks]
}
