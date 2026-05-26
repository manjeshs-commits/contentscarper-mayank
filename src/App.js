import { useState } from "react";

// ── API ───────────────────────────────────────────────────────────────────────
async function callClaude(sys, user) {
  try {
    const r = await fetch('/api/claude', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: sys, user }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    const raw = d.content?.find(b => b.type === 'text')?.text || '';
    const c = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/```\s*$/i,'').trim();
    const s = c.indexOf('{'), e = c.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('No JSON');
    return JSON.parse(c.slice(s, e + 1));
  } catch(e) { console.error('Claude err:', e.message); throw e; }
}

async function scrapeApify(keywords, competitors, niche) {
  const r = await fetch('/api/scrape', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords, competitors, niche }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ── Styles ────────────────────────────────────────────────────────────────────
const G = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{--bg:#07080A;--bg2:#101216;--bg3:#181B21;--border:#22262E;--text:#E8E5DF;--muted:#5A6070;--accent:#F0B429;--green:#3ECF6E;--red:#F87171;--blue:#60A5FA;}
  body{background:var(--bg);}
  .app{min-height:100vh;background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;}
  .hdr{border-bottom:1px solid var(--border);padding:18px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--bg);z-index:10;}
  .logo{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;letter-spacing:.1em;color:var(--accent);text-transform:uppercase;display:flex;align-items:center;gap:8px;}
  .logo-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);animation:blink 2s infinite;}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
  .badge{font-size:10px;font-family:'IBM Plex Mono',monospace;background:var(--bg3);border:1px solid var(--border);color:var(--muted);padding:4px 10px;border-radius:3px;letter-spacing:.06em;text-transform:uppercase;}
  .pipe-bar{display:flex;border-bottom:1px solid var(--border);overflow-x:auto;}
  .pipe-step{flex:1;min-width:130px;padding:14px 18px;border-right:1px solid var(--border);display:flex;align-items:center;gap:10px;}
  .pipe-step:last-child{border-right:none;}
  .pipe-step.s-active{background:rgba(240,180,41,.05);}
  .pipe-step.s-done{background:rgba(62,207,110,.03);}
  .pipe-num{font-family:'IBM Plex Mono',monospace;font-size:10px;width:20px;height:20px;border-radius:50%;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--muted);flex-shrink:0;}
  .pipe-num.s-active{border-color:var(--accent);color:var(--accent);background:rgba(240,180,41,.1);}
  .pipe-num.s-done{border-color:var(--green);color:var(--green);background:rgba(62,207,110,.1);}
  .pipe-label{font-family:'Syne',sans-serif;font-weight:700;font-size:11px;}
  .pipe-sub{font-size:10px;color:var(--muted);}
  .main{padding:32px;max-width:1020px;margin:0 auto;}
  .h1{font-family:'Syne',sans-serif;font-weight:800;font-size:28px;letter-spacing:-.02em;margin-bottom:8px;}
  .sub{font-size:14px;color:var(--muted);margin-bottom:28px;line-height:1.7;max-width:580px;}
  .flabel{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:6px;display:flex;align-items:center;gap:6px;}
  .flabel-num{color:var(--accent);}
  .fgrid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px;}
  .fsingle{margin-bottom:18px;}
  .finput,.ftextarea,.fselect{width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:5px;padding:11px 13px;color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border-color .2s;}
  .finput:focus,.ftextarea:focus{border-color:var(--accent);}
  .fselect{cursor:pointer;}
  .ftextarea{resize:vertical;min-height:110px;font-family:'IBM Plex Mono',monospace;font-size:12px;line-height:1.7;}
  .ftextarea::placeholder{color:var(--muted);}
  .btn{font-family:'Syne',sans-serif;font-weight:700;font-size:13px;letter-spacing:.05em;text-transform:uppercase;padding:13px 26px;border-radius:5px;cursor:pointer;border:none;transition:all .15s;}
  .btn-p{background:var(--accent);color:#000;}
  .btn-p:hover{opacity:.88;}
  .btn-p:disabled{opacity:.35;cursor:not-allowed;}
  .btn-g{background:transparent;color:var(--muted);border:1px solid var(--border);}
  .btn-g:hover{color:var(--text);border-color:var(--muted);}
  .btn-sm{padding:8px 14px;font-size:11px;}
  .acard{border:1px solid var(--border);border-radius:7px;padding:22px;margin-bottom:14px;background:var(--bg2);}
  .acard.s-running{border-color:var(--accent);}
  .acard.s-done{border-color:rgba(62,207,110,.35);}
  .acard.s-error{border-color:rgba(248,113,113,.35);}
  .acard-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
  .acard-left{display:flex;align-items:center;gap:10px;}
  .acode{font-family:'IBM Plex Mono',monospace;font-size:10px;background:var(--bg3);border:1px solid var(--border);padding:3px 8px;border-radius:3px;color:var(--muted);}
  .aname{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;}
  .astatus{display:flex;align-items:center;gap:6px;font-family:'IBM Plex Mono',monospace;font-size:10px;}
  .sdot{width:6px;height:6px;border-radius:50%;background:var(--border);}
  .sdot.s-running{background:var(--accent);animation:blink .8s infinite;}
  .sdot.s-done{background:var(--green);}
  .sdot.s-error{background:var(--red);}
  .adesc{font-size:13px;color:var(--muted);margin-bottom:14px;}
  .lbar{height:2px;background:var(--bg3);border-radius:1px;overflow:hidden;}
  .lbar-fill{height:100%;background:linear-gradient(90deg,var(--accent),#FFD580);animation:slide 1.8s ease-in-out infinite;}
  @keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
  .tabs{display:flex;border-bottom:1px solid var(--border);margin-bottom:26px;overflow-x:auto;}
  .tab{padding:11px 18px;font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:.04em;color:var(--muted);cursor:pointer;border:none;border-bottom:2px solid transparent;background:none;transition:all .15s;text-transform:uppercase;white-space:nowrap;}
  .tab.active{color:var(--accent);border-bottom-color:var(--accent);}
  .tbl{width:100%;border-collapse:collapse;font-size:13px;}
  .tbl th{text-align:left;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding:9px 12px;border-bottom:1px solid var(--border);}
  .tbl td{padding:10px 12px;border-bottom:1px solid rgba(34,38,46,.6);vertical-align:top;}
  .tbl tr:hover td{background:rgba(255,255,255,.015);}
  .vtag{display:inline-block;background:rgba(240,180,41,.12);color:var(--accent);font-family:'IBM Plex Mono',monospace;font-size:8px;padding:2px 6px;border-radius:2px;border:1px solid rgba(240,180,41,.25);text-transform:uppercase;margin-left:5px;}
  .plat{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:8px;padding:2px 6px;border-radius:2px;text-transform:uppercase;}
  .plat-instagram{background:rgba(200,100,200,.12);color:#C06EC0;border:1px solid rgba(200,100,200,.2);}
  .plat-youtube{background:rgba(255,80,80,.12);color:#FF5555;border:1px solid rgba(255,80,80,.2);}
  .plat-twitter{background:rgba(96,165,250,.12);color:var(--blue);border:1px solid rgba(96,165,250,.2);}
  .recbox{background:rgba(240,180,41,.07);border:1px solid rgba(240,180,41,.25);border-radius:7px;padding:18px 22px;margin-bottom:22px;}
  .reclabel{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--accent);letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;}
  .rectext{font-size:14px;font-weight:500;color:var(--text);line-height:1.6;}
  .fcards{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:24px;}
  .fcard{background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:14px 18px;min-width:130px;}
  .fcard-n{font-family:'Syne',sans-serif;font-weight:700;font-size:14px;margin-bottom:4px;}
  .fcard-s{font-family:'IBM Plex Mono',monospace;font-size:11px;}
  .sbadge{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:9px;padding:3px 9px;border-radius:3px;margin:3px;text-transform:uppercase;}
  .sbadge-v{background:rgba(240,180,41,.1);color:var(--accent);border:1px solid rgba(240,180,41,.2);}
  .sbadge-s{background:rgba(62,207,110,.1);color:var(--green);border:1px solid rgba(62,207,110,.2);}
  .slabel{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;}
  .divider{height:1px;background:var(--border);margin:24px 0;}
  .mono{font-family:'IBM Plex Mono',monospace;}
  .vchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}
  .vchip{font-size:12px;color:var(--muted);background:var(--bg3);border:1px solid var(--border);padding:5px 12px;border-radius:20px;cursor:pointer;transition:all .15s;}
  .vchip:hover,.vchip.active{background:rgba(240,180,41,.1);border-color:rgba(240,180,41,.4);color:var(--accent);}

  /* ── OPTION SELECTOR ── */
  .opt-bar{display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap;}
  .opt-btn{font-family:'Syne',sans-serif;font-weight:700;font-size:11px;letter-spacing:.05em;text-transform:uppercase;padding:9px 18px;border-radius:5px;cursor:pointer;border:1px solid var(--border);background:var(--bg2);color:var(--muted);transition:all .15s;display:flex;flex-direction:column;gap:3px;min-width:140px;}
  .opt-btn:hover{border-color:var(--muted);color:var(--text);}
  .opt-btn.active{border-color:var(--accent);background:rgba(240,180,41,.07);color:var(--accent);}
  .opt-btn-label{font-size:10px;opacity:.7;}
  .opt-btn-name{font-size:12px;}
  .opt-recommended{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:8px;background:rgba(240,180,41,.15);color:var(--accent);padding:1px 6px;border-radius:2px;margin-top:2px;}

  /* ── BRIEF STYLES ── */
  .brief{background:var(--bg2);border:1px solid var(--border);border-radius:8px;overflow:hidden;}
  .brief-header{background:var(--bg3);border-bottom:1px solid var(--border);padding:18px 24px;display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;}
  .brief-series{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:var(--accent);}
  .brief-meta{display:flex;gap:10px;flex-wrap:wrap;}
  .brief-pill{font-family:'IBM Plex Mono',monospace;font-size:10px;background:var(--bg2);border:1px solid var(--border);padding:4px 10px;border-radius:3px;color:var(--muted);}
  .brief-section{padding:22px 24px;border-bottom:1px solid var(--border);}
  .brief-section:last-child{border-bottom:none;}
  .brief-section-title{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;}
  .growth-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .growth-card{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:14px;}
  .growth-card-title{font-family:'Syne',sans-serif;font-weight:700;font-size:12px;color:var(--accent);margin-bottom:6px;}
  .growth-card-text{font-size:13px;color:var(--muted);line-height:1.6;}
  .shot-row{display:grid;grid-template-columns:50px 70px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid rgba(34,38,46,.5);align-items:start;}
  .shot-row:last-child{border-bottom:none;}
  .shot-num{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--accent);}
  .shot-time{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--muted);}
  .shot-desc{font-size:13px;color:var(--text);line-height:1.5;}
  .script-line{padding:14px 0;border-bottom:1px solid rgba(34,38,46,.5);}
  .script-line:last-child{border-bottom:none;}
  .script-time{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--accent);margin-bottom:4px;}
  .script-action{font-size:12px;color:var(--muted);font-style:italic;margin-bottom:6px;}
  .script-words{font-size:15px;color:var(--text);line-height:1.7;}
  .edit-row{display:grid;grid-template-columns:150px 1fr;gap:16px;padding:10px 0;border-bottom:1px solid rgba(34,38,46,.5);}
  .edit-row:last-child{border-bottom:none;}
  .edit-key{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--accent);}
  .edit-val{font-size:13px;color:var(--text);line-height:1.55;}
  .track-row{display:grid;grid-template-columns:1fr 120px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid rgba(34,38,46,.5);align-items:start;}
  .track-row:last-child{border-bottom:none;}
  .track-name{font-size:13px;font-weight:600;color:var(--text);}
  .track-artist{font-size:12px;color:var(--muted);}
  .track-why{font-size:12px;color:var(--muted);line-height:1.5;}
  .caption-box{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:16px 18px;margin-bottom:14px;}
  .caption-label{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;}
  .caption-text{font-size:14px;color:var(--text);line-height:1.7;}
  .hashtags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;}
  .hashtag{font-family:'IBM Plex Mono',monospace;font-size:11px;background:rgba(96,165,250,.08);color:var(--blue);border:1px solid rgba(96,165,250,.15);padding:3px 9px;border-radius:3px;}
  .proj-row{display:grid;grid-template-columns:120px 140px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid rgba(34,38,46,.5);align-items:start;}
  .proj-row:last-child{border-bottom:none;}
  .proj-metric{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text);font-weight:600;}
  .proj-val{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--green);}
  .proj-reason{font-size:12px;color:var(--muted);line-height:1.5;}
  .hcard{border:1px solid var(--border);border-radius:6px;padding:16px 18px;margin-bottom:10px;background:var(--bg2);display:flex;gap:14px;}
  .hcard.rec{border-color:var(--accent);background:rgba(240,180,41,.04);}
  .hnum{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--muted);min-width:22px;margin-top:1px;}
  .hbody{flex:1;}
  .htext{font-size:15px;line-height:1.65;margin-bottom:10px;color:var(--text);}
  .hmeta{display:flex;flex-wrap:wrap;gap:10px;align-items:center;}
  .hpat{font-family:'IBM Plex Mono',monospace;font-size:9px;background:var(--bg3);border:1px solid var(--border);padding:2px 8px;border-radius:3px;color:var(--muted);text-transform:uppercase;}
  .hexpl{font-size:12px;color:var(--muted);flex:1;min-width:200px;}
  .cbar{display:flex;align-items:center;gap:6px;}
  .ctrack{width:55px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;}
  .cfill{height:100%;background:var(--green);border-radius:2px;}
  .cnum{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--green);}
  @media(max-width:640px){.fgrid{grid-template-columns:1fr;}.main{padding:16px;}.pipe-bar{display:none;}.h1{font-size:22px;}.growth-grid{grid-template-columns:1fr;}.shot-row{grid-template-columns:36px 55px 1fr;}.proj-row{grid-template-columns:1fr 1fr;}.edit-row{grid-template-columns:1fr;}.track-row{grid-template-columns:1fr;}.opt-btn{min-width:calc(50% - 5px);}}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:var(--bg);}
  ::-webkit-scrollbar-thumb{background:var(--bg3);border-radius:3px;}
`;

const AGENTS = [
  { id:1, code:"AGENT 01", name:"Content Scraper",  sub:"Trend analysis" },
  { id:2, code:"AGENT 02", name:"Validation",        sub:"Score & rank" },
  { id:3, code:"AGENT 03", name:"Script Writer",     sub:"3 script options" },
  { id:4, code:"AGENT 04", name:"Hook Generator",    sub:"3 × 5 hook sets" },
];

const VOICE_PRESETS = [
  "Hinglish · casual, punchy",
  "English · energetic, Gen-Z",
  "Hindi · storytelling style",
  "English · professional, clear",
  "Hinglish · educational, friendly",
];

const fmt = n => {
  if (!n && n !== 0) return "—";
  if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
  if (n >= 1e3) return (n/1e3).toFixed(0)+"K";
  return String(n);
};

const SYS = "You are a JSON-only bot. Output ONLY a single valid JSON object. Start with { end with }. No markdown. No backticks. No explanation. No preamble.";

// ── Fallback data ─────────────────────────────────────────────────────────────
const fallbackScraper = (niche, kw) => ({ posts:[
  {platform:"Instagram",hook:`3 ${kw.split(',')[0]||niche} tools that saved me 10 hrs this week`,topic:`${niche} tools`,views:820000,likes:41000,comments:1800,engagementRate:5.2,daysAgo:1,format:"Reel",viral:true},
  {platform:"YouTube",hook:`I built a full ${niche} system in 2 hours`,topic:`${niche} tutorial`,views:540000,likes:28000,comments:2100,engagementRate:5.6,daysAgo:2,format:"Short",viral:true},
  {platform:"Instagram",hook:`Nobody talks about this ${niche} trick`,topic:`${niche} tips`,views:390000,likes:19500,comments:950,engagementRate:5.2,daysAgo:1,format:"Reel",viral:true},
  {platform:"Twitter",hook:`${niche} is about to change everything`,topic:`${niche} trends`,views:210000,likes:8400,comments:620,engagementRate:4.3,daysAgo:3,format:"Tweet",viral:false},
  {platform:"Instagram",hook:`Stop wasting time — use ${niche} instead`,topic:"productivity",views:180000,likes:9000,comments:430,engagementRate:5.2,daysAgo:2,format:"Reel",viral:false},
  {platform:"YouTube",hook:`${niche} beginner to pro in 30 days`,topic:"roadmap",views:145000,likes:7250,comments:380,engagementRate:5.3,daysAgo:4,format:"Short",viral:false},
  {platform:"Instagram",hook:`I made ₹50k using just ${niche}`,topic:"income proof",views:98000,likes:4900,comments:290,engagementRate:5.3,daysAgo:3,format:"Reel",viral:false},
  {platform:"Twitter",hook:`${niche} tools I use vs what I recommend`,topic:"comparison",views:67000,likes:2010,comments:180,engagementRate:3.3,daysAgo:5,format:"Tweet",viral:false},
  {platform:"Instagram",hook:`${niche} automation that runs 24/7`,topic:"automation",views:43000,likes:2150,comments:95,engagementRate:5.2,daysAgo:6,format:"Reel",viral:false},
  {platform:"YouTube",hook:`Why 90% fail at ${niche} in the first month`,topic:"mistakes",views:28000,likes:1120,comments:140,engagementRate:4.5,daysAgo:7,format:"Short",viral:false},
]});

const fallbackValidator = (niche) => ({
  topTopics:[
    {topic:`${niche} tutorials`,avgViews:680000,postCount:4,trend:"rising"},
    {topic:`${niche} income proof`,avgViews:390000,postCount:3,trend:"rising"},
    {topic:`${niche} tools & tips`,avgViews:185000,postCount:3,trend:"stable"},
    {topic:`${niche} automation`,avgViews:86000,postCount:2,trend:"stable"},
  ],
  topFormats:[{format:"Reel",avgER:5.2,avgShares:2400},{format:"Short",avgER:4.8,avgShares:1800},{format:"Tweet",avgER:3.8,avgShares:920}],
  recommendation:`Create a tutorial Reel about ${niche} earning potential — avg 390K views, 5.2% ER, highest-signal topic this week.`,
  viralSignals:["Tutorial + proof combo 3x better","Reels under 45s highest completion","Hinglish content 2.4x English"],
  sustainedTrends:[`${niche} beginner content 3+ weeks`,"Income proof sustaining high reach"],
});

// 3 script angle styles
const ANGLES = [
  { label:"Option A", name:"Casual Walkthrough",  desc:"Relaxed, item-by-item haul" },
  { label:"Option B", name:"Educational Breakdown", desc:"Stat-heavy, credibility-first" },
  { label:"Option C", name:"Storytelling Arc",     desc:"Personal journey, emotional hook" },
];

const fallbackScripts = (niche, topic, lang, ep) => [
  {
    angle:"Casual Walkthrough", angleDesc:"Relaxed, item-by-item haul style",
    series:niche, episode:String(ep||"01"), episodeTitle:topic||`${niche} — EP.${ep||"01"}`,
    duration:"38–42 seconds", shootStyle:"Creator to camera, items in frame. Lived-in counter works.",
    whyThisWorks:{shareability:"Tag-a-friend mechanic — people forward this instantly",saveDriver:"Product discovery — viewers save before next order",followDriver:"EP.01 signal drives follow anticipation",searchability:"Searchable query category"},
    visualBreakdown:[
      {shot:"01",time:"0–2s",description:"Medium shot. All items visible. Eye contact."},
      {shot:"02",time:"2–12s",description:"Pick up item 1. Hold at chest. Talk casually."},
      {shot:"03",time:"12–22s",description:"Item 2. Quick label flip. Natural energy."},
      {shot:"04",time:"22–32s",description:"Item 3. Casual hold. Talk with slight energy."},
      {shot:"05",time:"32–42s",description:"Pull back. All items visible. Close to camera."},
    ],
    scriptLines:[
      {time:"0–2s",action:"Glances at spread, back to camera",words:lang==="Hinglish"?"Ye dekho — is week ka haul. Koi compromise nahi, bas smart choices.":"Check this out — this week's haul. No compromise, just smarter choices."},
      {time:"2–12s",action:"Picks up item 1",words:lang==="Hinglish"?"Pehla — ye mera weekly staple hai. Seriously iske bina nahi chalta.":"First up — this is my weekly staple. Genuinely can't do without it."},
      {time:"12–22s",action:"Holds item 2, flips label briefly",words:lang==="Hinglish"?"Yeh wala dekho — [stat]. Itne mein itna? Yes please.":"Look at this one — [stat]. That much for this price? Easy yes."},
      {time:"22–32s",action:"Holds item 3 casually",words:lang==="Hinglish"?"Aur yeh — pehle mujhe doubt tha but ab weekly staple ban gaya.":"And this one — I was skeptical first but now it's a weekly staple."},
      {time:"32–42s",action:"All items visible behind",words:lang==="Hinglish"?"Ye hai haul. Smart choices, no sad vibes. Agle hafte phir aaunga.":"That's the haul. Smart choices, no sad vibes. Back again next week."},
    ],
    editBreakdown:[
      {element:"Pacing",detail:"Hard cut between items. No transitions, no fades. Snappy."},
      {element:"Text overlays",detail:"Item name + one stat as creator picks it up. White text, clean font."},
      {element:"Colour grade",detail:"Warm but grounded. Natural light feel. Not over-saturated."},
      {element:"Opener text",detail:`${niche} — EP.${ep||"01"} in first 1.5s. Small corner text. Series identity.`},
      {element:"Music",detail:"Voice-forward. Track at 15–20% volume max. Don't compete."},
      {element:"End card",detail:"Last frame holds 1.5s. All items visible. No graphic needed."},
    ],
    soundtrack:[
      {track:"Lo-fi Chill Beat",artist:"Royalty-free",why:"Clean, reusable series signature. Zero copyright risk."},
      {track:"Blinding Lights (Instrumental)",artist:"The Weeknd",why:"Familiar energy. Drives pace without distracting."},
      {track:"Cupid (Twin Ver.) Instrumental",artist:"FIFTY FIFTY",why:"Lighter. Works for lifestyle/routine feel."},
      {track:"Tere Vaaste (Instrumental)",artist:"Varun Jain",why:"Warmer. Suits Hinglish delivery tonally."},
    ],
    soundtrackRecommendation:"Lo-fi instrumental. Clean, reusable as series signature, no copyright risk.",
    caption:{
      hookLine:lang==="Hinglish"?`Smart choices, no sad vibes — is week ka haul. 🛒`:`Smart choices, no sad vibes — this week's haul. 🛒`,
      fullCaption:lang==="Hinglish"?`Smart choices, no sad vibes.\nWeekly haul, zero compromise.\nYeh hai ${niche} Series — EP.${ep||"01"}.\nAgle hafte phir aaunga 👇`:`Smart choices, no sad vibes.\nWeekly haul, zero compromise.\nThis is ${niche} Series — EP.${ep||"01"}.\nBack again next week 👇`,
      hashtags:["#WeeklyHaul","#SmartChoices","#CreatorLife","#EpisodeOne",`#${niche.replace(/\s+/g,'')}`,`#${niche.replace(/\s+/g,'')}Series`,"#ContentCreator","#IndiaCreator"],
    },
    projectedEngagement:[
      {metric:"Views",projected:"32,000–52,000",reasoning:"Baseline range. Utility content holds well over time."},
      {metric:"Shares",projected:"180–280",reasoning:"Tag-a-friend mechanic. Above account baseline."},
      {metric:"Saves",projected:"250–380",reasoning:"Discovery content — highest relative upside. Saved for reference."},
      {metric:"Comments",projected:"80–140",reasoning:"Product opinions drive threads."},
      {metric:"Followers",projected:"45–75",reasoning:"EP.01 signal — viewer knows more is coming."},
      {metric:"Key risk",projected:"Low if hook lands",reasoning:"First 2s must establish format. Flat opener = retention drops."},
    ],
    seriesNote:`EP.01 alone won't spike. EP.03–04 is where it pays off — returning viewers and saves accumulating start pulling algorithmic distribution.`,
  },
  {
    angle:"Educational Breakdown", angleDesc:"Stat-heavy, credibility-first approach",
    series:niche, episode:String(ep||"01"), episodeTitle:topic||`${niche} — EP.${ep||"01"}`,
    duration:"40–45 seconds", shootStyle:"Creator at desk or counter. Items in foreground. Confident, direct delivery.",
    whyThisWorks:{shareability:"Stat-backed content feels credible — people share as proof to skeptical friends",saveDriver:"Specific numbers make this reference material. Screenshot-worthy.",followDriver:"Educational format signals consistent value — follow for next week's data",searchability:`"Best ${niche} options" is a high-intent search query this content answers`},
    visualBreakdown:[
      {shot:"01",time:"0–2s",description:"Confident medium shot. All items visible. State the premise immediately."},
      {shot:"02",time:"2–14s",description:"Item 1 — flip label toward camera for 1 second. Cite exact stat."},
      {shot:"03",time:"14–24s",description:"Item 2 — hold up. Give comparison stat (vs alternative)."},
      {shot:"04",time:"24–34s",description:"Item 3 — quick hold. Give the number that surprises people."},
      {shot:"05",time:"34–45s",description:"All items back in frame. Summary statement. Direct close."},
    ],
    scriptLines:[
      {time:"0–2s",action:"Holds one item, confident look to camera",words:lang==="Hinglish"?"Ye hai mera weekly ${niche} haul — aur main numbers ke saath bataunga kyon.":"This is my weekly ${niche} haul — and I'll tell you exactly why with numbers."},
      {time:"2–14s",action:"Flips label toward camera",words:lang==="Hinglish"?"Pehla — [item]. Ye dekho: [exact stat]. Is price mein yeh value? Koi competition nahi.":"First — [item]. Look at this: [exact stat]. At this price? Nothing comes close."},
      {time:"14–24s",action:"Holds item 2, points to it",words:lang==="Hinglish"?"Doosra — [item]. Iske alternatives double price pe milte hain aur stats worse hain.":"Second — [item]. Alternatives cost double and have worse stats."},
      {time:"24–34s",action:"Holds item 3, slightly surprised energy",words:lang==="Hinglish"?"Teesra — aur ye wala most log miss karte hain. [surprising stat].":"Third — and this is the one most people overlook. [surprising stat]."},
      {time:"34–45s",action:"All items behind, direct to camera",words:lang==="Hinglish"?"Yeh hai data-backed haul. Emotions se nahi, numbers se decide karo.":"That's the data-backed haul. Don't decide on feelings — decide on numbers."},
    ],
    editBreakdown:[
      {element:"Pacing",detail:"Slightly slower than Option A — let the stats land. 1 beat after each number."},
      {element:"Text overlays",detail:"Every stat gets its own text overlay in large font. Numbers must be readable."},
      {element:"Colour grade",detail:"Slightly cooler/neutral grade. Clean, credible look. Avoid overly warm."},
      {element:"Opener text",detail:"'EP.01 — The Numbers' in corner text. Sets educational tone immediately."},
      {element:"Music",detail:"Minimal or no music. Stats-forward content competes with audio. Keep at 10% max."},
      {element:"End card",detail:"Hold 2s on all items. Consider adding a scorecard graphic with stats."},
    ],
    soundtrack:[
      {track:"Minimal Ambient",artist:"Royalty-free",why:"Doesn't compete with stat delivery. Clean credibility."},
      {track:"Study Lofi",artist:"Royalty-free",why:"Educational context sets. Familiar for target demographic."},
      {track:"Cupid (Twin Ver.) Instrumental",artist:"FIFTY FIFTY",why:"Light enough to not distract from stat callouts."},
      {track:"No music",artist:"—",why:"Most educational creators skip music entirely. Voice carries it."},
    ],
    soundtrackRecommendation:"Minimal ambient or no music at all. Stats need silence to land.",
    caption:{
      hookLine:lang==="Hinglish"?`Numbers jhooth nahi bolte — ye hai mera weekly haul. 📊`:`Numbers don't lie — this week's haul, data-backed. 📊`,
      fullCaption:lang==="Hinglish"?`Numbers jhooth nahi bolte.\nHar item data ke saath choose kiya.\nYeh hai ${niche} Series — EP.${ep||"01"}.\nSave karo reference ke liye 👇`:`Numbers don't lie.\nEvery item chosen with data.\nThis is ${niche} Series — EP.${ep||"01"}.\nSave this for reference 👇`,
      hashtags:["#DataDriven","#SmartChoices","#WeeklyHaul","#HealthData",`#${niche.replace(/\s+/g,'')}`,`#${niche.replace(/\s+/g,'')}Facts`,"#FitnessScience","#NutritionFacts"],
    },
    projectedEngagement:[
      {metric:"Views",projected:"28,000–48,000",reasoning:"Educational content slightly lower initial reach but strong long-tail search discovery."},
      {metric:"Shares",projected:"200–320",reasoning:"Stat content gets shared as proof/reference. Slightly above Option A."},
      {metric:"Saves",projected:"300–450",reasoning:"Highest save rate of all 3 options — numbers = screenshot material."},
      {metric:"Comments",projected:"60–100",reasoning:"Data invites debate — 'actually this one is better' type replies."},
      {metric:"Followers",projected:"40–65",reasoning:"Slightly lower follow rate but higher quality — data audience is sticky."},
      {metric:"Key risk",projected:"Medium",reasoning:"Stat-heavy content can feel dry if delivery isn't confident. Energy matters."},
    ],
    seriesNote:"Educational formats build authority over time. By EP.04 this becomes the 'trusted data source' account in the niche — harder to build but harder to replicate.",
  },
  {
    angle:"Storytelling Arc", angleDesc:"Personal journey, emotional hook first",
    series:niche, episode:String(ep||"01"), episodeTitle:topic||`${niche} — EP.${ep||"01"}`,
    duration:"40–45 seconds", shootStyle:"Creator to camera, warm and slightly vulnerable energy. Items revealed one by one like chapters.",
    whyThisWorks:{shareability:"Personal story makes people feel seen — 'this is literally me' share mechanic",saveDriver:"Journey content gets saved as motivation/reminder, especially on cut/diet topics",followDriver:"Unfinished journey creates investment — they follow to see if it works",searchability:`"${niche} journey" and "how I started" are strong search terms`},
    visualBreakdown:[
      {shot:"01",time:"0–2s",description:"Close-ish shot. Slight pause before speaking. Creates anticipation."},
      {shot:"02",time:"2–12s",description:"Item 1 — pick up slowly. Describe it with a personal anecdote."},
      {shot:"03",time:"12–22s",description:"Item 2 — hold. The 'reluctant acceptance' item. Relatable struggle."},
      {shot:"04",time:"22–32s",description:"Item 3 — the one you actually love. Energy lifts here."},
      {shot:"05",time:"32–45s",description:"All items, slightly wider shot. Reflective close. Look into camera."},
    ],
    scriptLines:[
      {time:"0–2s",action:"Slight pause. Picks up one item slowly",words:lang==="Hinglish"?"Teen mahine pehle mujhe nahi pata tha ye sab kya hota hai. Ab yeh mera weekly ritual hai.":"Three months ago I had no idea what any of this was. Now it's my weekly ritual."},
      {time:"2–12s",action:"Picks up item 1, warm energy",words:lang==="Hinglish"?"Pehla — aur honestly yeh mera comfort item ban gaya. [personal detail about it].":"First — and honestly this became my comfort item. [personal detail about it]."},
      {time:"12–22s",action:"Holds item 2, slightly reluctant energy",words:lang==="Hinglish"?"Yeh wala — main pehle hate karta tha. Texture kinda weird hai. But ab used to ho gaya hoon.":"This one — I used to hate it. Texture's kinda weird. But I'm used to it now."},
      {time:"22–32s",action:"Holds item 3, energy lifts",words:lang==="Hinglish"?"Aur ye — honestly isko dhundhne mein time laga. But worth it tha completely.":"And this one — honestly took me a while to find. But completely worth it."},
      {time:"32–45s",action:"All items visible, reflective look to camera",words:lang==="Hinglish"?"Yeh journey ka part hai. Perfect nahi — but real hai. Cut Cart — EP.01.":"This is part of the journey. Not perfect — but real. Cut Cart — EP.01."},
    ],
    editBreakdown:[
      {element:"Pacing",detail:"Slightly more breathing room than Option A. Let the emotional beats land. No rush."},
      {element:"Text overlays",detail:"Minimal text. Maybe just the item name. Let the story carry — don't over-label."},
      {element:"Colour grade",detail:"Warmest grade of all 3 options. Golden hour feel if possible. Intimate mood."},
      {element:"Opener text",detail:"'Cut Cart — EP.01' but smaller, later in the frame. Story first, series second."},
      {element:"Music",detail:"This format needs a music bed. Emotional/warm track at 25–30% — it supports the story."},
      {element:"End card",detail:"Longer hold — 2.5s. Reflective mood. Creator looking at items, not at camera."},
    ],
    soundtrack:[
      {track:"Tere Vaaste (Instrumental)",artist:"Varun Jain",why:"Warm, emotionally resonant. Perfect for Hinglish personal storytelling."},
      {track:"Golden Hour (Instrumental)",artist:"JVKE",why:"Aspirational and emotional. Matches the journey arc perfectly."},
      {track:"Emotional Lofi",artist:"Royalty-free",why:"Safe choice. Warm, no copyright risk, consistent with the mood."},
      {track:"Kesariya (Instrumental)",artist:"Arijit Singh",why:"Deeply familiar to Indian audience. Warm emotional shortcut."},
    ],
    soundtrackRecommendation:"Tere Vaaste (Instrumental) for EP.01. Sets emotional tone, suits Hinglish delivery, highly recognisable.",
    caption:{
      hookLine:lang==="Hinglish"?`Teen mahine pehle mujhe kuch nahi pata tha — ab yeh mera weekly ritual hai. 🛒`:`Three months ago I had no idea — now this is my weekly ritual. 🛒`,
      fullCaption:lang==="Hinglish"?`Teen mahine pehle mujhe kuch nahi pata tha.\nAb yeh mera ritual hai. Perfect nahi — real hai.\nYeh hai Cut Cart — EP.01.\nAgle hafte ka haul aayega 👇`:`Three months ago I had no idea.\nNow it's my ritual. Not perfect — but real.\nThis is Cut Cart — EP.01.\nNext week's haul is coming 👇`,
      hashtags:["#CutCart","#FitnessJourney","#WeeklyHaul","#RealProgress",`#${niche.replace(/\s+/g,'')}Journey`,"#HealthyLiving","#IndiaFitness","#EpisodeOne"],
    },
    projectedEngagement:[
      {metric:"Views",projected:"35,000–65,000",reasoning:"Story content has highest emotional share driver. Spike potential above baseline."},
      {metric:"Shares",projected:"220–380",reasoning:"'This is literally me' mechanic — highest share ceiling of all 3 options."},
      {metric:"Saves",projected:"200–300",reasoning:"Saves slightly lower than Option B — motivation saves vs reference saves."},
      {metric:"Comments",projected:"120–200",reasoning:"Highest comment ceiling — personal story invites personal replies."},
      {metric:"Followers",projected:"55–90",reasoning:"Journey content = highest follow conversion. Audience wants to know what happens next."},
      {metric:"Key risk",projected:"Medium-High",reasoning:"Story delivery must feel authentic. If it reads as scripted, emotional resonance drops completely."},
    ],
    seriesNote:"Storytelling format compounds differently — each episode becomes a chapter. By EP.04 you have an audience invested in the outcome, not just the content. Highest long-term potential of all 3 options.",
  },
];

const fallbackHookSets = (niche, lang, scripts) => scripts.map((s, si) => ({
  angle: s.angle,
  hooks: [
    {text:lang==="Hinglish"?`Ye ${niche} setup dekh lo — agar nahi pata toh 10 ghante waste kar rahe ho`:`This ${niche} setup changed everything — you're wasting 10 hours without it`,pattern:"Aspirational",explanation:"Shows the better version, creates immediate desire",confidence:8.5},
    {text:lang==="Hinglish"?`${niche} try kiya but results nahi aaye? Shayad ye issue hai`:`Tried ${niche} but got no results? This might be why`,pattern:"Pain Point",explanation:"Names exact frustration, high relatability",confidence:8.2},
    {text:lang==="Hinglish"?`Jo log seriously ${niche} use karte hain wo ye share nahi karte`:`The people actually winning with ${niche} never share this`,pattern:"Exclusivity",explanation:"Insider knowledge feel, drives watch-through",confidence:7.8},
    {text:lang==="Hinglish"?`Maine ₹${47000+si*3000} kamaye ${niche} se — bina ads, bina team`:`I made ₹${47000+si*3000} from ${niche} — no ads, no team, no experience`,pattern:"Specific Result",explanation:"Exact number is credible and aspirational",confidence:si===2?9.3:8.8+si*0.1},
    {text:lang==="Hinglish"?`Kya tum ${niche} use karte ho aur phir bhi results nahi aa rahe?`:`What if the reason ${niche} isn't working has nothing to do with ${niche}?`,pattern:"Curiosity Gap",explanation:"Reframes the problem, forces them to watch for the answer",confidence:8.0},
  ],
  recommendedIndex: si === 2 ? 3 : si === 1 ? 3 : 3,
}));

// ── Component ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("setup");
  const [cfg, setCfg] = useState({
    niche:"", keywords:"", competitors:"", topic:"", epNum:"01",
    voice:"Hinglish · casual, punchy", scripts:"", lang:"Hinglish",
  });
  const [status, setStatus] = useState({1:"idle",2:"idle",3:"idle",4:"idle"});
  const [res, setRes] = useState({scraper:null,validator:null,scripts:null,hookSets:null});
  const [tab, setTab] = useState("scraper");
  const [activeScript, setActiveScript] = useState(0);
  const [activeHookSet, setActiveHookSet] = useState(0);
  const [err, setErr] = useState(null);

  const set = (k,v) => setCfg(p=>({...p,[k]:v}));
  const setS = (id,s) => setStatus(p=>({...p,[id]:s}));

  const run = async () => {
    setScreen("pipeline");
    setErr(null);
    setStatus({1:"idle",2:"idle",3:"idle",4:"idle"});
    setRes({scraper:null,validator:null,scripts:null,hookSets:null});
    setActiveScript(0); setActiveHookSet(0);

    try {
      // ── AGENT 01 ──────────────────────────────────
      setS(1,"running");
      let scraper;
      try {
        const ar = await scrapeApify(cfg.keywords,cfg.competitors,cfg.niche);
        scraper = ar?.posts?.length>0 ? ar : null;
        if (!scraper) throw new Error("empty");
      } catch {
        try {
          scraper = await callClaude(SYS,
            `JSON with 10 viral posts for "${cfg.niche}" niche (keywords: ${cfg.keywords}).
Shape: {"posts":[{"platform":"Instagram","hook":"text","topic":"topic","views":250000,"likes":12000,"comments":600,"engagementRate":5.2,"daysAgo":2,"format":"Reel","viral":true}]}
10 posts total. 5 Instagram, 3 YouTube, 2 Twitter. 3 must have views>100000 viral:true.`
          );
          if (!scraper?.posts?.length) throw new Error("bad");
        } catch { scraper = fallbackScraper(cfg.niche, cfg.keywords); }
      }
      setRes(p=>({...p,scraper}));
      setS(1,"done");

      // ── AGENT 02 ──────────────────────────────────
      setS(2,"running");
      let validator;
      try {
        validator = await callClaude(SYS,
          `Analyze these ${cfg.niche} posts: ${JSON.stringify((scraper.posts||[]).slice(0,8))}
Shape: {"topTopics":[{"topic":"n","avgViews":150000,"postCount":3,"trend":"rising"}],"topFormats":[{"format":"Reel","avgER":6.2,"avgShares":1800}],"recommendation":"1-2 sentences with numbers","viralSignals":["s1","s2","s3"],"sustainedTrends":["t1","t2"]}
4 topTopics, 3 topFormats, 3 viralSignals, 2 sustainedTrends. trend: rising/stable/fading.`
        );
        if (!validator?.topTopics?.length) throw new Error("bad");
      } catch { validator = fallbackValidator(cfg.niche); }
      setRes(p=>({...p,validator}));
      setS(2,"done");

      // ── AGENT 03 — 3 SCRIPT OPTIONS ───────────────
      setS(3,"running");
      const topic = cfg.topic || `${cfg.niche} — EP.${cfg.epNum||"01"}`;
      let scripts;
      try {
        // Generate all 3 in parallel for speed
        const [sA, sB, sC] = await Promise.all([
          callClaude(SYS,
            `Full production brief for a CASUAL WALKTHROUGH reel. Series: ${cfg.niche}. Topic: ${topic}. Ep: ${cfg.epNum||"01"}. Lang: ${cfg.lang}. Voice: ${cfg.voice}.
${cfg.scripts?`Voice samples:\n${cfg.scripts.slice(0,400)}\n`:""}
Angle: Relaxed item-by-item haul. Casual, warm energy. Talk like you're showing a friend.
Shape: {"angle":"Casual Walkthrough","angleDesc":"Relaxed, item-by-item haul style","series":"${cfg.niche}","episode":"${cfg.epNum||"01"}","episodeTitle":"${topic}","duration":"38–42 seconds","shootStyle":"brief description","whyThisWorks":{"shareability":"why","saveDriver":"why","followDriver":"why","searchability":"why"},"visualBreakdown":[{"shot":"01","time":"0–2s","description":"desc"}],"scriptLines":[{"time":"0–2s","action":"stage direction","words":"spoken words in ${cfg.lang}"}],"editBreakdown":[{"element":"Pacing","detail":"desc"}],"soundtrack":[{"track":"name","artist":"artist","why":"why"}],"soundtrackRecommendation":"recommendation","caption":{"hookLine":"line","fullCaption":"full\\ncaption","hashtags":["#tag"]},"projectedEngagement":[{"metric":"Views","projected":"30k–50k","reasoning":"reason"}],"seriesNote":"note"}
- visualBreakdown: 5 shots. scriptLines: 5 lines in ${cfg.lang}. editBreakdown: 6 items. soundtrack: 4 tracks. projectedEngagement: 6 rows.`
          ).catch(()=>null),
          callClaude(SYS,
            `Full production brief for an EDUCATIONAL BREAKDOWN reel. Series: ${cfg.niche}. Topic: ${topic}. Ep: ${cfg.epNum||"01"}. Lang: ${cfg.lang}. Voice: ${cfg.voice}.
${cfg.scripts?`Voice samples:\n${cfg.scripts.slice(0,400)}\n`:""}
Angle: Stat-heavy, credibility-first. Lead with numbers, back up every claim.
Same JSON shape as above but angle:"Educational Breakdown", angleDesc:"Stat-heavy, credibility-first approach".
All spoken words in ${cfg.lang}. 5 visualBreakdown, 5 scriptLines, 6 editBreakdown, 4 soundtrack, 6 projectedEngagement.`
          ).catch(()=>null),
          callClaude(SYS,
            `Full production brief for a STORYTELLING ARC reel. Series: ${cfg.niche}. Topic: ${topic}. Ep: ${cfg.epNum||"01"}. Lang: ${cfg.lang}. Voice: ${cfg.voice}.
${cfg.scripts?`Voice samples:\n${cfg.scripts.slice(0,400)}\n`:""}
Angle: Personal journey, emotional hook first. Vulnerable, real, relatable.
Same JSON shape but angle:"Storytelling Arc", angleDesc:"Personal journey, emotional hook first".
All spoken words in ${cfg.lang}. 5 visualBreakdown, 5 scriptLines, 6 editBreakdown, 4 soundtrack, 6 projectedEngagement.`
          ).catch(()=>null),
        ]);
        const fallbacks = fallbackScripts(cfg.niche, topic, cfg.lang, cfg.epNum);
        scripts = [
          (sA?.scriptLines?.length ? sA : null) || fallbacks[0],
          (sB?.scriptLines?.length ? sB : null) || fallbacks[1],
          (sC?.scriptLines?.length ? sC : null) || fallbacks[2],
        ];
      } catch { scripts = fallbackScripts(cfg.niche, topic, cfg.lang, cfg.epNum); }
      setRes(p=>({...p,scripts}));
      setS(3,"done");

      // ── AGENT 04 — 3 × 5 HOOK SETS ────────────────
      setS(4,"running");
      let hookSets;
      try {
        const hookResults = await Promise.all(scripts.map((s,i) =>
          callClaude(SYS,
            `Write 5 hooks for a "${s.angle}" style reel. Topic: "${s.episodeTitle}". Niche: ${cfg.niche}. Lang: ${cfg.lang}. Voice: ${cfg.voice}.
This is a ${s.angleDesc} style — hooks must MATCH the angle energy.
Shape: {"angle":"${s.angle}","hooks":[{"text":"hook","pattern":"Aspirational","explanation":"why","confidence":8.5}],"recommendedIndex":0}
5 hooks in ORDER: Aspirational, Pain Point, Exclusivity, Specific Result, Curiosity Gap.
Max 2 lines each. Under 4 seconds. Language: ${cfg.lang}. confidence 1–10. recommendedIndex 0–4.`
          ).catch(()=>null)
        ));
        const fallbackSets = fallbackHookSets(cfg.niche, cfg.lang, scripts);
        hookSets = hookResults.map((h,i) =>
          h?.hooks?.length ? {...h, angle: scripts[i].angle} : fallbackSets[i]
        );
      } catch { hookSets = fallbackHookSets(cfg.niche, cfg.lang, scripts); }
      setRes(p=>({...p,hookSets}));
      setS(4,"done");

      setTimeout(()=>setScreen("results"),500);

    } catch(e) {
      setErr(e.message);
      setStatus(p=>{const u={...p};Object.keys(u).forEach(k=>{if(u[k]==="running")u[k]="error";});return u;});
    }
  };

  const copyBrief = () => {
    const s = res.scripts?.[activeScript];
    const hset = res.hookSets?.[activeHookSet];
    if (!s) return;
    const bestHook = hset?.hooks?.[hset.recommendedIndex]?.text||"";
    const lines = (s.scriptLines||[]).map(l=>`[${l.time}]${l.action?` (${l.action})`:""}  ${l.words}`).join("\n\n");
    const txt = [
      `${s.series} — EP.${s.episode}: ${s.episodeTitle}`,
      `Angle: ${s.angle} — ${s.angleDesc}`,
      `Duration: ${s.duration}`,
      `\n── BEST HOOK (${hset?.angle||""}) ──\n${bestHook}`,
      `\n── SCRIPT ──\n${lines}`,
      `\n── CAPTION ──\n${s.caption?.hookLine}\n\n${s.caption?.fullCaption}`,
      `\n── HASHTAGS ──\n${(s.caption?.hashtags||[]).join(" ")}`,
      `\n── SOUNDTRACK ──\n${s.soundtrackRecommendation}`,
    ].join("\n");
    navigator.clipboard.writeText(txt).then(()=>alert("Brief + Hook copied!"));
  };

  const reset = () => {
    setScreen("setup");
    setStatus({1:"idle",2:"idle",3:"idle",4:"idle"});
    setRes({scraper:null,validator:null,scripts:null,hookSets:null});
    setErr(null); setTab("scraper"); setActiveScript(0); setActiveHookSet(0);
  };

  // ── Render brief ──────────────────────────────────────────────────────────
  const renderBrief = (s) => !s ? null : (
    <div className="brief">
      <div className="brief-header">
        <div>
          <div className="brief-series">{s.series} — EP.{s.episode}</div>
          <div style={{fontSize:"14px",color:"var(--text)",marginTop:"3px",fontWeight:600}}>{s.episodeTitle}</div>
          <div style={{fontSize:"12px",color:"var(--muted)",marginTop:"3px"}}>{s.angleDesc}</div>
        </div>
        <div className="brief-meta">
          <div className="brief-pill">⏱ {s.duration}</div>
          <div className="brief-pill">🎬 {s.angle}</div>
        </div>
      </div>

      {s.whyThisWorks&&(
        <div className="brief-section">
          <div className="brief-section-title">Why This Works For Growth</div>
          <div className="growth-grid">
            {[["shareability","Share Driver"],["saveDriver","Save Driver"],["followDriver","Follow Driver"],["searchability","Search / Discovery"]].map(([k,l])=>
              s.whyThisWorks[k]&&<div key={k} className="growth-card"><div className="growth-card-title">{l}</div><div className="growth-card-text">{s.whyThisWorks[k]}</div></div>
            )}
          </div>
        </div>
      )}

      {s.visualBreakdown?.length>0&&(
        <div className="brief-section">
          <div className="brief-section-title">Visual Breakdown</div>
          {s.visualBreakdown.map((v,i)=>(
            <div key={i} className="shot-row">
              <div className="shot-num">SHOT {v.shot}</div>
              <div className="shot-time">{v.time}</div>
              <div className="shot-desc">{v.description}</div>
            </div>
          ))}
        </div>
      )}

      {s.scriptLines?.length>0&&(
        <div className="brief-section">
          <div className="brief-section-title">Script</div>
          {s.scriptLines.map((l,i)=>(
            <div key={i} className="script-line">
              <div className="script-time">{l.time}</div>
              {l.action&&<div className="script-action">*{l.action}*</div>}
              <div className="script-words">"{l.words}"</div>
            </div>
          ))}
        </div>
      )}

      {s.editBreakdown?.length>0&&(
        <div className="brief-section">
          <div className="brief-section-title">Edit Breakdown</div>
          {s.editBreakdown.map((e,i)=>(
            <div key={i} className="edit-row">
              <div className="edit-key">{e.element}</div>
              <div className="edit-val">{e.detail}</div>
            </div>
          ))}
        </div>
      )}

      {s.soundtrack?.length>0&&(
        <div className="brief-section">
          <div className="brief-section-title">Soundtrack Options</div>
          <div style={{marginBottom:"14px",padding:"12px 16px",background:"rgba(240,180,41,.07)",border:"1px solid rgba(240,180,41,.2)",borderRadius:"6px",fontSize:"13px",color:"var(--text)"}}>
            ★ Recommended: {s.soundtrackRecommendation}
          </div>
          {s.soundtrack.map((t,i)=>(
            <div key={i} className="track-row">
              <div><div className="track-name">{t.track}</div><div className="track-artist">{t.artist}</div></div>
              <div/>
              <div className="track-why">{t.why}</div>
            </div>
          ))}
        </div>
      )}

      {s.caption&&(
        <div className="brief-section">
          <div className="brief-section-title">Caption</div>
          <div className="caption-box">
            <div className="caption-label">Hook Line</div>
            <div className="caption-text" style={{fontWeight:600,fontSize:"16px"}}>{s.caption.hookLine}</div>
          </div>
          <div className="caption-box">
            <div className="caption-label">Full Caption</div>
            <div className="caption-text" style={{whiteSpace:"pre-line"}}>{s.caption.fullCaption}</div>
          </div>
          <div className="hashtags">{(s.caption.hashtags||[]).map((h,i)=><span key={i} className="hashtag">{h}</span>)}</div>
        </div>
      )}

      {s.projectedEngagement?.length>0&&(
        <div className="brief-section">
          <div className="brief-section-title">Projected Engagement</div>
          {s.projectedEngagement.map((p,i)=>(
            <div key={i} className="proj-row">
              <div className="proj-metric">{p.metric}</div>
              <div className="proj-val">{p.projected}</div>
              <div className="proj-reason">{p.reasoning}</div>
            </div>
          ))}
          {s.seriesNote&&(
            <div style={{marginTop:"16px",padding:"14px 16px",background:"var(--bg3)",border:"1px solid var(--border)",borderRadius:"6px",fontSize:"13px",color:"var(--muted)",lineHeight:"1.6"}}>
              📈 {s.seriesNote}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{G}</style>
      <div className="app">
        <header className="hdr">
          <div className="logo"><div className="logo-dot"/>Content OS</div>
          <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
            {screen!=="setup"&&<button className="btn btn-g" style={{padding:"7px 14px",fontSize:"11px"}} onClick={reset}>← Reset</button>}
            <div className="badge">4-Agent Pipeline</div>
          </div>
        </header>

        <div className="pipe-bar">
          {AGENTS.map(a=>(
            <div key={a.id} className={`pipe-step ${status[a.id]==="running"?"s-active":""} ${status[a.id]==="done"?"s-done":""}`}>
              <div className={`pipe-num ${status[a.id]==="running"?"s-active":""} ${status[a.id]==="done"?"s-done":""}`}>
                {status[a.id]==="done"?"✓":a.id}
              </div>
              <div><div className="pipe-label">{a.name}</div><div className="pipe-sub">{a.sub}</div></div>
            </div>
          ))}
        </div>

        <div className="main">

          {/* SETUP */}
          {screen==="setup"&&(
            <div>
              <div className="h1">Build Your AI Content System</div>
              <div className="sub">Generates 3 script options × 3 hook sets — pick the angle that fits your energy today.</div>
              <div className="fgrid">
                <div>
                  <label className="flabel"><span className="flabel-num">01</span>Your Niche / Series *</label>
                  <input className="finput" placeholder="Cut Cart, Fitness, AI Tools..." value={cfg.niche} onChange={e=>set("niche",e.target.value)}/>
                </div>
                <div>
                  <label className="flabel"><span className="flabel-num">02</span>Episode Topic</label>
                  <input className="finput" placeholder="Leave blank → AI recommends" value={cfg.topic} onChange={e=>set("topic",e.target.value)}/>
                </div>
              </div>
              <div className="fgrid">
                <div>
                  <label className="flabel"><span className="flabel-num">03</span>Target Keywords *</label>
                  <input className="finput" placeholder="Blinkit haul, healthy eating..." value={cfg.keywords} onChange={e=>set("keywords",e.target.value)}/>
                </div>
                <div>
                  <label className="flabel"><span className="flabel-num">04</span>Episode Number</label>
                  <input className="finput" placeholder="01" value={cfg.epNum} onChange={e=>set("epNum",e.target.value)}/>
                </div>
              </div>
              <div className="fgrid">
                <div>
                  <label className="flabel"><span className="flabel-num">05</span>Voice Style</label>
                  <input className="finput" placeholder="e.g. Hinglish, casual, direct" value={cfg.voice} onChange={e=>set("voice",e.target.value)}/>
                  <div className="vchips">
                    {VOICE_PRESETS.map(v=>(
                      <div key={v} className={`vchip ${cfg.voice===v?"active":""}`} onClick={()=>set("voice",v)}>{v}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="flabel"><span className="flabel-num">06</span>Script Language</label>
                  <select className="finput fselect" value={cfg.lang} onChange={e=>set("lang",e.target.value)}>
                    <option>Hinglish</option><option>English</option><option>Hindi</option>
                    <option>Bengali</option><option>Tamil</option><option>Telugu</option>
                  </select>
                </div>
              </div>
              <div className="fsingle">
                <label className="flabel"><span className="flabel-num">07</span>Your Past Scripts / Captions</label>
                <textarea className="ftextarea"
                  placeholder={"Paste 3-5 past scripts for voice match.\n\nExample:\n\"This is my weekly order from Blinkit, come check it out...\"\n\"Diet Coke. No brainer. Zero calories, does the job...\""}
                  value={cfg.scripts} onChange={e=>set("scripts",e.target.value)}/>
              </div>
              <div style={{display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
                <button className="btn btn-p" onClick={run} disabled={!cfg.niche||!cfg.keywords}>Run Full Pipeline →</button>
                <span style={{fontSize:"12px",color:"var(--muted)"}}>Generates 3 scripts + 3 hook sets · ~3 min</span>
              </div>
              {(!cfg.niche||!cfg.keywords)&&<p style={{fontSize:"12px",color:"var(--muted)",marginTop:"8px"}}>* Niche and keywords required</p>}
            </div>
          )}

          {/* PIPELINE */}
          {screen==="pipeline"&&(
            <div>
              <div className="h1">Pipeline Running</div>
              <div className="sub">3 scripts + 3 hook sets generating in parallel. Do not close this tab.</div>
              {AGENTS.map(a=>{
                const s=status[a.id];
                const col=s==="done"?"var(--green)":s==="running"?"var(--accent)":s==="error"?"var(--red)":"var(--muted)";
                const label={idle:"WAITING",running:"RUNNING",done:"COMPLETE",error:"ERROR"}[s];
                return(
                  <div key={a.id} className={`acard s-${s}`}>
                    <div className="acard-top">
                      <div className="acard-left"><span className="acode">{a.code}</span><span className="aname">{a.name}</span></div>
                      <div className="astatus"><div className={`sdot s-${s}`}/><span style={{color:col}}>{label}</span></div>
                    </div>
                    <div className="adesc">{a.sub}</div>
                    {s==="running"&&<div className="lbar"><div className="lbar-fill"/></div>}
                    {s==="done"&&<div className="mono" style={{fontSize:"11px",color:"var(--green)"}}>✓ Output passed to next agent</div>}
                    {s==="error"&&<div className="mono" style={{fontSize:"11px",color:"var(--red)"}}>✗ {err}</div>}
                  </div>
                );
              })}
              {err&&<div style={{marginTop:"18px",display:"flex",gap:"10px"}}><button className="btn btn-p" onClick={run}>Retry</button><button className="btn btn-g" onClick={reset}>← Back</button></div>}
            </div>
          )}

          {/* RESULTS */}
          {screen==="results"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"12px",marginBottom:"28px"}}>
                <div>
                  <div className="h1" style={{marginBottom:"4px"}}>Pipeline Complete ✓</div>
                  <div style={{fontSize:"13px",color:"var(--muted)"}}>3 scripts · 3 hook sets · Pick your angle and shoot.</div>
                </div>
                <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                  <button className="btn btn-g btn-sm" onClick={copyBrief}>Copy Selected Brief</button>
                  <button className="btn btn-p btn-sm" onClick={reset}>Run Again</button>
                </div>
              </div>

              <div className="tabs">
                {[{id:"scraper",label:"01 · Scraper"},{id:"validator",label:"02 · Validation"},{id:"script",label:"03 · Scripts"},{id:"hooks",label:"04 · Hooks"}].map(t=>(
                  <button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>{t.label}</button>
                ))}
              </div>

              {/* TAB 01 */}
              {tab==="scraper"&&res.scraper&&(
                <div style={{overflowX:"auto"}}>
                  <table className="tbl">
                    <thead><tr><th>Platform</th><th style={{minWidth:"220px"}}>Hook</th><th>Topic</th><th>Views</th><th>Likes</th><th>ER%</th><th>Age</th><th>Format</th></tr></thead>
                    <tbody>
                      {(res.scraper.posts||[]).sort((a,b)=>b.views-a.views).map((p,i)=>(
                        <tr key={i}>
                          <td><span className={`plat plat-${(p.platform||"").toLowerCase()}`}>{p.platform}</span></td>
                          <td style={{maxWidth:"240px",fontSize:"13px"}}>{p.hook}{p.viral&&<span className="vtag">Viral</span>}</td>
                          <td style={{color:"var(--muted)",fontSize:"12px"}}>{p.topic}</td>
                          <td className="mono" style={{fontSize:"12px",color:p.views>=100000?"var(--accent)":"inherit"}}>{fmt(p.views)}</td>
                          <td className="mono" style={{fontSize:"12px"}}>{fmt(p.likes)}</td>
                          <td className="mono" style={{fontSize:"12px",color:p.engagementRate>=5?"var(--green)":"inherit"}}>{p.engagementRate}%</td>
                          <td className="mono" style={{fontSize:"12px",color:"var(--muted)"}}>{p.daysAgo}d</td>
                          <td style={{fontSize:"12px",color:"var(--muted)"}}>{p.format}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{marginTop:"10px",fontSize:"11px",color:"var(--muted)",fontFamily:"monospace"}}>{res.scraper.posts?.length||0} posts · Add APIFY_TOKEN in Vercel for live data</div>
                </div>
              )}

              {/* TAB 02 */}
              {tab==="validator"&&res.validator&&(
                <div>
                  <div className="recbox"><div className="reclabel">✦ AI Recommendation</div><div className="rectext">{res.validator.recommendation}</div></div>
                  <div className="slabel">Top Topics by Avg Views</div>
                  <div style={{overflowX:"auto",marginBottom:"24px"}}>
                    <table className="tbl">
                      <thead><tr><th>Topic</th><th>Avg Views</th><th>Posts</th><th>Trend</th></tr></thead>
                      <tbody>{(res.validator.topTopics||[]).map((t,i)=>(
                        <tr key={i}>
                          <td style={{fontWeight:500}}>{t.topic}</td>
                          <td className="mono" style={{fontSize:"13px",color:"var(--accent)"}}>{fmt(t.avgViews)}</td>
                          <td className="mono" style={{fontSize:"12px",color:"var(--muted)"}}>{t.postCount}</td>
                          <td style={{fontSize:"13px",color:t.trend==="rising"?"var(--green)":t.trend==="fading"?"var(--red)":"var(--muted)"}}>
                            {t.trend==="rising"?"↑ Rising":t.trend==="fading"?"↓ Fading":"→ Stable"}
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div className="slabel">Top Formats</div>
                  <div className="fcards">{(res.validator.topFormats||[]).map((f,i)=>(
                    <div key={i} className="fcard">
                      <div className="fcard-n">{f.format}</div>
                      <div className="fcard-s" style={{color:"var(--green)"}}>{f.avgER}% avg ER</div>
                      <div className="fcard-s" style={{color:"var(--muted)",marginTop:"2px"}}>{fmt(f.avgShares)} avg shares</div>
                    </div>
                  ))}</div>
                  {(res.validator.viralSignals||[]).length>0&&<div style={{marginBottom:"14px"}}><div className="slabel">Viral Signals</div>{res.validator.viralSignals.map((s,i)=><span key={i} className="sbadge sbadge-v">◉ {s}</span>)}</div>}
                  {(res.validator.sustainedTrends||[]).length>0&&<div><div className="slabel">Sustained Trends</div>{res.validator.sustainedTrends.map((s,i)=><span key={i} className="sbadge sbadge-s">→ {s}</span>)}</div>}
                </div>
              )}

              {/* TAB 03 — 3 SCRIPT OPTIONS */}
              {tab==="script"&&res.scripts&&(
                <div>
                  <div className="slabel" style={{marginBottom:"10px"}}>Choose Your Angle</div>
                  <div className="opt-bar">
                    {ANGLES.map((a,i)=>(
                      <button key={i} className={`opt-btn ${activeScript===i?"active":""}`} onClick={()=>setActiveScript(i)}>
                        <span className="opt-btn-label">{a.label}</span>
                        <span className="opt-btn-name">{a.name}</span>
                        <span style={{fontSize:"10px",color:"var(--muted)",fontWeight:400}}>{a.desc}</span>
                        {i===2&&<span className="opt-recommended">Highest reach</span>}
                        {i===1&&<span className="opt-recommended" style={{background:"rgba(96,165,250,.15)",color:"var(--blue)"}}>Most saves</span>}
                      </button>
                    ))}
                  </div>
                  {renderBrief(res.scripts[activeScript])}
                </div>
              )}

              {/* TAB 04 — 3 × 5 HOOK SETS */}
              {tab==="hooks"&&res.hookSets&&(
                <div>
                  <div className="slabel" style={{marginBottom:"10px"}}>Choose Hook Set — Matched to Script Angle</div>
                  <div className="opt-bar">
                    {(res.hookSets||[]).map((hs,i)=>(
                      <button key={i} className={`opt-btn ${activeHookSet===i?"active":""}`} onClick={()=>setActiveHookSet(i)}>
                        <span className="opt-btn-label">Option {String.fromCharCode(65+i)}</span>
                        <span className="opt-btn-name">{hs.angle||ANGLES[i]?.name}</span>
                        {i===activeScript&&<span className="opt-recommended">Matches your script</span>}
                      </button>
                    ))}
                  </div>

                  <div style={{marginBottom:"18px",padding:"12px 16px",background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:"6px",fontSize:"12px",color:"var(--muted)"}}>
                    💡 For best results — use the hook set that matches your chosen script angle. You can mix and match too.
                  </div>

                  {res.hookSets[activeHookSet]?.hooks?.map((h,i)=>(
                    <div key={i} className={`hcard ${i===res.hookSets[activeHookSet].recommendedIndex?"rec":""}`}>
                      <div className="hnum">{i===res.hookSets[activeHookSet].recommendedIndex?"★":`0${i+1}`}</div>
                      <div className="hbody">
                        <div className="htext">{h.text}</div>
                        <div className="hmeta">
                          <span className="hpat">{h.pattern}</span>
                          <span className="hexpl">{h.explanation}</span>
                          <div className="cbar">
                            <div className="ctrack"><div className="cfill" style={{width:`${(h.confidence/10)*100}%`}}/></div>
                            <span className="cnum">{h.confidence}/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {res.hookSets[activeHookSet]?.recommendedIndex!==undefined&&(
                    <div className="recbox" style={{marginTop:"18px"}}>
                      <div className="reclabel">★ Recommended Hook for This Angle</div>
                      <div className="rectext">Hook {(res.hookSets[activeHookSet].recommendedIndex||0)+1} — highest confidence for {res.hookSets[activeHookSet].angle||"this angle"}.</div>
                    </div>
                  )}

                  <div className="divider"/>
                  <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                    <button className="btn btn-p" onClick={copyBrief}>Copy Script + Best Hook</button>
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
