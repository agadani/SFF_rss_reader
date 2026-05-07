// RSS feeds to aggregate

const RSS_FEEDS = [
  { name: 'Uncanny Magazine',        url: 'https://www.uncannymagazine.com/feed/' },
  { name: 'Beneath Ceaseless Skies', url: 'https://www.beneath-ceaseless-skies.com/stories/feed/' },
  { name: 'Clarkesworld Magazine',   url: 'https://clarkesworldmagazine.com/feed/' },
  { name: 'Apex Magazine',           url: 'https://apex-magazine.com/feed' },
  { name: 'Strange Horizons',        url: 'https://strangehorizons.com/feed/' },
  { name: 'Lightspeed Magazine',     url: 'https://www.lightspeedmagazine.com/rss-2/' },
  { name: 'Escape Pod',              url: 'https://escapepod.org/feed/' },
  { name: 'PodCastle',               url: 'https://podcastle.org/feed/' },
];

// Fiction filters keyed by domain. Modes:
//   allowall  — feed is already fiction-only, include everything
//   allowlist — must match a fiction signal (category tag or URL pattern)
//   blocklist — include unless it matches a non-fiction signal

const FICTION_FILTERS = {
  'uncannymagazine.com': {
    mode: 'blocklist', // no category tags on articles, have to match titles
    nonficCategories: ['blog', 'news'],
    titleBlocklist: [
      'interview', 'podcast', 'editorial', 'the uncanny valley',
      'thank you', 'patreon', 'awards', 'eligible', 'finalist',
      'winner', 'congratulations', 'locus', 'recommended reading',
      'submission', 'table of contents', 'announcement', 'staff',
    ],
  },
  'beneath-ceaseless-skies.com': {
    mode: 'allowall', // /stories/feed/ is fiction-only, as of 5/2026
  },
  'clarkesworldmagazine.com': {
    mode: 'allowlist',
    ficCategories: ['fiction'],
    nonficCategories: ['non-fiction', 'cover art', 'podcasts'], // exclude audio dupes
  },
  'apex-magazine.com': {
    mode: 'allowlist',
    ficCategories: ['short fiction', 'novel excerpt', 'flash fiction'],
    ficUrlPatterns: ['/short-fiction/', '/novel-excerpt/'],
  },
  'strangehorizons.com': {
    mode: 'allowlist',
    ficCategories: ['fiction'],
    ficUrlPatterns: ['/fiction/'],
  },
  'lightspeedmagazine.com': {
    mode: 'allowlist',
    ficCategories: ['fiction'],
    ficUrlPatterns: ['/fiction/'],
  },
  'escapepod.org': {
    mode: 'blocklist',
    nonficCategories: ['announcements', 'site news'],
  },
  'podcastle.org': {
    mode: 'blocklist',
    nonficCategories: ['announcements', 'site news'],
  },
};

// Fallback title keywords for feeds not in FICTION_FILTERS
const SKIP_KEYWORDS = [
  'interview', 'podcast', 'episode', 'update', 'slush', 'news',
  'thank you', 'eligible', 'awards', 'locus', 'recommended reading',
  'announcement', 'congratulations', 'winner', 'finalist', 'blog',
  'submission', 'editorial', 'reflections', 'on books',
  'on the net', 'table of contents', 'from the editor',
];

// Reader mode: per-site CSS selectors for content extraction.
// Each magazine has a different HTML structure.  The Internet is terrible.

const SITE_SELECTORS = {
  'clarkesworldmagazine.com': {
    content: 'div.story-text',
    title: 'h1.story-title',
    author: 'span.authorname',
    strip: ['div.m-a-box', 'div.addtoany_share_save_container', 'h3.about', 'p.audio-text'],
  },
  'beneath-ceaseless-skies.com': {
    content: 'div.bcs-story-content',
    title: 'title', // page <title>, cleaned in post-processing
    author: 'div.post-author a',
    strip: [
      'div.zoom-header', 'div.author-copyright', 'div.story-comment-link',
      'div.share-links', 'div.author-bio', 'div.display-recs',
      'div.return-to-issue', 'nav#bcs-ebook-navbar',
    ],
  },
  'strangehorizons.com': {
    content: 'div.content.sizeable-content',
    title: 'div.title a',
    author: 'div.author a',
    strip: ['script', 'div.content-warning-container-ltr'],
  },
  'lightspeedmagazine.com': {
    content: 'div.entry-content',
    title: 'h1.posttitle',
    author: 'p.postmetadata a',
    authorPreStrip: true, // grab author before stripping p.postmetadata
    strip: ['ul.main_buttons', 'div.mp3-player', 'p.postmetadata', 'div.box_ad', 'div#first-banner'],
  },
  'uncannymagazine.com': {
    content: 'div.entry-content',
    title: 'h2.entry-title',
    author: 'h4.byline a',
    strip: ['div.sharedaddy', 'div.wpcnt'],
  },
  'escapepod.org': {
    content: 'div.entry_content',
    title: 'h2.post_title',
    author: 'div.entry_content h4',
    strip: [
      'div.postmeta', 'div.podcast_wrapper', 'div.powerpress_player',
      'p.powerpress_links', 'p.powerpress_subscribe_links',
      'div.reprint_text', 'div.alert-warning', 'div.show_notes', 'hr.full',
    ],
  },
  'podcastle.org': {
    content: 'div.entry_content',
    title: 'h2.post_title',
    author: 'div.entry_content h4',
    strip: [
      'div.show_notes', 'div.postmeta', 'div.podcast_wrapper', 'div.powerpress_player',
      'p.powerpress_links', 'p.powerpress_subscribe_links',
      'div.reprint_text', 'div.alert-warning', 'hr.full',
    ],
  },
  'apex-magazine.com': {
    content: 'div.article__content',
    title: 'h1.article__title',
    author: 'span.article__author',
    strip: [],
  },
};

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="12" fill="#0a0a0f"/><defs><linearGradient id="g" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#00f5ff"/><stop offset="100%" stop-color="#ff006e" stop-opacity="0"/></linearGradient></defs><circle cx="72" cy="28" r="14" fill="#00f5ff"/><circle cx="72" cy="28" r="20" fill="#00f5ff" opacity="0.15"/><path d="M64 36 L12 80" stroke="url(#g)" stroke-width="10" stroke-linecap="round"/></svg>`;
const FAVICON_LINK = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}">`;

const FALLBACK_SELECTORS = [
  { content: 'div.entry-content', title: 'h1.entry-title', author: 'span.author' },
  { content: 'div.post-content',  title: 'h1.post-title',  author: 'a[rel="author"]' },
  { content: 'article.post',      title: 'h1',             author: 'span.author' },
  { content: 'article',           title: 'h1',             author: 'a[rel="author"]' },
  { content: 'main',              title: 'h1',             author: 'span.author' },
];

const ALWAYS_STRIP = [
  'script', 'style', 'nav', 'aside', 'form', 'iframe',
  'div.share', 'div.social', 'div.related', 'div.comments', 'div.comment-respond',
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/favicon.ico') {
      return new Response(FAVICON_SVG, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
      });
    }
    if (url.pathname === '/reader') return handleReaderMode(url, env);
    return handleMainFeed(url, env);
  },
};

async function handleMainFeed(url, env) {
  try {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const selectedFeeds = url.searchParams.has('feeds')
      ? url.searchParams.getAll('feeds')
      : RSS_FEEDS.map((_, i) => i.toString());

    const allStories = await getAllStories(env, selectedFeeds);
    const perPage = 5;
    const start = (page - 1) * perPage;
    const stories = allStories.slice(start, start + perPage);
    const hasMore = start + perPage < allStories.length;

    return new Response(
      generateMainHTML(stories, page, hasMore ? page + 1 : null, hasMore, allStories.length, selectedFeeds),
      { headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=300' } },
    );
  } catch (error) {
    return new Response('Error loading stories: ' + error.message, {
      status: 500, headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function handleReaderMode(url) {
  const storyUrl = url.searchParams.get('url');
  if (!storyUrl) return Response.redirect(new URL('/', url.origin).toString(), 302);

  try {
    const response = await fetch(storyUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ReaderMode/1.0)' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const { title, author, content } = await extractContent(html, storyUrl);
    if (!content) return generateErrorHTML(storyUrl, 'Could not extract story content. Try reading on the original site.');

    return new Response(generateReaderHTML(title, author, content, storyUrl), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (error) {
    return generateErrorHTML(storyUrl, error.message);
  }
}

async function getAllStories(env, selectedFeeds) {
  if (!selectedFeeds?.length) selectedFeeds = RSS_FEEDS.map((_, i) => i.toString());

  const cacheKey = `stories_${selectedFeeds.sort().join('_')}`;
  if (env.STORY_CACHE) {
    const cached = await env.STORY_CACHE.get(cacheKey, 'json');
    if (cached) return cached;
  }

  const feeds = selectedFeeds.map(i => RSS_FEEDS[parseInt(i)]).filter(Boolean);
  const results = await Promise.allSettled(feeds.map(fetchFeedStories));
  const allStories = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  allStories.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const shuffled = shuffleArray(allStories.slice(0, 100));

  if (env.STORY_CACHE) {
    await env.STORY_CACHE.put(cacheKey, JSON.stringify(shuffled), { expirationTtl: 3600 });
  }
  return shuffled;
}

async function fetchFeedStories(feed) {
  try {
    const response = await fetch(feed.url);
    return parseRSSFeed(await response.text(), feed.name, feed.url);
  } catch (error) {
    console.error(`Error fetching ${feed.name}:`, error);
    return [];
  }
}

function parseRSSFeed(xml, sourceName, feedUrl) {
  const filterConfig = Object.entries(FICTION_FILTERS).find(([d]) => feedUrl.includes(d))?.[1];
  const stories = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title  = extractXML(item, 'title');
    const link   = (/<link>(.*?)<\/link>/.exec(item) || [])[1]?.trim() || '';
    const author = extractXML(item, 'dc:creator') || extractXML(item, 'author');
    const pubDate = (/<pubDate>(.*?)<\/pubDate>/.exec(item) || [])[1] || new Date().toISOString();

    let desc = extractXML(item, 'description', true);
    if (desc.length > 350) desc = desc.substring(0, 347) + '...';

    const categories = [];
    const catRe = /<category[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/gi;
    let cm;
    while ((cm = catRe.exec(item)) !== null) categories.push(decodeHTML(cm[1]).trim());

    if (title && link && isFiction(title, link, categories, filterConfig)) {
      stories.push({ title, link, author, description: decodeHTML(desc), pubDate, source: sourceName });
    }
  }
  return stories;
}

// Extract text from an XML tag, handling CDATA wrapping
function extractXML(item, tag, strip = false) {
  const m = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 'i').exec(item);
  if (!m) return '';
  const text = decodeHTML(m[1]);
  return strip ? stripHTML(text) : text;
}

function isFiction(title, link, categories, config) {
  if (!config) {
    return !SKIP_KEYWORDS.some(kw => title.toLowerCase().includes(kw));
  }
  if (config.mode === 'allowall') return true;

  const lc = categories.map(c => c.toLowerCase());
  const ll = link.toLowerCase();
  const has = (arr) => arr?.some(v => lc.includes(v.toLowerCase()));
  const urlHas = (arr) => arr?.some(v => ll.includes(v.toLowerCase()));

  if (config.mode === 'allowlist') {
    if (has(config.ficCategories)) return !has(config.nonficCategories);
    return !!urlHas(config.ficUrlPatterns);
  }

  // blocklist
  if (has(config.nonficCategories)) return false;
  if (urlHas(config.nonficUrlPatterns)) return false;
  if (config.titleBlocklist?.some(kw => title.toLowerCase().includes(kw))) return false;
  return true;
}

// Content extraction uses HTMLRewriter (CF's streaming HTML parser) instead of
// regex, since regex can't handle nested tags — [\s\S]*?</div> stops at the
// first closing </div>, not the matching one.

async function extractContent(html, storyUrl) {
  const siteConfig = Object.entries(SITE_SELECTORS).find(([d]) => storyUrl.includes(d))?.[1];
  const strategies = [...(siteConfig ? [siteConfig] : []), ...FALLBACK_SELECTORS];

  for (const strategy of strategies) {
    const result = await extractWithStrategy(html, strategy);
    if (stripHTML(result.content).length > 200) return result;
  }
  return strategies.length ? extractWithStrategy(html, strategies[0]) : { title: '', author: '', content: '' };
}

async function extractWithStrategy(html, strategy) {
  // Do everything in a single HTMLRewriter pass: strip junk, mark content
  // boundaries, and mark title/author boundaries. This avoids streaming the
  // full HTML multiple times, which can exceed CF's CPU time limit on deploy.
  const CS = '<!--CS-->', CE = '<!--CE-->';
  const TS = '<!--TS-->', TE = '<!--TE-->';
  const AS = '<!--AS-->', AE = '<!--AE-->';
  let contentMarked = false, titleMarked = false, authorMarked = false;

  let rewriter = new HTMLRewriter();

  // Strip unwanted elements
  for (const sel of [...ALWAYS_STRIP, ...(strategy.strip || [])]) {
    rewriter = rewriter.on(sel, { element(el) { el.remove(); } });
  }

  // Mark content container
  rewriter = rewriter.on(strategy.content, {
    element(el) {
      if (!contentMarked) { contentMarked = true; el.prepend(CS, { html: true }); el.append(CE, { html: true }); }
    },
  });

  // Mark title element
  if (strategy.title) {
    rewriter = rewriter.on(strategy.title, {
      element(el) {
        if (!titleMarked) { titleMarked = true; el.prepend(TS, { html: true }); el.append(TE, { html: true }); }
      },
    });
  }

  // Mark author element (skip if authorPreStrip — we'll grab it separately)
  if (strategy.author && !strategy.authorPreStrip) {
    rewriter = rewriter.on(strategy.author, {
      element(el) {
        if (!authorMarked) { authorMarked = true; el.prepend(AS, { html: true }); el.append(AE, { html: true }); }
      },
    });
  }

  const out = await rewriter.transform(new Response(html)).text();

  // Slice content, title, author from the marked-up output
  let content = sliceBetween(out, CS, CE);
  let title = cleanTitle(sliceBetween(out, TS, TE));
  let author = '';

  if (strategy.authorPreStrip && strategy.author) {
    // Lightspeed: author is inside an element we strip, so run one
    // small targeted pass on the original HTML just for the author
    author = await extractTextViaMarker(html, strategy.author);
  } else {
    author = stripHTML(sliceBetween(out, AS, AE)).replace(/^by\s+/i, '').trim();
  }

  // regex fallbacks if selectors didn't match
  if (!title) title = cleanTitle(regexFallback(out, [/<h1[^>]*>(.*?)<\/h1>/i, /<title>(.*?)<\/title>/i]));
  if (!author) author = regexFallback(out, [/<span[^>]*class="[^"]*author[^"]*"[^>]*>(.*?)<\/span>/i, /<a[^>]*rel="author"[^>]*>(.*?)<\/a>/i]).replace(/^by\s+/i, '').trim();

  return { title, author, content };
}

function sliceBetween(str, startMarker, endMarker) {
  const si = str.indexOf(startMarker), ei = str.indexOf(endMarker);
  if (si === -1 || ei === -1) return '';
  return str.slice(si + startMarker.length, ei);
}

function cleanTitle(t) {
  t = stripHTML(t);
  t = t.replace(/\s*[-–|]\s*.*(Magazine|Fiction|Story).*$/i, '');
  t = t.replace(/^.*?\|\s*/, '');
  t = t.replace(/\s+by\s+[\w\s.'-]+$/i, '');
  return t.trim();
}

function regexFallback(html, patterns) {
  for (const p of patterns) {
    const m = p.exec(html);
    if (m) { const t = stripHTML(m[1]).trim(); if (t) return t; }
  }
  return '';
}

// Inject marker comments around matched element's innerHTML, then slice
// between them. Handles arbitrary nesting correctly.

async function extractHTMLViaMarker(html, selector) {
  const S = '<!--CS-->', E = '<!--CE-->';
  let placed = false;
  const out = await new HTMLRewriter()
    .on(selector, {
      element(el) {
        if (!placed) { placed = true; el.prepend(S, { html: true }); el.append(E, { html: true }); }
      },
    })
    .transform(new Response(html)).text();
  const si = out.indexOf(S), ei = out.indexOf(E);
  return si !== -1 && ei !== -1 ? out.slice(si + S.length, ei) : '';
}

async function extractTextViaMarker(html, selector) {
  const inner = await extractHTMLViaMarker(html, selector);
  return inner ? stripHTML(inner) : '';
}

function shuffleArray(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stripHTML(text) {
  return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHTML(text) {
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#039;': "'", '&apos;': "'", '&#8217;': "'", '&#8216;': "'",
    '&#8220;': '\u201c', '&#8221;': '\u201d', '&#8230;': '\u2026', '&nbsp;': ' ',
    '&mdash;': '\u2014', '&ndash;': '\u2013',
  };
  return text.replace(/&[^;]+;/g, m => entities[m] || m);
}

function formatDate(dateStr) {
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return dateStr; }
}

function escapeHTML(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function generateMainHTML(stories, page, nextPage, hasMore, totalStories, selectedFeeds = []) {
  const storyCards = stories.map((s, i) => {
    const n = i + 1 + (page - 1) * 5;
    return `
    <article class="story-card" id="story-${n}">
      <div class="story-meta">
        ${s.author ? `<span class="meta-tag"><strong>//</strong> ${escapeHTML(s.author)}</span>` : ''}
        ${s.source ? `<span class="meta-tag"><strong>//</strong> ${escapeHTML(s.source)}</span>` : ''}
        ${s.pubDate ? `<span class="meta-tag"><strong>//</strong> ${formatDate(s.pubDate)}</span>` : ''}
      </div>
      <h2 class="story-title">
        <a href="${escapeHTML(s.link)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.title)}</a>
      </h2>
      ${s.description ? `<p class="story-description">${escapeHTML(s.description)}</p>` : ''}
      <div class="story-actions">
        <a href="/reader?url=${encodeURIComponent(s.link)}" class="reader-link">Reader Mode</a>
        <a href="${escapeHTML(s.link)}" class="read-link" target="_blank" rel="noopener noreferrer">Read Story</a>
      </div>
    </article>`;
  }).join('');

  const feedQS = selectedFeeds.length ? '&' + selectedFeeds.map(f => 'feeds=' + f).join('&') : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>READ MORE SFF</title>
  ${FAVICON_LINK}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  ${getSharedCSS()}
  ${getMainCSS()}
</head>
<body>
  <div class="container">
    <header>
      <h1 class="logo">SFF SHORT STORIES</h1>
      <p class="tagline">Read More</p>
      <div class="status-bar">
        <div class="status-item"><span class="status-dot"></span><span>SYSTEM_ONLINE</span></div>
        <div class="status-item"><span class="status-dot"></span><span>c[\u25CB\u252C\u25CF]\u05DB</span></div>
        <div class="status-item"><span class="status-dot"></span><span>${totalStories}_STORIES_LOADED</span></div>
      </div>
    </header>

    <main>
      ${stories.length > 0 ? storyCards : '<div class="empty-state"><h2>NO_STORIES_FOUND</h2><p>Unable to fetch stories. Try refreshing.</p></div>'}
      ${hasMore ? `
      <div class="page-marker">\u2014 PAGE ${page} \u2014</div>
      <div class="load-more">
        <a href="/?page=${nextPage}${feedQS}#story-${page * 5 + 1}" class="load-btn">Load More Stories</a>
      </div>` : `
      <div class="page-marker">\u2014 END OF FEED \u2014</div>`}
    </main>

    <footer>
      <p>ALL CONTENT \u00A9 ORIGINAL PUBLICATIONS & AUTHORS</p>
      <form method="GET" action="/" class="feed-filter">
        <div class="filter-header"><span>FILTER_SOURCES:</span></div>
        <div class="filter-checkboxes">
          ${RSS_FEEDS.map((feed, i) => `
            <label class="checkbox-label">
              <input type="checkbox" name="feeds" value="${i}" ${selectedFeeds.includes(i.toString()) ? 'checked' : ''}>
              <span>${feed.name.toUpperCase().replace(/ /g, '_')}</span>
            </label>`).join('')}
        </div>
        <button type="submit" class="filter-submit">UPDATE_FEED</button>
      </form>
      <div class="footer-links">
        ${RSS_FEEDS.map(f => {
          const domain = new URL(f.url).origin;
          return `<a href="${domain}" target="_blank">${f.name.toUpperCase().replace(/ /g, '_')}</a>`;
        }).join('\n        ')}
      </div>
    </footer>
  </div>
</body>
</html>`;
}

function generateReaderHTML(title, author, content, originalUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(title || 'Reader Mode')} // SFF</title>
  ${FAVICON_LINK}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  ${getSharedCSS()}
  ${getReaderCSS()}
</head>
<body>
  <header class="reader-header">
    <nav class="reader-nav">
      <a href="/" class="back-link">Back to Feed</a>
      <a href="${escapeHTML(originalUrl)}" class="original-link" target="_blank" rel="noopener noreferrer">View Original</a>
    </nav>
  </header>
  <div class="reader-container">
    <div class="story-header">
      ${title ? `<h1 class="story-title-reader">${escapeHTML(title)}</h1>` : ''}
      ${author ? `<p class="story-author-reader"><strong>//</strong> ${escapeHTML(author)}</p>` : ''}
    </div>
    <div class="story-content-reader">${content}</div>
  </div>
</body>
</html>`;
}

function generateErrorHTML(url, error) {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reader Error // SFF</title>
  ${FAVICON_LINK}
  ${getSharedCSS()}
  ${getReaderCSS()}
</head>
<body>
  <div style="text-align:center; padding:100px 20px; max-width:600px; margin:0 auto;">
    <div style="font-size:4rem; color:#ff006e; margin-bottom:24px;">\u26A0</div>
    <h1 style="font-family:'Space Mono',monospace; font-size:2rem; color:#ff006e; text-transform:uppercase; margin-bottom:16px;">READER MODE ERROR</h1>
    <p style="color:#808090; margin-bottom:32px;">Unable to load the story in reader mode.</p>
    <div style="background:#15151f; padding:20px; border-radius:4px; border:1px solid rgba(255,0,110,0.2); margin-bottom:32px; font-family:'Space Mono',monospace; font-size:0.85rem; color:#808090; word-break:break-word;">
      <strong>Error:</strong> ${escapeHTML(error)}
    </div>
    <div style="display:flex; gap:16px; justify-content:center; flex-wrap:wrap;">
      <a href="/" style="display:inline-flex; padding:12px 24px; background:#00f5ff; color:#0a0a0f; text-decoration:none; border-radius:2px; font-family:'Space Mono',monospace; font-size:0.8rem; text-transform:uppercase;">\u2190 Back to Feed</a>
      ${url ? `<a href="${escapeHTML(url)}" target="_blank" style="display:inline-flex; padding:12px 24px; color:#ff006e; border:1px solid #ff006e; text-decoration:none; border-radius:2px; font-family:'Space Mono',monospace; font-size:0.8rem; text-transform:uppercase;">View Original \u2197</a>` : ''}
    </div>
  </div>
</body>
</html>`, { status: 500, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

function getSharedCSS() {
  return `<style>
  :root {
    --pink: #ff006e;
    --blue: #00f5ff;
    --green: #00ff9f;
    --bg: #0a0a0f;
    --card: #15151f;
    --text: #e0e0e0;
    --dim: #808090;
    --border: rgba(0, 245, 255, 0.2);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); }
  html { scroll-behavior: smooth; }
</style>`;
}

function getMainCSS() {
  return `<style>
  body { line-height: 1.6; overflow-x: hidden; }
  body::before {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px);
    background-size: 50px 50px;
  }
  .container { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; padding: 0 20px; }

  /* Header */
  header { padding: 60px 0 40px; text-align: center; border-bottom: 1px solid var(--border); margin-bottom: 60px; }
  .logo {
    font-family: 'Space Mono', monospace; font-size: 2.5rem; font-weight: 700; letter-spacing: 0.1em;
    background: linear-gradient(135deg, var(--blue), var(--pink));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    text-transform: uppercase; margin-bottom: 12px;
  }
  .tagline { font-family: 'Space Mono', monospace; font-size: 0.85rem; color: var(--dim); letter-spacing: 0.15em; text-transform: uppercase; }
  .status-bar { display: flex; justify-content: center; gap: 20px; margin-top: 20px; font-family: 'Space Mono', monospace; font-size: 0.75rem; color: var(--green); }
  .status-item { display: flex; align-items: center; gap: 6px; }
  .status-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }

  /* Story cards */
  .story-card { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 40px; margin-bottom: 30px; transition: all 0.3s; }
  .story-card:hover { transform: translateY(-4px); border-color: var(--blue); }
  .story-meta { display: flex; gap: 16px; margin-bottom: 16px; font-family: 'Space Mono', monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; flex-wrap: wrap; }
  .meta-tag { color: var(--dim); }
  .meta-tag strong { color: var(--blue); margin-right: 4px; }
  .story-title { font-size: 1.8rem; font-weight: 600; line-height: 1.3; margin-bottom: 16px; letter-spacing: -0.02em; }
  .story-title a { color: var(--text); text-decoration: none; background-image: linear-gradient(var(--pink),var(--pink)); background-size: 0% 2px; background-repeat: no-repeat; background-position: left bottom; transition: background-size 0.3s; }
  .story-title a:hover { background-size: 100% 2px; }
  .story-description { font-size: 1rem; color: var(--dim); line-height: 1.7; margin-bottom: 24px; }
  .story-actions { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }

  /* Buttons */
  .read-link, .reader-link { display: inline-flex; align-items: center; gap: 8px; font-family: 'Space Mono', monospace; font-size: 0.8rem; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; padding: 10px 20px; border-radius: 2px; transition: all 0.3s; }
  .read-link { color: var(--blue); border: 1px solid var(--blue); }
  .read-link:hover { background: var(--blue); color: var(--bg); box-shadow: 0 0 20px rgba(0,245,255,0.5); }
  .read-link::after { content: '\u2192'; font-size: 1.2rem; }
  .reader-link { color: var(--green); border: 1px solid var(--green); }
  .reader-link:hover { background: var(--green); color: var(--bg); box-shadow: 0 0 20px rgba(0,255,159,0.5); }
  .reader-link::before { content: '\u25D0'; font-size: 1.2rem; }

  /* Pagination */
  .load-more { text-align: center; margin: 60px 0; }
  .load-btn { display: inline-flex; align-items: center; gap: 12px; font-family: 'Space Mono', monospace; font-size: 0.9rem; color: var(--pink); text-decoration: none; text-transform: uppercase; letter-spacing: 0.15em; padding: 16px 40px; border: 2px solid var(--pink); border-radius: 2px; transition: all 0.3s; }
  .load-btn:hover { background: var(--pink); color: var(--bg); box-shadow: 0 0 30px rgba(255,0,110,0.6); transform: translateY(-2px); }
  .load-btn::before { content: '\u2193'; font-size: 1.4rem; }
  .page-marker { text-align: center; padding: 40px 0; font-family: 'Space Mono', monospace; font-size: 0.75rem; color: var(--dim); text-transform: uppercase; letter-spacing: 0.2em; }

  /* Footer */
  footer { text-align: center; padding: 60px 20px 40px; color: var(--dim); font-size: 0.85rem; border-top: 1px solid var(--border); margin-top: 80px; }
  footer a { color: var(--blue); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.3s; }
  footer a:hover { border-bottom-color: var(--blue); }
  .feed-filter { margin: 30px 0; padding: 24px; background: var(--card); border-radius: 8px; border: 1px solid var(--border); }
  .filter-header { font-family: 'Space Mono', monospace; font-size: 0.9rem; color: var(--green); margin-bottom: 16px; letter-spacing: 0.1em; }
  .filter-checkboxes { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; margin: 0 auto; max-width: 400px; }
  .checkbox-label { display: flex; align-items: center; gap: 12px; cursor: pointer; font-family: 'Space Mono', monospace; font-size: 0.85rem; color: var(--text); transition: color 0.2s; }
  .checkbox-label:hover { color: var(--blue); }
  .checkbox-label input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; accent-color: var(--blue); }
  .filter-submit { margin-top: 16px; padding: 10px 24px; background: var(--blue); color: var(--bg); border: none; border-radius: 4px; font-family: 'Space Mono', monospace; font-size: 0.85rem; font-weight: bold; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
  .filter-submit:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,245,255,0.3); }
  .footer-links { display: flex; justify-content: center; gap: 24px; margin-top: 20px; flex-wrap: wrap; }

  @media (max-width: 768px) {
    .logo { font-size: 1.8rem; }
    .story-card { padding: 28px; }
    .story-title { font-size: 1.4rem; }
    .status-bar { flex-direction: column; gap: 8px; }
  }
</style>`;
}

function getReaderCSS() {
  return `<style>
  body { line-height: 1.8; }
  .reader-header { background: var(--card); border-bottom: 1px solid var(--border); padding: 20px; position: sticky; top: 0; z-index: 100; }
  .reader-nav { max-width: 800px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
  .back-link, .original-link { display: inline-flex; align-items: center; gap: 8px; font-family: 'Space Mono', monospace; font-size: 0.75rem; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; padding: 8px 16px; border-radius: 2px; transition: all 0.3s; }
  .back-link { color: var(--blue); border: 1px solid var(--blue); }
  .back-link:hover { background: var(--blue); color: var(--bg); }
  .back-link::before { content: '\u2190'; font-size: 1.2rem; }
  .original-link { color: var(--pink); border: 1px solid var(--pink); }
  .original-link:hover { background: var(--pink); color: var(--bg); }
  .original-link::after { content: '\u2197'; font-size: 1.2rem; }
  .reader-container { max-width: 800px; margin: 0 auto; padding: 60px 20px; }
  .story-header { margin-bottom: 48px; padding-bottom: 32px; border-bottom: 1px solid var(--border); }
  .story-title-reader { font-size: 2.5rem; font-weight: 600; line-height: 1.2; margin-bottom: 16px; color: var(--blue); }
  .story-author-reader { font-family: 'Space Mono', monospace; font-size: 0.9rem; color: var(--dim); text-transform: uppercase; }
  .story-content-reader { font-size: 1.15rem; line-height: 1.9; color: var(--text); }
  .story-content-reader p { margin-bottom: 1.5em; }
  .story-content-reader h1, .story-content-reader h2, .story-content-reader h3, .story-content-reader h4 { color: var(--blue); margin-top: 2em; margin-bottom: 1em; font-weight: 600; }
  .story-content-reader a { color: var(--blue); text-decoration: none; border-bottom: 1px solid var(--blue); }
  @media (max-width: 768px) {
    .story-title-reader { font-size: 1.8rem; }
    .reader-container { padding: 40px 20px; }
    .story-content-reader { font-size: 1.05rem; }
  }
</style>`;
}
