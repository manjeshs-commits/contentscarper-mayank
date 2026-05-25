async function runActor(actorId, input) {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}&timeout=60`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) throw new Error(`Apify error: ${res.status}`);
  return res.json();
}

function calcER(likes = 0, comments = 0, views = 1) {
  if (!views) return 0;
  return +((((likes + comments) / views) * 100).toFixed(2));
}

function daysSince(dateStr) {
  if (!dateStr) return 99;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
}

function normalizeIG(items = []) {
  return (items || []).filter(p => daysSince(p.timestamp) <= 30).map(p => ({
    platform: 'Instagram',
    hook: (p.caption || '').split('\n')[0].slice(0, 120),
    topic: (p.hashtags || []).slice(0, 2).join(', ') || 'General',
    views: p.videoViewCount || (p.likesCount * 8) || 0,
    likes: p.likesCount || 0,
    comments: p.commentsCount || 0,
    engagementRate: calcER(p.likesCount, p.commentsCount, p.videoViewCount),
    daysAgo: daysSince(p.timestamp),
    format: p.type === 'Video' ? 'Reel' : 'Post',
    url: p.url || '',
    viral: (p.videoViewCount || 0) > 100000,
  }));
}

function normalizeYT(items = []) {
  return (items || []).filter(v => daysSince(v.date) <= 30).map(v => ({
    platform: 'YouTube',
    hook: v.title || '',
    topic: v.channelName || 'General',
    views: v.viewCount || 0,
    likes: v.likes || 0,
    comments: v.commentsCount || 0,
    engagementRate: calcER(v.likes, v.commentsCount, v.viewCount),
    daysAgo: daysSince(v.date),
    format: 'Short',
    url: v.url || '',
    viral: (v.viewCount || 0) > 100000,
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { keywords, competitors } = req.body;
    const hashtags = keywords
      .split(',')
      .map(k => k.trim().replace(/\s+/g, '').toLowerCase())
      .filter(Boolean);

    let igPosts = [], ytPosts = [], competitorPosts = [];

    try {
      igPosts = normalizeIG(
        await runActor('apify~instagram-hashtag-scraper', { hashtags, resultsLimit: 20 })
      );
    } catch (e) { console.error('IG failed:', e.message); }

    try {
      if (competitors) {
        const handles = competitors.split(',').map(h => h.trim().replace('@', ''));
        competitorPosts = normalizeIG(
          await runActor('apify~instagram-scraper', { usernames: handles, resultsLimit: 10 })
        );
      }
    } catch (e) { console.error('Competitors failed:', e.message); }

    try {
      ytPosts = normalizeYT(
        await runActor('streamers~youtube-scraper', {
          searchKeywords: keywords,
          maxResultsShorts: 15,
          maxResults: 5,
        })
      );
    } catch (e) { console.error('YT failed:', e.message); }

    const posts = [...igPosts, ...competitorPosts, ...ytPosts]
      .sort((a, b) => b.views - a.views)
      .slice(0, 25);

    res.status(200).json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
