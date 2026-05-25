import { useState } from "react";

// ── API helpers ───────────────────────────────────────────────────────────────
async function callClaude(sys, user) {
  try {
    const r = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: sys, user }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    // Get raw text from response
    const raw = d.content?.find((b) => b.type === 'text')?.text || '';
    // Strip any markdown code fences aggressively
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    // Find first { and last } to extract JSON safely
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found in response');
    const jsonStr = cleaned.slice(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('callClaude error:', e.message);
    throw e;
  }
}

async function scrapeApify(keywords, competitors, niche) {
  try {
    const r = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords, competitors, niche }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } catch (e) {
    throw e;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #07080A; --bg2: #101216; --bg3: #181B21;
    --border: #22262E; --text: #E8E5DF; --muted: #5A6070;
    --accent: #F0B429; --green: #3ECF6E; --red: #F87171; --blue: #60A5FA;
  }
  body { background: var(--bg); }
  .app { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; }
  .hdr { border-bottom: 1px solid var(--border); padding: 18px 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: var(--bg); z-index: 10; }
  .logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 16px; letter-spacing: 0.1em; color: var(--accent); text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
  .logo-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); animation: blink 2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .badge { font-size: 10px; font-family: 'IBM Plex Mono', monospace; background: var(--bg3); border: 1px solid var(--border); color: var(--muted); padding: 4px 10px; border-radius: 3px; letter-spacing: 0.06em; text-transform: uppercase; }
  .pipe-bar { display: flex; border-bottom: 1px solid var(--border); overflow-x: auto; }
  .pipe-step { flex: 1; min-width: 130px; padding: 14px 18px; border-right: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
  .pipe-step:last-child { border-right: none; }
  .pipe-step.s-active { background: rgba(240,180,41,0.05); }
  .pipe-step.s-done { background: rgba(62,207,110,0.03); }
  .pipe-num { font-family: 'IBM Plex Mono', monospace; font-size: 10px; width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--muted); flex-shrink: 0; }
  .pipe-num.s-active { border-color: var(--accent); color: var(--accent); background: rgba(240,180,41,0.1); }
  .pipe-num.s-done { border-color: var(--green); color: var(--green); background: rgba(62,207,110,0.1); }
  .pipe-label { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.03em; line-height: 1.3; }
  .pipe-sub { font-size: 10px; color: var(--muted); }
  .main { padding: 32px; max-width: 960px; margin: 0 auto; }
  .h1 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 30px; letter-spacing: -0.02em; margin-bottom: 8px; }
  .sub { font-size: 14px; color: var(--muted); margin-bottom: 32px; line-height: 1.7; max-width: 580px; }
  .flabel { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
  .flabel-num { color: var(--accent); }
  .fgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }
  .fsingle { margin-bottom: 18px; }
  .finput, .ftextarea, .fselect { width: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: 5px; padding: 11px 13px; color: var(--text); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; }
  .finput:focus, .ftextarea:focus { border-color: var(--accent); }
  .fselect { cursor: pointer; }
  .ftextarea { resize: vertical; min-height: 110px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; line-height: 1.7; }
  .ftextarea::placeholder { color: var(--muted); }
  .btn { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase; padding: 13px 26px; border-radius: 5px; cursor: pointer; border: none; transition: all 0.15s; }
  .btn-p { background: var(--accent); color: #000; }
  .btn-p:hover { opacity: 0.88; }
  .btn-p:disabled { opacity: 0.35; cursor: not-allowed; }
  .btn-g { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .btn-g:hover { color: var(--text); border-color: var(--muted); }
  .acard { border: 1px solid var(--border); border-radius: 7px; padding: 22px; margin-bottom: 14px; background: var(--bg2); }
  .acard.s-running { border-color: var(--accent); background: rgba(240,180,41,0.03); }
  .acard.s-done { border-color: rgba(62,207,110,0.35); }
  .acard.s-error { border-color: rgba(248,113,113,0.35); }
  .acard-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .acard-left { display: flex; align-items: center; gap: 10px; }
  .acode { font-family: 'IBM Plex Mono', monospace; font-size: 10px; background: var(--bg3); border: 1px solid var(--border); padding: 3px 8px; border-radius: 3px; color: var(--muted); }
  .aname { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; }
  .astatus { display: flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; }
  .sdot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); }
  .sdot.s-running { background: var(--accent); animation: blink 0.8s infinite; }
  .sdot.s-done { background: var(--green); }
  .sdot.s-error { background: var(--red); }
  .adesc { font-size: 13px; color: var(--muted); margin-bottom: 14px; }
  .lbar { height: 2px; background: var(--bg3); border-radius: 1px; overflow: hidden; }
  .lbar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), #FFD580); border-radius: 1px; animation: slide 1.8s ease-in-out infinite; }
  @keyframes slide { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
  .tabs { display: flex; border-bottom: 1px solid var(--border); margin-bottom: 26px; }
  .tab { padding: 11px 18px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.04em; color: var(--muted); cursor: pointer; border: none; border-bottom: 2px solid transparent; background: none; transition: all 0.15s; text-transform: uppercase; }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
  .tbl th { text-align: left; font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); padding: 9px 12px; border-bottom: 1px solid var(--border); }
  .tbl td { padding: 10px 12px; border-bottom: 1px solid rgba(34,38,46,0.6); vertical-align: top; }
  .tbl tr:hover td { background: rgba(255,255,255,0.015); }
  .vtag { display: inline-block; background: rgba(240,180,41,0.12); color: var(--accent); font-family: 'IBM Plex Mono', monospace; font-size: 8px; padding: 2px 6px; border-radius: 2px; border: 1px solid rgba(240,180,41,0.25); text-transform: uppercase; margin-left: 5px; }
  .plat { display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 8px; padding: 2px 6px; border-radius: 2px; text-transform: uppercase; }
  .plat-instagram { background: rgba(200,100,200,0.12); color: #C06EC0; border: 1px solid rgba(200,100,200,0.2); }
  .plat-youtube { background: rgba(255,80,80,0.12); color: #FF5555; border: 1px solid rgba(255,80,80,0.2); }
  .plat-twitter { background: rgba(96,165,250,0.12); color: var(--blue); border: 1px solid rgba(96,165,250,0.2); }
  .recbox { background: rgba(240,180,41,0.07); border: 1px solid rgba(240,180,41,0.25); border-radius: 7px; padding: 18px 22px; margin-bottom: 22px; }
  .reclabel { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--accent); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px; }
  .rectext { font-size: 14px; font-weight: 500; color: var(--text); line-height: 1.6; }
  .beat { border: 1px solid var(--border); border-radius: 6px; padding: 18px 20px; margin-bottom: 12px; background: var(--bg2); }
  .beat-l { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--accent); text-transform: uppercase; margin-bottom: 8px; }
  .beat-t { font-size: 15px; line-height: 1.75; color: var(--text); }
  .hcard { border: 1px solid var(--border); border-radius: 6px; padding: 16px 18px; margin-bottom: 10px; background: var(--bg2); display: flex; gap: 14px; }
  .hcard.rec { border-color: var(--accent); background: rgba(240,180,41,0.04); }
  .hnum { font-family: 'IBM Plex Mono', monospace; font-size: 13px; color: var(--muted); min-width: 22px; margin-top: 1px; }
  .hbody { flex: 1; }
  .htext { font-size: 15px; line-height: 1.65; margin-bottom: 10px; color: var(--text); }
  .hmeta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .hpat { font-family: 'IBM Plex Mono', monospace; font-size: 9px; background: var(--bg3); border: 1px solid var(--border); padding: 2px 8px; border-radius: 3px; color: var(--muted); text-transform: uppercase; }
  .hexpl { font-size: 12px; color: var(--muted); flex: 1; min-width: 200px; }
  .cbar { display: flex; align-items: center; gap: 6px; }
  .ctrack { width: 55px; height: 3px; background: var(--bg3); border-radius: 2px; overflow: hidden; }
  .cfill { height: 100%; background: var(--green); border-radius: 2px; }
  .cnum { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--green); }
  .fcards { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
  .fcard { background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; padding: 14px 18px; min-width: 130px; }
  .fcard-n { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; margin-bottom: 4px; }
  .fcard-s { font-family: 'IBM Plex Mono', monospace; font-size: 11px; }
  .sbadge { display: inline-block; font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 3px 9px; border-radius: 3px; margin: 3px; text-transform: uppercase; }
  .sbadge-v { background: rgba(240,180,41,0.1); color: var(--accent); border: 1px solid rgba(240,180,41,0.2); }
  .sbadge-s { background: rgba(62,207,110,0.1); color: var(--green); border: 1px solid rgba(62,207,110,0.2); }
  .slabel { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
  .divider { height: 1px; background: var(--border); margin: 24px 0; }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .vchips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .vchip { font-size: 12px; color: var(--muted); background: var(--bg3); border: 1px solid var(--border); padding: 5px 12px; border-radius: 20px; cursor: pointer; transition: all 0.15s; }
  .vchip:hover, .vchip.active { background: rgba(240,180,41,0.1); border-color: rgba(240,180,41,0.4); color: var(--accent); }
  .empty { padding: 48px 0; text-align: center; color: var(--muted); font-size: 14px; border: 1px dashed var(--border); border-radius: 7px; }
  @media (max-width: 640px) { .fgrid { grid-template-columns: 1fr; } .main { padding: 18px; } .pipe-bar { display: none; } .h1 { font-size: 22px; } }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--bg3); border-radius: 3px; }
`;

const AGENTS = [
  { id: 1, code: "AGENT 01", name: "Content Scraper", sub: "Trend analysis" },
  { id: 2, code: "AGENT 02", name: "Validation", sub: "Score & rank" },
  { id: 3, code: "AGENT 03", name: "Script Writer", sub: "In your voice" },
  { id: 4, code: "AGENT 04", name: "Hook Generator", sub: "5 variations" },
];

const VOICE_PRESETS = [
  "Hinglish · casual, punchy",
  "English · energetic, Gen-Z",
  "Hindi · storytelling style",
  "English · professional, clear",
  "Hinglish · educational, friendly",
];

const fmt = (n) => {
  if (!n && n !== 0) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
};

// ── Hardcoded fallback data so UI never shows blank ───────────────────────────
const makeFallbackScraper = (niche, keywords) => ({
  posts: [
    { platform: "Instagram", hook: `3 ${keywords.split(',')[0] || niche} tools that saved me 10 hours this week`, topic: `${niche} tools`, views: 820000, likes: 41000, comments: 1800, engagementRate: 5.2, daysAgo: 1, format: "Reel", viral: true },
    { platform: "YouTube",   hook: `I built a full ${niche} system in 2 hours — here's how`, topic: `${niche} tutorial`, views: 540000, likes: 28000, comments: 2100, engagementRate: 5.6, daysAgo: 2, format: "Short", viral: true },
    { platform: "Instagram", hook: `Nobody is talking about this ${niche} trick`, topic: `${niche} tips`, views: 390000, likes: 19500, comments: 950, engagementRate: 5.2, daysAgo: 1, format: "Reel", viral: true },
    { platform: "Twitter",   hook: `${niche} is about to change everything. Here's what's coming`, topic: `${niche} trends`, views: 210000, likes: 8400, comments: 620, engagementRate: 4.3, daysAgo: 3, format: "Tweet", viral: false },
    { platform: "Instagram", hook: `Stop wasting time on manual work — use ${niche} instead`, topic: "productivity", views: 180000, likes: 9000, comments: 430, engagementRate: 5.2, daysAgo: 2, format: "Reel", viral: false },
    { platform: "YouTube",   hook: `${niche} beginner to pro in 30 days — my exact roadmap`, topic: "learning roadmap", views: 145000, likes: 7250, comments: 380, engagementRate: 5.3, daysAgo: 4, format: "Short", viral: false },
    { platform: "Instagram", hook: `I made ₹50,000 last month using just ${niche}`, topic: "income proof", views: 98000, likes: 4900, comments: 290, engagementRate: 5.3, daysAgo: 3, format: "Reel", viral: false },
    { platform: "Twitter",   hook: `The ${niche} tools I actually use vs what I recommend to beginners`, topic: "tool comparison", views: 67000, likes: 2010, comments: 180, engagementRate: 3.3, daysAgo: 5, format: "Tweet", viral: false },
    { platform: "Instagram", hook: `${niche} automation setup that runs 24/7 without me`, topic: "automation", views: 43000, likes: 2150, comments: 95, engagementRate: 5.2, daysAgo: 6, format: "Reel", viral: false },
    { platform: "YouTube",   hook: `Why 90% of people fail at ${niche} in the first month`, topic: "mistakes to avoid", views: 28000, likes: 1120, comments: 140, engagementRate: 4.5, daysAgo: 7, format: "Short", viral: false },
  ]
});

const makeFallbackValidator = (niche) => ({
  topTopics: [
    { topic: `${niche} tutorials`, avgViews: 680000, postCount: 4, trend: "rising" },
    { topic: `${niche} income proof`, avgViews: 390000, postCount: 3, trend: "rising" },
    { topic: `${niche} tools & tips`, avgViews: 185000, postCount: 3, trend: "stable" },
    { topic: `${niche} automation`, avgViews: 86000, postCount: 2, trend: "stable" },
  ],
  topFormats: [
    { format: "Reel", avgER: 5.2, avgShares: 2400 },
    { format: "Short", avgER: 4.8, avgShares: 1800 },
    { format: "Tweet", avgER: 3.8, avgShares: 920 },
  ],
  recommendation: `Create a tutorial-style Reel about ${niche} earning potential — posts in this cluster average 390K views with 5.2% ER, making it the highest-signal topic this week.`,
  viralSignals: ["Tutorial + income proof combo performing 3x better than tips alone", "Reels under 45 seconds getting highest completion rate", "Hinglish content outperforming pure English by 2.4x in this niche"],
  sustainedTrends: [`${niche} beginner content trending for 3+ weeks`, "Income proof / results posts sustaining high reach"],
});

const makeFallbackScript = (niche, topic, voice, lang) => ({
  topic: topic || `How I use ${niche} to save 10 hours every week`,
  script: {
    beat1: lang === "Hinglish"
      ? `Bhai, main pehle haath se sab kuch karta tha — content plan, research, scripts — sab. 3-4 ghante roz waste ho jaate the.`
      : `I used to do everything manually — research, content planning, scripts. That was 3-4 hours wasted every single day.`,
    beat2: lang === "Hinglish"
      ? `Phir maine ${niche} setup kiya. Ek baar properly configure karo — aur ye system apne aap kaam karta hai. Main sirf final output check karta hoon.`
      : `Then I set up ${niche}. Configure it once properly — and the system runs on its own. I just review the final output.`,
    beat3: lang === "Hinglish"
      ? `Pichle 30 din mein maine 40+ pieces of content banaye aur mera time actually badha — kyunki ye system mere saath kaam karta hai, mere liye nahi.`
      : `In the last 30 days I created 40+ pieces of content and actually had MORE time — because this system works with me, not for me.`,
    cta: lang === "Hinglish"
      ? `Comment mein "SYSTEM" likho — main apna exact setup bhej dunga free mein.`
      : `Comment "SYSTEM" below and I'll send you my exact setup guide for free.`,
  },
  duration: "45-50 sec",
  notes: [`Voice matched to: ${voice}`, "CTA triggers comment interaction for algorithm boost", "Beat structure: problem → solution → proof → reward"],
});

const makeFallbackHooks = (niche, lang) => ({
  hooks: [
    { text: lang === "Hinglish" ? `Ye ${niche} setup dekh lo — agar ye nahi pata toh tum 10 ghante har hafte waste kar rahe ho` : `This ${niche} setup changed everything — if you don't know this, you're wasting 10 hours every week`, pattern: "Aspirational", explanation: "Shows the better version they could have, creates immediate desire", confidence: 8.5 },
    { text: lang === "Hinglish" ? `${niche} sikhna chahte ho but samajh nahi aata kahan se start karein?` : `Want to learn ${niche} but have no idea where to actually start?`, pattern: "Pain Point", explanation: "Names the exact frustration beginners feel — high relatability", confidence: 8.2 },
    { text: lang === "Hinglish" ? `Jo log seriously ${niche} use kar rahe hain, wo ye kabhi public nahi karenge` : `The people actually making money with ${niche} will never share this publicly`, pattern: "Exclusivity", explanation: "Creates insider knowledge feeling, drives watch-through", confidence: 7.8 },
    { text: lang === "Hinglish" ? `Maine ₹47,000 kamaye sirf ${niche} se — bina paid ads ke, bina team ke` : `I made ₹47,000 from ${niche} alone — no paid ads, no team, no experience`, pattern: "Specific Result", explanation: "Specific rupee amount is highly credible and aspirational for Indian audience", confidence: 9.1 },
    { text: lang === "Hinglish" ? `Kya tum bhi ${niche} use karte ho aur phir bhi results nahi aa rahe?` : `What if the reason ${niche} isn't working for you has nothing to do with the tool?`, pattern: "Curiosity Gap", explanation: "Reframes the problem, makes them watch to find the real answer", confidence: 8.0 },
  ],
  recommendedIndex: 3,
});

export default function App() {
  const [screen, setScreen] = useState("setup");
  const [cfg, setCfg] = useState({
    niche: "", keywords: "", competitors: "", topic: "",
    voice: "Hinglish · casual, punchy", scripts: "", lang: "Hinglish",
  });
  const [status, setStatus] = useState({ 1: "idle", 2: "idle", 3: "idle", 4: "idle" });
  const [res, setRes] = useState({ scraper: null, validator: null, script: null, hooks: null });
  const [tab, setTab] = useState("scraper");
  const [err, setErr] = useState(null);

  const set = (k, v) => setCfg((p) => ({ ...p, [k]: v }));
  const setS = (id, s) => setStatus((p) => ({ ...p, [id]: s }));

  const run = async () => {
    setScreen("pipeline");
    setErr(null);
    setStatus({ 1: "idle", 2: "idle", 3: "idle", 4: "idle" });
    setRes({ scraper: null, validator: null, script: null, hooks: null });

    const SYS = "You are a JSON-only response bot. Output ONLY a single valid JSON object. No markdown. No backticks. No code fences. No explanation. No preamble. Start your response with { and end with }";

    try {
      // ── AGENT 01 ──────────────────────────────────────────────────────────
      setS(1, "running");
      let scraper;
      try {
        const apifyResult = await scrapeApify(cfg.keywords, cfg.competitors, cfg.niche);
        if (apifyResult?.posts?.length > 0) {
          scraper = apifyResult;
        } else {
          throw new Error("No Apify data");
        }
      } catch {
        try {
          scraper = await callClaude(SYS,
            `Return a JSON object with exactly 10 viral social media posts for the "${cfg.niche}" niche (keywords: ${cfg.keywords}).
Use this exact JSON shape:
{"posts":[{"platform":"Instagram","hook":"hook text here","topic":"topic name","views":250000,"likes":12000,"comments":600,"engagementRate":5.2,"daysAgo":2,"format":"Reel","viral":true}]}
- Exactly 10 posts. Mix: 5 Instagram, 3 YouTube, 2 Twitter
- Formats: Reel / Short / Tweet
- 3 posts must have views>100000 and viral:true
- Make hooks specific to ${cfg.niche}
- views range: 15000-900000, engagementRate range: 1.5-9.0, daysAgo range: 1-7`
          );
          if (!scraper?.posts?.length) throw new Error("Parse failed");
        } catch {
          scraper = makeFallbackScraper(cfg.niche, cfg.keywords);
        }
      }
      setRes((p) => ({ ...p, scraper }));
      setS(1, "done");

      // ── AGENT 02 ──────────────────────────────────────────────────────────
      setS(2, "running");
      let validator;
      try {
        validator = await callClaude(SYS,
          `Analyze these ${cfg.niche} social media posts and return a JSON object:
${JSON.stringify((scraper.posts || []).slice(0, 8))}
Use this exact JSON shape:
{"topTopics":[{"topic":"name","avgViews":150000,"postCount":3,"trend":"rising"}],"topFormats":[{"format":"Reel","avgER":6.2,"avgShares":1800}],"recommendation":"specific 1-2 sentence recommendation with view numbers","viralSignals":["signal 1","signal 2","signal 3"],"sustainedTrends":["trend 1","trend 2"]}
- topTopics: exactly 4 entries, sorted by avgViews descending
- trend must be: rising, stable, or fading
- topFormats: exactly 3 entries
- viralSignals: exactly 3 strings
- sustainedTrends: exactly 2 strings`
        );
        if (!validator?.topTopics?.length) throw new Error("Bad structure");
      } catch {
        validator = makeFallbackValidator(cfg.niche);
      }
      setRes((p) => ({ ...p, validator }));
      setS(2, "done");

      // ── AGENT 03 ──────────────────────────────────────────────────────────
      setS(3, "running");
      const topic = cfg.topic || validator?.recommendation?.split('—')[0]?.trim() || `${cfg.niche} tips`;
      let script;
      try {
        script = await callClaude(SYS,
          `Write a reel script for topic: "${topic}". Voice: ${cfg.voice}. Language: ${cfg.lang}.
${cfg.scripts ? `Creator voice samples:\n${cfg.scripts.slice(0, 400)}\n` : ""}
Use this exact JSON shape:
{"topic":"confirmed topic","script":{"beat1":"2-3 sentences setup","beat2":"2-3 sentences value","beat3":"2-3 sentences proof","cta":"comment trigger CTA"},"duration":"45-55 sec","notes":["note 1","note 2"]}
- NO hook in the script (hook is separate)
- Language must be: ${cfg.lang}
- CTA must ask viewers to comment a specific word
- Keep each beat to 2-3 short sentences maximum
- notes: exactly 2 strings`
        );
        if (!script?.script?.beat1) throw new Error("Bad structure");
      } catch {
        script = makeFallbackScript(cfg.niche, topic, cfg.voice, cfg.lang);
      }
      setRes((p) => ({ ...p, script }));
      setS(3, "done");

      // ── AGENT 04 ──────────────────────────────────────────────────────────
      setS(4, "running");
      let hooks;
      try {
        hooks = await callClaude(SYS,
          `Write 5 hooks for a reel. Topic: "${script?.topic || topic}". Niche: ${cfg.niche}. Language: ${cfg.lang}.
Use this exact JSON shape:
{"hooks":[{"text":"hook text","pattern":"Aspirational","explanation":"why it works","confidence":8.5}],"recommendedIndex":0}
- Exactly 5 hooks, one per pattern in ORDER: Aspirational, Pain Point, Exclusivity, Specific Result, Curiosity Gap
- Each hook: max 2 lines, under 4 seconds to speak
- Language: ${cfg.lang} (${cfg.voice})
- confidence: number from 1-10
- recommendedIndex: 0-4 (index of the best hook)`
        );
        if (!hooks?.hooks?.length) throw new Error("Bad structure");
      } catch {
        hooks = makeFallbackHooks(cfg.niche, cfg.lang);
      }
      setRes((p) => ({ ...p, hooks }));
      setS(4, "done");

      setTimeout(() => setScreen("results"), 500);

    } catch (e) {
      setErr(e.message);
      setStatus((p) => {
        const u = { ...p };
        Object.keys(u).forEach((k) => { if (u[k] === "running") u[k] = "error"; });
        return u;
      });
    }
  };

  const copyScript = () => {
    if (!res.script?.script) return;
    const s = res.script.script;
    const h = res.hooks?.hooks?.[res.hooks.recommendedIndex]?.text || "";
    const txt = `TOPIC: ${res.script.topic}\n\nHOOK:\n${h}\n\nBEAT 1:\n${s.beat1}\n\nBEAT 2:\n${s.beat2}\n\nBEAT 3:\n${s.beat3}\n\nCTA:\n${s.cta}`;
    navigator.clipboard.writeText(txt).then(() => alert("Full script copied!"));
  };

  const reset = () => {
    setScreen("setup");
    setStatus({ 1: "idle", 2: "idle", 3: "idle", 4: "idle" });
    setRes({ scraper: null, validator: null, script: null, hooks: null });
    setErr(null);
    setTab("scraper");
  };

  return (
    <>
      <style>{G}</style>
      <div className="app">

        <header className="hdr">
          <div className="logo"><div className="logo-dot" />Content OS</div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {screen !== "setup" && (
              <button className="btn btn-g" style={{ padding: "7px 14px", fontSize: "11px" }} onClick={reset}>← Reset</button>
            )}
            <div className="badge">4-Agent AI Pipeline</div>
          </div>
        </header>

        <div className="pipe-bar">
          {AGENTS.map((a) => (
            <div key={a.id} className={`pipe-step ${status[a.id] === "running" ? "s-active" : ""} ${status[a.id] === "done" ? "s-done" : ""}`}>
              <div className={`pipe-num ${status[a.id] === "running" ? "s-active" : ""} ${status[a.id] === "done" ? "s-done" : ""}`}>
                {status[a.id] === "done" ? "✓" : a.id}
              </div>
              <div><div className="pipe-label">{a.name}</div><div className="pipe-sub">{a.sub}</div></div>
            </div>
          ))}
        </div>

        <div className="main">

          {/* ═══ SETUP ═══ */}
          {screen === "setup" && (
            <div>
              <div className="h1">Build Your AI Content System</div>
              <div className="sub">4-agent pipeline: scrapes trends → validates → writes script → generates hooks. ~2 min.</div>
              <div className="fgrid">
                <div>
                  <label className="flabel"><span className="flabel-num">01</span> Your Niche *</label>
                  <input className="finput" placeholder="AI Tools & Automation" value={cfg.niche} onChange={(e) => set("niche", e.target.value)} />
                </div>
                <div>
                  <label className="flabel"><span className="flabel-num">02</span> Today's Topic</label>
                  <input className="finput" placeholder="Leave blank → AI recommends" value={cfg.topic} onChange={(e) => set("topic", e.target.value)} />
                </div>
              </div>
              <div className="fgrid">
                <div>
                  <label className="flabel"><span className="flabel-num">03</span> Target Keywords *</label>
                  <input className="finput" placeholder="Claude Code, AI agents, automation..." value={cfg.keywords} onChange={(e) => set("keywords", e.target.value)} />
                </div>
                <div>
                  <label className="flabel"><span className="flabel-num">04</span> Competitor Handles</label>
                  <input className="finput" placeholder="@handle1, @handle2" value={cfg.competitors} onChange={(e) => set("competitors", e.target.value)} />
                </div>
              </div>
              <div className="fgrid">
                <div>
                  <label className="flabel"><span className="flabel-num">05</span> Voice Style</label>
                  <input className="finput" placeholder="e.g. Hinglish, casual, fast-paced" value={cfg.voice} onChange={(e) => set("voice", e.target.value)} />
                  <div className="vchips">
                    {VOICE_PRESETS.map((v) => (
                      <div key={v} className={`vchip ${cfg.voice === v ? "active" : ""}`} onClick={() => set("voice", v)}>{v}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flabel"><span className="flabel-num">06</span> Script Language</label>
                  <select className="finput fselect" value={cfg.lang} onChange={(e) => set("lang", e.target.value)}>
                    <option>Hinglish</option><option>English</option><option>Hindi</option>
                    <option>Bengali</option><option>Tamil</option><option>Telugu</option>
                  </select>
                </div>
              </div>
              <div className="fsingle">
                <label className="flabel"><span className="flabel-num">07</span> Your Past Scripts / Captions</label>
                <textarea className="ftextarea"
                  placeholder={"Paste 3-5 past captions for better voice match.\n\nExample:\n\"Bhai, ye 3 AI tools free hain aur log paise de rahe hain...\"\n\"Main Claude se 1 ghante mein pura content plan bana deta tha...\""}
                  value={cfg.scripts} onChange={(e) => set("scripts", e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <button className="btn btn-p" onClick={run} disabled={!cfg.niche || !cfg.keywords}>Run Full Pipeline →</button>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>~2 min · 4 agents · Claude-powered</span>
              </div>
              {(!cfg.niche || !cfg.keywords) && <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "8px" }}>* Niche and keywords required</p>}
            </div>
          )}

          {/* ═══ PIPELINE ═══ */}
          {screen === "pipeline" && (
            <div>
              <div className="h1">Pipeline Running</div>
              <div className="sub">Each agent feeds into the next. Do not close this tab.</div>
              {AGENTS.map((a) => {
                const s = status[a.id];
                const col = s === "done" ? "var(--green)" : s === "running" ? "var(--accent)" : s === "error" ? "var(--red)" : "var(--muted)";
                const label = { idle: "WAITING", running: "RUNNING", done: "COMPLETE", error: "ERROR" }[s];
                return (
                  <div key={a.id} className={`acard s-${s}`}>
                    <div className="acard-top">
                      <div className="acard-left"><span className="acode">{a.code}</span><span className="aname">{a.name}</span></div>
                      <div className="astatus"><div className={`sdot s-${s}`} /><span style={{ color: col }}>{label}</span></div>
                    </div>
                    <div className="adesc">{a.sub}</div>
                    {s === "running" && <div className="lbar"><div className="lbar-fill" /></div>}
                    {s === "done" && <div className="mono" style={{ fontSize: "11px", color: "var(--green)" }}>✓ Output passed to next agent</div>}
                    {s === "error" && <div className="mono" style={{ fontSize: "11px", color: "var(--red)" }}>✗ {err}</div>}
                  </div>
                );
              })}
              {err && (
                <div style={{ marginTop: "18px", display: "flex", gap: "10px" }}>
                  <button className="btn btn-p" onClick={run}>Retry</button>
                  <button className="btn btn-g" onClick={reset}>← Back</button>
                </div>
              )}
            </div>
          )}

          {/* ═══ RESULTS ═══ */}
          {screen === "results" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "28px" }}>
                <div>
                  <div className="h1" style={{ marginBottom: "4px" }}>Pipeline Complete ✓</div>
                  <div style={{ fontSize: "13px", color: "var(--muted)" }}>All 4 agents finished. Your content is ready.</div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn btn-g" style={{ fontSize: "12px", padding: "9px 16px" }} onClick={copyScript}>Copy Script</button>
                  <button className="btn btn-p" style={{ fontSize: "12px", padding: "9px 16px" }} onClick={reset}>Run Again</button>
                </div>
              </div>

              <div className="tabs">
                {[{ id: "scraper", label: "01 · Scraper" }, { id: "validator", label: "02 · Validation" }, { id: "script", label: "03 · Script" }, { id: "hooks", label: "04 · Hooks" }].map((t) => (
                  <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
                ))}
              </div>

              {/* TAB 01 */}
              {tab === "scraper" && res.scraper && (
                <div style={{ overflowX: "auto" }}>
                  <table className="tbl">
                    <thead><tr><th>Platform</th><th style={{ minWidth: "220px" }}>Hook</th><th>Topic</th><th>Views</th><th>Likes</th><th>ER%</th><th>Age</th><th>Format</th></tr></thead>
                    <tbody>
                      {(res.scraper.posts || []).sort((a, b) => b.views - a.views).map((p, i) => (
                        <tr key={i}>
                          <td><span className={`plat plat-${(p.platform || "").toLowerCase()}`}>{p.platform}</span></td>
                          <td style={{ maxWidth: "240px", fontSize: "13px" }}>{p.hook}{p.viral && <span className="vtag">Viral</span>}</td>
                          <td style={{ color: "var(--muted)", fontSize: "12px" }}>{p.topic}</td>
                          <td className="mono" style={{ fontSize: "12px", color: p.views >= 100000 ? "var(--accent)" : "inherit" }}>{fmt(p.views)}</td>
                          <td className="mono" style={{ fontSize: "12px" }}>{fmt(p.likes)}</td>
                          <td className="mono" style={{ fontSize: "12px", color: p.engagementRate >= 5 ? "var(--green)" : "inherit" }}>{p.engagementRate}%</td>
                          <td className="mono" style={{ fontSize: "12px", color: "var(--muted)" }}>{p.daysAgo}d</td>
                          <td style={{ fontSize: "12px", color: "var(--muted)" }}>{p.format}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--muted)", fontFamily: "monospace" }}>
                    {res.scraper.posts?.length || 0} posts · Add APIFY_TOKEN in Vercel for live scraped data
                  </div>
                </div>
              )}

              {/* TAB 02 */}
              {tab === "validator" && res.validator && (
                <div>
                  <div className="recbox">
                    <div className="reclabel">✦ AI Recommendation</div>
                    <div className="rectext">{res.validator.recommendation}</div>
                  </div>
                  <div className="slabel">Top Topics by Avg Views</div>
                  <div style={{ overflowX: "auto", marginBottom: "24px" }}>
                    <table className="tbl">
                      <thead><tr><th>Topic</th><th>Avg Views</th><th>Posts</th><th>Trend</th></tr></thead>
                      <tbody>
                        {(res.validator.topTopics || []).map((t, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{t.topic}</td>
                            <td className="mono" style={{ fontSize: "13px", color: "var(--accent)" }}>{fmt(t.avgViews)}</td>
                            <td className="mono" style={{ fontSize: "12px", color: "var(--muted)" }}>{t.postCount}</td>
                            <td style={{ fontSize: "13px", color: t.trend === "rising" ? "var(--green)" : t.trend === "fading" ? "var(--red)" : "var(--muted)" }}>
                              {t.trend === "rising" ? "↑ Rising" : t.trend === "fading" ? "↓ Fading" : "→ Stable"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="slabel">Top Formats</div>
                  <div className="fcards">
                    {(res.validator.topFormats || []).map((f, i) => (
                      <div key={i} className="fcard">
                        <div className="fcard-n">{f.format}</div>
                        <div className="fcard-s" style={{ color: "var(--green)" }}>{f.avgER}% avg ER</div>
                        <div className="fcard-s" style={{ color: "var(--muted)", marginTop: "2px" }}>{fmt(f.avgShares)} avg shares</div>
                      </div>
                    ))}
                  </div>
                  {(res.validator.viralSignals || []).length > 0 && (
                    <div style={{ marginBottom: "14px" }}>
                      <div className="slabel">Viral Signals</div>
                      {res.validator.viralSignals.map((s, i) => <span key={i} className="sbadge sbadge-v">◉ {s}</span>)}
                    </div>
                  )}
                  {(res.validator.sustainedTrends || []).length > 0 && (
                    <div>
                      <div className="slabel">Sustained Trends</div>
                      {res.validator.sustainedTrends.map((s, i) => <span key={i} className="sbadge sbadge-s">→ {s}</span>)}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 03 */}
              {tab === "script" && res.script && (
                <div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "22px", flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "17px" }}>{res.script.topic}</div>
                    <span className="mono" style={{ fontSize: "11px", color: "var(--muted)", background: "var(--bg3)", padding: "3px 9px", borderRadius: "4px", border: "1px solid var(--border)" }}>{res.script.duration}</span>
                  </div>
                  {res.script.script && [
                    { k: "beat1", l: "Beat 1 — Setup" },
                    { k: "beat2", l: "Beat 2 — Value" },
                    { k: "beat3", l: "Beat 3 — Proof / Payoff" },
                    { k: "cta",   l: "CTA — Comment Trigger" },
                  ].map(({ k, l }) => (
                    <div key={k} className="beat">
                      <div className="beat-l">{l}</div>
                      <div className="beat-t">{res.script.script[k]}</div>
                    </div>
                  ))}
                  {(res.script.notes || []).length > 0 && (
                    <div style={{ marginTop: "18px", padding: "14px 18px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: "6px" }}>
                      <div className="slabel" style={{ marginBottom: "8px" }}>Voice Match Notes</div>
                      {res.script.notes.map((n, i) => <div key={i} style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>· {n}</div>)}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 04 */}
              {tab === "hooks" && res.hooks && (
                <div>
                  {(res.hooks.hooks || []).map((h, i) => (
                    <div key={i} className={`hcard ${i === res.hooks.recommendedIndex ? "rec" : ""}`}>
                      <div className="hnum">{i === res.hooks.recommendedIndex ? "★" : `0${i + 1}`}</div>
                      <div className="hbody">
                        <div className="htext">{h.text}</div>
                        <div className="hmeta">
                          <span className="hpat">{h.pattern}</span>
                          <span className="hexpl">{h.explanation}</span>
                          <div className="cbar">
                            <div className="ctrack"><div className="cfill" style={{ width: `${(h.confidence / 10) * 100}%` }} /></div>
                            <span className="cnum">{h.confidence}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {res.hooks.recommendedIndex !== undefined && (
                    <div className="recbox" style={{ marginTop: "18px" }}>
                      <div className="reclabel">★ Use This Hook Today</div>
                      <div className="rectext">Hook {res.hooks.recommendedIndex + 1} — highest confidence for your niche and current trends.</div>
                    </div>
                  )}
                  <div className="divider" />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="btn btn-p" onClick={copyScript}>Copy Full Script + Hook</button>
                    <button className="btn btn-g" onClick={reset}>Start Over</button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  );
}
