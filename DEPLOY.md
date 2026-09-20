# Deploying The Gavfather

Static Next.js site. No database. Rankings and articles are files in `public/`.

## Local development

```bat
cd C:\gavfather-site
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build check:

```bat
npm run build
npm start
```

## Deploy to Vercel (free)

1. Create a GitHub repo and push this project:

```bat
cd C:\gavfather-site
git add .
git commit -m "Initial The Gavfather site"
git branch -M main
git remote add origin https://github.com/YOUR_USER/gavfather-site.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
3. Click **Add New Project** → import `gavfather-site`.
4. Leave framework preset as **Next.js**. Click **Deploy**.
5. Every push to `main` auto-deploys in about a minute.

## Custom domain (thegavfather.com)

1. In the Vercel project → **Settings** → **Domains**.
2. Add `thegavfather.com` and `www.thegavfather.com`.
3. At your DNS provider, point records to Vercel as shown in the dashboard (usually an `A` record and/or `CNAME`).
4. Wait for SSL to provision (often a few minutes).

## Weekly publishing workflow

1. From the engine repo, refresh in-season boards:

```bat
cd C:\fantasy-edge
python in_season_update.py --week N
```

Or generate weekly only:

```bat
python main.py --weekly --week N
```

2. Site sync copies:
- `live_rankings.csv` → **Rest of Season** board
- `weekly_rankings.csv` → **This Week** board

Filename on the site:

```
public/rankings/live_rankings.csv
public/rankings/weekly_rankings.csv
```

3. Write / copy the weekly article Markdown into:

```
C:\gavfather-site\public\articles\your-slug.md
```

4. Publish:

```bat
cd C:\gavfather-site
git add .
git commit -m "Week N rankings"
git push
```

5. Vercel deploys automatically (~60 seconds). The site is live.

The rankings page shows only **This Week** and **Rest of Season** (no preseason label).

## Optional: track record

Edit `public\data\track-record.json` anytime to update About-page accuracy stats. Commit and push.
