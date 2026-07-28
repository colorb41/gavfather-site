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

1. From the engine repo, export the week:

```bat
cd C:\fantasy-edge
python main.py --export --week N
```

2. Copy the CSV into the site:

```bat
copy C:\fantasy-edge\outputs\rankings_week_N_YEAR_ppr.csv C:\gavfather-site\public\rankings\
```

Filename format expected by the site:

```
rankings_week_{N}_{YEAR}.csv
rankings_week_{N}_{YEAR}_{format}.csv
```

Examples: `rankings_week_1_2026_ppr.csv`, `rankings_week_1_2026_half_ppr.csv`

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

## Optional: track record

Edit `public\data\track-record.json` anytime to update About-page accuracy stats. Commit and push.
