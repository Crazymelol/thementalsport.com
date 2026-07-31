#!/usr/bin/env node
// Generates a self-contained, conversion-focused Gumroad landing page for each
// book, into gumroad-landings/<slug>.html. Pages are palette-driven (no external
// images — Gumroad blocks external hosts), responsive, accessible, light/dark,
// and carry the required Gumroad buy elements + data-gumroad-field markers.
//
// Data mirrors src/data/books.ts (kept inline so this runs with no TS import).
// Run: node scripts/gumroad/build-landings.mjs  (writes 8 files, no network).

import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'gumroad-landings');

// slug = Gumroad permalink id. accent = book palette primary.
const PRODUCTS = [
    {
        slug: 'yfkgwv', title: 'The Competition Protocol', accent: '#dc2626', price: '$17',
        subtitle: 'Master Your Mindset, Crush Anxiety, and Dominate Your Sport',
        hook: 'The 7 days before your event decide the result. This is the hour-by-hour system that makes winning automatic.',
        forYou: ['You feel calm in practice but tighten up when it counts', 'You want a repeatable pre-event routine, not vague hype', 'You are done leaving your best performance in the warm-up'],
        inside: ['The T-Minus 7 Day countdown checklist', "How to build an 'Anchor' that triggers flow instantly", 'SOPs for gear, nutrition, and warm-up', 'A structured protocol for visualizing the win'],
        reviews: [{ q: 'I used to panic before every race. Now I just execute the protocol and trust it.', a: 'Beta Reader', r: 'Triathlete' }],
    },
    {
        slug: 'albwf', title: 'Overcoming Mental Blocks', accent: '#d97706', price: '$17',
        subtitle: 'A Guide to Peak Performance',
        hook: 'Silence the inner critic, dismantle the barriers holding you back, and unlock the version of you that performs under pressure.',
        forYou: ['A voice in your head talks you out of big moments', 'Performance anxiety keeps costing you results', 'You want proven tools, not motivational slogans'],
        inside: ['Identify and dismantle the blocks holding you back', 'Tame performance anxiety with proven techniques', 'Build unshakable mental resilience', 'A personalized plan for consistent peak performance'],
        reviews: [{ q: "A lifeline for anyone striving to excel. Not a quick fix, a lifelong toolkit.", a: 'Sarah M.', r: 'Competitive Athlete' }, { q: 'The practical exercises are game-changers. I broke through barriers that held me back for years.', a: 'Michael R.', r: 'Executive' }],
    },
    {
        slug: 'lazrca', title: 'Unbreakable', accent: '#0ea5e9', price: '$12',
        subtitle: "Leo and Maya's Mental Toughness Adventure",
        hook: 'Climb Mental Toughness Mountain with Leo and Maya. A playful journey that teaches kids 6-9 how to stay strong on the inside.',
        forYou: ['Your child crumbles after a mistake or a loss', 'You want to teach resilience without a lecture', 'You are raising a kid who gives up when it gets hard'],
        inside: ['Turn worried thoughts into helpful ones', 'Stay calm using balloon breaths', 'Learn from mistakes and keep going', "Use 'yet' to build a growth mindset"],
        reviews: [{ q: 'My 7-year-old loves Leo and Maya. It taught her how to handle disappointment in sports.', a: 'Parent Review', r: 'Verified Purchase' }, { q: 'The balloon breathing technique works wonders. Perfect for teaching kids resilience.', a: 'Teacher Review', r: 'Elementary Teacher' }],
    },
    {
        slug: 'bknbwi', title: 'Confidence-Building Workbook', accent: '#22c55e', price: '$17',
        subtitle: 'Overcome Self-Doubt and Cultivate Unshakable Self-Assurance',
        hook: 'A hands-on, exercise-driven guide to dismantle limiting beliefs, conquer fear, and build confidence that survives a bad day.',
        forYou: ['Your confidence rises and falls with your results', 'Negative self-talk runs the show under pressure', 'You want to do the work, not just read about it'],
        inside: ['Challenge negative self-talk and fear of judgment', 'Set SMART goals for your confidence journey', 'Master affirmations and visualization that stick', 'Build a support network that sustains growth'],
        reviews: [{ q: 'The exercises transformed my self-doubt into genuine confidence. Worth every penny.', a: 'Alex T.', r: 'Entrepreneur' }, { q: 'Practical, science-backed, and easy to follow. A must-have.', a: 'Rachel P.', r: 'Marketing Pro' }],
    },
    {
        slug: 'jzzsp', title: 'Unlocking Resilient Confidence', accent: '#eab308', price: '$17',
        subtitle: 'The Key to Consistent High Performance',
        hook: 'Build a mindset that thrives under pressure and turns adversity into an advantage, in sport, business, and life.',
        forYou: ['One setback knocks you off for days', 'You perform in practice but fold in competition', 'You want confidence built on more than applause'],
        inside: ['Replace fleeting confidence with deep, intrinsic belief', "Master visualization and the 'Give Your Best' philosophy", 'Turn criticism and setbacks into fuel', 'Thrive under pressure with grace and grit'],
        reviews: [{ q: 'This gave me the mental tools to perform under pressure. A must-read for competitors.', a: 'David L.', r: 'Professional Athlete' }, { q: "The 'Give Your Best' philosophy changed how I approach challenges.", a: 'Emma S.', r: 'Sales Director' }],
    },
    {
        slug: 'zkkptv', title: 'Nurturing Self-Worth', accent: '#ef4444', price: '$17',
        subtitle: "The Complete Parent's Guide to Healthy Self-Esteem in Children",
        hook: 'Raise a child who believes in themselves, handles setbacks with strength, and knows their worth is not a scoreboard.',
        forYou: ['You worry your kid ties their value to winning', 'You want to build real confidence, not empty praise', 'You are a parent or educator who wants a clear method'],
        inside: ['The psychology behind self-esteem development', 'Everyday strategies for healthy self-talk', 'Handle criticism, comparison, and perfectionism', "Build resilience through the power of 'yet'"],
        reviews: [{ q: 'This gave me the confidence to help my child build genuine self-esteem. Highly practical.', a: 'Patricia W.', r: 'Parent & Educator' }, { q: 'Research-backed and easy to implement. My students have benefited tremendously.', a: 'Mark T.', r: 'School Counselor' }],
    },
    {
        slug: 'ryzhc', title: 'Physiological Peak Performance Blueprint', accent: '#8b5cf6', price: '$17',
        subtitle: "The Science-Driven Guide to Optimizing Physical Performance",
        hook: "Harness your body's own systems for more strength, endurance, and efficiency, backed by real physiology.",
        forYou: ['You train hard but want the science to train smart', 'You want the why behind performance, not just drills', 'You are a coach or athlete chasing real gains'],
        inside: ['Optimize energy systems for power or endurance', 'Enhance cardiovascular and respiratory efficiency', 'Master neuromuscular adaptation for strength', 'Apply physiology-backed strategies to training'],
        reviews: [{ q: 'The science is incredible. It helped me optimize my training and see real results.', a: 'Carlos M.', r: 'Endurance Athlete' }, { q: "Finally explains the why behind performance. Game-changing for coaches.", a: 'Dr. Lisa H.', r: 'Sports Physiologist' }],
    },
    {
        slug: 'boced', title: "The ADHD Athlete's Edge", accent: '#ec4899', price: '$17',
        subtitle: 'Turn Distraction Into Domination',
        hook: 'Stop fighting your brain. Channel hyperactivity and focus into peak performance with routines built for an ADHD mind.',
        forYou: ['Game-day distraction wrecks your focus', 'Generic advice never fits how your brain works', 'You want to train with your ADHD, not against it'],
        inside: ['Build focus and cut game-day distractions', 'Tools for managing emotional overwhelm', 'Routines designed for an ADHD brain', 'Nutrition and recovery for neurodiverse athletes'],
        reviews: [{ q: 'This turned my weakness into my greatest strength. Finally something that fits my brain.', a: 'Tyler J.', r: 'College Athlete' }, { q: 'The routines are built for how my brain actually works. Finally, something that makes sense.', a: 'Megan R.', r: 'Track & Field' }],
    },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function page(p) {
    const forYou = p.forYou.map((x) => `<li><span class="tick" aria-hidden="true">✓</span><span>${esc(x)}</span></li>`).join('');
    const inside = p.inside.map((x) => `<li><span class="tick" aria-hidden="true">✓</span><span>${esc(x)}</span></li>`).join('');
    const reviews = p.reviews.map((r) => `
      <figure class="review reveal">
        <blockquote>&ldquo;${esc(r.q)}&rdquo;</blockquote>
        <figcaption><strong>${esc(r.a)}</strong><span>${esc(r.r)}</span></figcaption>
      </figure>`).join('');

    return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(p.title)} — Giannis Notaras</title>
<meta name="description" content="${esc(p.hook)}" />
<style>
  :root{
    --accent:${p.accent};
    --bg:#0a0a0b; --panel:#141416; --panel2:#1c1c20; --text:#f4f4f5; --muted:#a1a1aa; --line:#2a2a30;
  }
  :root[data-theme="light"]{
    --bg:#ffffff; --panel:#f6f6f7; --panel2:#eeeef0; --text:#18181b; --muted:#52525b; --line:#e4e4e7;
  }
  @media (prefers-color-scheme: light){
    :root:not([data-theme="dark"]){ --bg:#fff; --panel:#f6f6f7; --panel2:#eeeef0; --text:#18181b; --muted:#52525b; --line:#e4e4e7; }
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
  .wrap{max-width:1080px;margin:0 auto;padding:0 24px}
  a{color:inherit}
  .btn{display:inline-flex;align-items:center;gap:.6em;background:var(--accent);color:#fff;font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:14px;padding:16px 28px;border:0;border-radius:2px;cursor:pointer;text-decoration:none;transition:transform .15s ease,filter .15s ease}
  .btn:hover{transform:translateY(-2px);filter:brightness(1.08)}
  .btn--ghost{background:transparent;color:var(--text);border:1px solid var(--line)}
  .eyebrow{display:inline-block;font-size:11px;font-weight:900;letter-spacing:.25em;text-transform:uppercase;color:var(--accent);margin-bottom:16px}
  h1,h2,h3{text-transform:uppercase;letter-spacing:-.02em;line-height:1.05;font-weight:900}
  h1{font-size:clamp(34px,6vw,68px)}
  h2{font-size:clamp(26px,4vw,44px);margin-bottom:12px}
  section{padding:80px 0;border-top:1px solid var(--line)}
  /* top bar */
  .bar{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
  .bar .wrap{display:flex;align-items:center;justify-content:space-between;padding-top:14px;padding-bottom:14px}
  .brand{font-weight:900;text-transform:uppercase;letter-spacing:-.02em;font-size:15px}
  .bar-actions{display:flex;align-items:center;gap:14px}
  .price-pill{font-weight:900;font-size:14px}
  .toggle{background:var(--panel);border:1px solid var(--line);color:var(--text);width:38px;height:38px;border-radius:2px;cursor:pointer;font-size:16px;display:grid;place-items:center}
  /* hero */
  .hero{padding:72px 0 88px;position:relative;overflow:hidden}
  .hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 78% 30%,color-mix(in srgb,var(--accent) 22%,transparent),transparent 55%);pointer-events:none}
  .hero-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:48px;align-items:center;position:relative}
  .hero p.lead{color:var(--muted);font-size:clamp(17px,2vw,21px);margin:22px 0 30px;max-width:36ch}
  .cta-row{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
  .subtle{color:var(--muted);font-size:13px;margin-top:14px}
  /* book mockup */
  .book{aspect-ratio:3/4;border-radius:4px;position:relative;box-shadow:0 30px 60px -20px rgba(0,0,0,.6);background:linear-gradient(150deg,color-mix(in srgb,var(--accent) 85%,#000),color-mix(in srgb,var(--accent) 40%,#000));display:flex;flex-direction:column;justify-content:space-between;padding:26px;transform:rotate(2.5deg);transition:transform .5s ease}
  .book:hover{transform:rotate(0)}
  .book::before{content:"";position:absolute;left:14px;top:0;bottom:0;width:2px;background:rgba(255,255,255,.25)}
  .book .bk-top{font:900 11px/1 system-ui;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.85)}
  .book .bk-title{font:900 clamp(22px,3vw,30px)/1.05 system-ui;text-transform:uppercase;color:#fff;letter-spacing:-.01em}
  .book .bk-foot{font:700 12px/1.2 system-ui;color:rgba(255,255,255,.85)}
  /* lists */
  .cols{display:grid;grid-template-columns:1fr 1fr;gap:48px}
  ul.ticks{list-style:none;display:grid;gap:14px;margin-top:8px}
  ul.ticks li{display:flex;gap:12px;align-items:flex-start;color:var(--text)}
  .tick{color:var(--accent);font-weight:900;flex:0 0 auto}
  .muted{color:var(--muted)}
  .panel{background:var(--panel);border:1px solid var(--line);border-radius:4px;padding:32px}
  /* reviews */
  .reviews{display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .review{background:var(--panel);border:1px solid var(--line);border-left:3px solid var(--accent);padding:24px;border-radius:3px}
  .review blockquote{font-size:17px}
  .review figcaption{margin-top:14px;font-size:13px;color:var(--muted);display:flex;gap:8px;align-items:center}
  .review figcaption strong{color:var(--text)}
  .review figcaption span::before{content:"· "}
  /* guarantee + final */
  .center{text-align:center;max-width:640px;margin:0 auto}
  .final{background:var(--panel2)}
  .price-big{font-size:clamp(40px,7vw,64px);font-weight:900;margin:8px 0}
  .strike{color:var(--muted);text-decoration:line-through;font-weight:700;font-size:20px}
  footer{padding:40px 0;border-top:1px solid var(--line);color:var(--muted);font-size:13px;text-align:center}
  .reveal{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s ease}
  .reveal.in{opacity:1;transform:none}
  @media (max-width:820px){ .hero-grid{grid-template-columns:1fr;gap:36px} .cols{grid-template-columns:1fr;gap:28px} .reviews{grid-template-columns:1fr} .book{max-width:280px;margin:0 auto} }
  @media (prefers-reduced-motion: reduce){ *{transition:none!important;scroll-behavior:auto!important} .reveal{opacity:1;transform:none} }
</style>
</head>
<body>
  <div class="bar">
    <div class="wrap">
      <span class="brand">The Mental Sport</span>
      <div class="bar-actions">
        <span class="price-pill"><span data-gumroad-field="price">${esc(p.price)}</span></span>
        <a class="btn" data-gumroad-action="buy" href="#">Get it</a>
        <button class="toggle" id="themeBtn" aria-label="Toggle light and dark mode" title="Toggle theme">◑</button>
      </div>
    </div>
  </div>

  <header class="hero">
    <div class="wrap hero-grid">
      <div>
        <span class="eyebrow">By Giannis Notaras</span>
        <h1 data-gumroad-field="name">${esc(p.title)}</h1>
        <p class="lead">${esc(p.hook)}</p>
        <div class="cta-row">
          <a class="btn" data-gumroad-action="buy" href="#">Get the book — <span data-gumroad-field="price">${esc(p.price)}</span></a>
          <a class="btn btn--ghost" href="#inside">What's inside</a>
        </div>
        <p class="subtle">Instant digital download · 30-day money-back guarantee</p>
      </div>
      <div class="book" aria-hidden="true">
        <div class="bk-top">The Mental Sport</div>
        <div class="bk-title">${esc(p.title)}</div>
        <div class="bk-foot">Giannis Notaras</div>
      </div>
    </div>
  </header>

  <section id="foryou">
    <div class="wrap">
      <span class="eyebrow">Read this if</span>
      <h2>This book is for you if…</h2>
      <div class="cols">
        <ul class="ticks">${forYou}</ul>
        <p class="muted" data-gumroad-field="description">${esc(p.subtitle)}. ${esc(p.hook)}</p>
      </div>
    </div>
  </section>

  <section id="inside">
    <div class="wrap">
      <span class="eyebrow">What you get</span>
      <h2>Inside the book</h2>
      <div class="panel reveal">
        <ul class="ticks">${inside}</ul>
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <span class="eyebrow">Proof</span>
      <h2>What readers say</h2>
      <div class="reviews">${reviews}</div>
    </div>
  </section>

  <section>
    <div class="wrap center reveal">
      <span class="eyebrow">No risk</span>
      <h2>30-Day Money-Back Guarantee</h2>
      <p class="muted">Read it, use it. If it does not give you a real mental edge in 30 days, email us and we refund every cent. The only risk is staying stuck.</p>
    </div>
  </section>

  <section class="final">
    <div class="wrap center">
      <span class="eyebrow">Start today</span>
      <h2>${esc(p.title)}</h2>
      <div class="price-big"><span data-gumroad-field="price">${esc(p.price)}</span></div>
      <p class="muted" style="margin-bottom:26px">Instant download. Yours for life.</p>
      <a class="btn" data-gumroad-action="buy" href="#">Get the book now</a>
    </div>
  </section>

  <footer>&copy; 2026 Giannis Notaras · The Mental Sport</footer>

  <script>
    (function(){
      var root=document.documentElement, btn=document.getElementById('themeBtn');
      btn && btn.addEventListener('click',function(){
        var cur=root.getAttribute('data-theme');
        var next = cur==='light' ? 'dark' : 'light';
        root.setAttribute('data-theme', next);
      });
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.15});
      document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
    })();
  </script>
</body>
</html>`;
}

fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const p of PRODUCTS) {
    fs.writeFileSync(path.join(OUT, `${p.slug}.html`), page(p), 'utf8');
    n++;
    console.log(`  wrote gumroad-landings/${p.slug}.html  (${p.title})`);
}
console.log(`Done. ${n} landing pages generated.`);
