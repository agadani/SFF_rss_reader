# SFF Short Stories Feed

RSS aggregator for sci-fi/fantasy short fiction magazines, running on Cloudflare Workers. No client-side JS.

Pulls from Uncanny, Clarkesworld, Lightspeed, Strange Horizons, Beneath Ceaseless Skies, Apex, Escape Pod, and PodCastle. Filters out non-fiction using RSS category tags, then shuffles and paginates.  Currently deployed at [https://scifi-feed.readsff.workers.dev/](https://scifi-feed.readsff.workers.dev/).

Includes a reader mode that fetches story pages and extracts clean content using [HTMLRewriter](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/).

## Setup

```bash
npm install
npx wrangler login
npm run dev          # http://localhost:8787
npm run deploy       # deploys to workers.dev
```

## KV Caching (optional)

Caches aggregated stories for 1 hour so you're not hitting RSS feeds on every request.

```bash
npx wrangler kv:namespace create "STORY_CACHE"
```

Then uncomment and fill in the ID in `wrangler.toml`:

```toml
kv_namespaces = [
  { binding = "STORY_CACHE", id = "your-namespace-id" }
]
```

## Routes

- `/` — paginated story feed (`?page=2`, `?feeds=0&feeds=2` to filter sources)
- `/reader?url=...` — reader mode for a story URL

## Adding a feed

Add an entry to `RSS_FEEDS` in `worker.js`, then add a matching key in `FICTION_FILTERS` to control what gets included, and a key in `SITE_SELECTORS` if you want reader mode to work well on that site.

## License

MIT
