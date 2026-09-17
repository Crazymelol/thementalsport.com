'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Check, X, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import Script from 'next/script';

// Extend Window for GA4 gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const modules = [
  {
    number: '01',
    title: 'The Physiological Reset',
    description: 'The double-inhale sigh and box breathing — the fastest evidence-backed way to drop arousal in 60 seconds.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 3v18M5 8s2-2 7-2 7 2 7 2" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'The Anchor',
    description: 'Condition one physical gesture to a calm, focused state — then trigger flow on demand under real pressure.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="m12 2 2.5 6.5L21 9l-5 4 1.5 7L12 16l-5.5 4L8 13 3 9l6.5-.5Z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Error Recovery',
    description: 'Reset gesture, one word, eyes to the next task in three seconds. Practiced enough, the spiral never starts.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 12h4l3 8 4-16 3 8h4" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'The 90-Second Rule',
    description: 'The window to feel a setback and let it pass — so emotion never hijacks the next play.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    number: '05',
    title: 'The 5-Win Protocol',
    description: 'Daily confidence reps that build belief from evidence — the kind that holds up when the applause stops.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    number: '06',
    title: 'External Focus Cues',
    description: 'Target, not technique. Where the ball goes, not how the arm moves — the antidote to choking under the lights.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      </svg>
    ),
  },
  {
    number: '07',
    title: 'The Taper Ritual',
    description: 'A boring-on-purpose pre-game routine that becomes a circuit breaker when the nerves spike.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M6 3v7a6 6 0 0 0 12 0V3M4 3h16M9 21h6M12 16v5" />
      </svg>
    ),
  },
  {
    number: '08',
    title: 'Competition Day',
    description: 'Put it together: warm-up, focus, reset and recovery stacked into one repeatable game-day system.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 3a9 9 0 1 0 9 9M12 3v9l6-3" />
      </svg>
    ),
  },
];

const includes = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="m10 8 6 4-6 4V8Z" />
        <rect x="3" y="4" width="18" height="16" rx="2" />
      </svg>
    ),
    title: '8 modules of video lessons',
    description: 'The full protocol, taught step by step.',
    value: 'Core',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 4h16v16H4zM8 4v16" />
      </svg>
    ),
    title: 'The complete book library (8 titles)',
    description: 'Every mental-game book, in PDF.',
    value: '<span style={{textDecoration: "line-through", opacity: 0.6}}>$89</span> Included',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    ),
    title: '30-day Mental Performance Journal',
    description: 'Turn the protocols into daily habits.',
    value: '<span style={{textDecoration: "line-through", opacity: 0.6}}>$29</span> Included',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 10v4h4l5 5V5L7 10H3Z" />
        <path d="M16 8a5 5 0 0 1 0 8" />
      </svg>
    ),
    title: 'Audio version of every lesson',
    description: 'Train on the commute, in warm-up.',
    value: '<span style={{textDecoration: "line-through", opacity: 0.6}}>$49</span> Included',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
      </svg>
    ),
    title: 'Lifetime access & updates',
    description: 'Yours to keep, revisit any season.',
    value: 'Included',
  },
];

const faqs = [
  {
    question: 'How is the course delivered?',
    answer: 'The moment you buy, Gumroad unlocks your course content — a set of private video lessons you can watch on any device, at your own pace, forever.',
  },
  {
    question: 'How much time does it take?',
    answer: 'Lessons are short and practical. Most protocols take ten focused minutes a day to install — the point is reps, not marathons.',
  },
  {
    question: 'Which sports is it for?',
    answer: 'All of them. Pressure, focus, confidence and recovery are universal — the protocols apply whether you compete individually or on a team, and work just as well for coaches and sports parents.',
  },
  {
    question: 'Is there really a guarantee?',
    answer: 'Yes. Run the protocols for 30 days. If your mental game isn\'t sharper, email us for a full refund — no hard feelings.',
  },
  {
    question: 'Do I keep access?',
    answer: 'Forever. One payment, lifetime access, plus every future update to the protocol at no extra cost.',
  },
];

const stats = [
  { stat: '77%', label: 'of athletes choke under pressure' },
  { stat: '90 sec', label: 'to reset after a mistake' },
  { stat: '1 exhale', label: 'longer than the inhale flips the switch' },
];

const problems = [
  'Freezing or rushing the moment it counts',
  'One early error unraveling the whole game',
  'Confidence that vanishes after a bad result',
  'Overthinking mechanics until they break',
];

const solutions = [
  'A routine that drops your heart rate on command',
  'An error-recovery protocol so the spiral never starts',
  'Confidence built on evidence, not outcomes',
  'Focus cues that put attention where it belongs',
];

const forYou = [
  'You train hard but underperform when it counts',
  'Nerves, doubt or overthinking cost you results',
  'You\'re a coach or parent who wants real tools',
  'You\'ll actually run the protocols, not just watch',
];

const notForYou = [
  'You want a magic fix with zero practice',
  'You\'re looking for hype, not a system',
  'You won\'t put in ten focused minutes a day',
];

const GUMROAD_URL = 'https://notarasio.gumroad.com/l/qjsfty';
const PRICE = '$297';

// GA4 event tracking helper
const trackGumroadClick = (location: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'gumroad_cta_click', {
      event_category: 'conversion',
      event_label: location,
      value: 297,
      currency: 'USD',
      page_path: window.location.pathname,
    });
  }
};

export default function ProtocolPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('tms-theme') as 'light' | 'dark' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('tms-theme', next);
  };

  useEffect(() => {
    if (!mounted) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [mounted]);

  if (!mounted) {
    return (
      <html lang="en" data-theme="dark">
        <body className="min-h-screen bg-zinc-950" />
      </html>
    );
  }

  return (
    <>
      <Script
        id="protocol-theme"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var root = document.documentElement, KEY = "tms-theme";
              try { var saved = localStorage.getItem(KEY); if (saved) { root.setAttribute("data-theme", saved); } } catch (e) {}
            })();
          `,
        }}
      />
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 transition-colors duration-300">
        {/* Header */}
        <header className="fixed w-full z-50 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex items-center justify-between h-16" aria-label="Primary">
              <Link href="/" className="flex items-center gap-2 font-black uppercase tracking-tighter text-xl text-zinc-950 dark:text-white" aria-label="The Mental Sport home">
                <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M12 3c-4 0-7 3-7 7 0 3 2 5 2 7h10c0-2 2-4 2-7 0-4-3-7-7-7Z" />
                    <path d="M9 21h6" />
                  </svg>
                </span>
                The Mental Sport
              </Link>
              <div className="hidden md:flex items-center gap-8">
                <a href="#system" className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">The System</a>
                <a href="#included" className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">What's Included</a>
                <a href="#coach" className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">Coach</a>
                <a href="#faq" className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors">FAQ</a>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  aria-label="Toggle light and dark mode"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <a
                  href={GUMROAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-sm rounded-lg transition-colors flex items-center gap-2"
                  data-gumroad-action="buy"
                  onClick={() => trackGumroadClick('header')}
                >
                  Enroll — <span data-gumroad-field="price">{PRICE}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden" id="top">
          <div className="absolute inset-0 -top-1/4 h-[620px] bg-gradient-to-br from-red-600/20 via-transparent to-transparent animate-float" style={{ animation: 'float 14s ease-in-out infinite' }} aria-hidden="true" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="reveal">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-6" data-gumroad-field="name">
                  The Mental Performance Protocol
                </span>
                <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                  Train the mind<br />like you train<br />the <em className="text-red-500 not-italic">body.</em>
                </h1>
                <p className="text-lg lg:text-xl text-zinc-500 dark:text-zinc-400 max-w-xl mb-8 leading-relaxed">
                  The complete mental-training system for athletes. Beat pressure, quiet the nerves, lock in focus, and build the kind of confidence that survives a bad game.
                </p>
                <div className="flex flex-wrap gap-4 mb-6">
                  <a
                    href={GUMROAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-sm rounded-lg transition-all hover:scale-[1.02] hover:shadow-[0_14px_44px_rgba(220,38,38,0.28)]"
                    data-gumroad-action="buy"
                    onClick={() => trackGumroadClick('hero_primary')}
                  >
                    Get instant access
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <a href="#system" className="inline-flex items-center gap-2 px-8 py-4 border border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-white font-black uppercase tracking-wider text-sm rounded-lg transition-colors hover:border-red-500 hover:text-red-500">
                    See what's inside
                  </a>
                </div>
                <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                  <b className="text-zinc-950 dark:text-white text-lg" style={{ fontSize: '1.05rem' }}>
                    <span data-gumroad-field="price">{PRICE}</span>
                  </b>
                  <span>· one-time · lifetime access</span>
                </div>
                <div className="flex flex-wrap gap-4 lg:gap-6 mt-6 text-sm text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-red-500 flex-shrink-0" />
                    30-day guarantee
                  </span>
                  <span className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-500 flex-shrink-0">
                      <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z" />
                    </svg>
                    Trained on real athletes
                  </span>
                  <span className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-500 flex-shrink-0">
                      <path d="M12 8v4l3 2" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    Learn at your pace
                  </span>
                </div>
              </div>

              {/* Cover Card */}
              <aside className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-red-600/10 to-zinc-100 dark:from-red-600/10 dark:to-zinc-900 p-6 lg:p-8 shadow-xl min-h-[380px] flex flex-col justify-between reveal" aria-hidden="true">
                <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-red-600/20 blur-3xl" aria-hidden="true" />
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-red-600 text-white text-[0.62rem] font-black uppercase tracking-[0.22em] rounded-full mb-6">
                    Video course
                  </span>
                  <div className="relative z-10">
                    <small className="block text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-[0.14em] text-[0.7rem] mb-2">
                      The Mental Sport presents
                    </small>
                    <strong className="block text-3xl lg:text-4xl font-black uppercase tracking-tight leading-tight text-zinc-950 dark:text-white">
                      The Mental<br />Performance<br />Protocol
                    </strong>
                  </div>
                  <ul className="mt-6 space-y-4" role="list">
                    {[
                      '8 modules of video lessons',
                      'Step-by-step protocols',
                      'Worksheets + the full book library',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                        <Check className="w-5 h-5 text-red-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <svg className="absolute -left-10 -bottom-10 opacity-30 w-48 h-48" viewBox="0 0 180 180" fill="none" stroke="currentColor" aria-hidden="true">
                  <circle cx="90" cy="90" r="80" strokeWidth="1" />
                  <circle cx="90" cy="90" r="58" strokeWidth="1" />
                  <circle cx="90" cy="90" r="36" strokeWidth="1" />
                </svg>
              </aside>
            </div>
          </div>
        </section>

        {/* Stat Band */}
        <div className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 overflow-hidden" aria-label="Why the mental game matters">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex whitespace-nowrap animate-slide" style={{ animation: 'slide 26s linear infinite' }}>
              {[
                ...stats,
                ...stats,
              ].map((item, i) => (
                <span key={i} className="px-8 py-4 font-black uppercase tracking-[0.04em] text-sm flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <b className="text-lg text-red-500">{item.stat}</b>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(26px); }
          }
          @keyframes slide {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-float, .animate-slide { animation: none !important; }
          }
        `}</style>

        {/* Problem / Solution */}
        <section className="py-16 lg:py-24" id="problem">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-12 reveal">
              <span className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-4">
                The gap nobody trains
              </span>
              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight mb-4">
                Talent gets you to the start line. Your mind decides the finish.
              </h2>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
                You've put in the reps. But when it matters most, the nerves take over, the head gets loud, one mistake spirals into three — and all that training never shows up. That gap isn't a talent problem. It's an untrained skill.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <ul className="space-y-5 reveal" role="list">
                {problems.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <X className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700 dark:text-zinc-300 text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-5 reveal" role="list">
                {solutions.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <Check className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-950 dark:text-white text-lg font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* The System - 8 Modules */}
        <section id="system" className="py-16 lg:py-24 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-16 reveal">
              <span className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-4">
                Inside the protocol
              </span>
              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight mb-4">
                Eight modules. One trainable mental game.
              </h2>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Each module is a short video lesson plus an exact, repeatable protocol you can run before, during, and after competition — no fluff, no theory for theory's sake.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module, i) => (
                <div
                  key={module.number}
                  className="reveal rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 hover:shadow-xl hover:border-red-500/50 hover:-translate-y-1 transition-all duration-300"
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-red-500 mb-4">
                    {module.icon}
                  </div>
                  <span className="text-red-500 font-black uppercase tracking-[0.2em] text-sm mb-2 block">Module {module.number}</span>
                  <h3 className="text-xl font-black uppercase tracking-tight text-zinc-950 dark:text-white mb-3">{module.title}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{module.description}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12 reveal">
              <a
                href={GUMROAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-base rounded-lg transition-all hover:scale-[1.02] hover:shadow-[0_14px_44px_rgba(220,38,38,0.28)]"
                data-gumroad-action="buy"
                onClick={() => trackGumroadClick('modules_cta')}
              >
                Start the protocol — <span data-gumroad-field="price">{PRICE}</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section id="included" className="py-16 lg:py-24 bg-zinc-50 dark:bg-zinc-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-12 reveal">
              <span className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-4">
                Everything you get
              </span>
              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight">
                A complete toolkit, not just videos.
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {includes.map((item, i) => (
                <div
                  key={i}
                  className="reveal flex items-center justify-between gap-6 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-red-500 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-black text-zinc-950 dark:text-white">{item.title}</h3>
                      <p className="text-zinc-500 dark:text-zinc-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-red-500 font-bold text-sm whitespace-nowrap flex-shrink-0" dangerouslySetInnerHTML={{ __html: item.value }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-16 lg:py-24 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="reveal rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8">
                <span className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-6">
                  This is for you if
                </span>
                <ul className="space-y-4" role="list">
                  {forYou.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="reveal rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-8">
                <span className="inline-block px-3 py-1 bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-300/50 dark:border-zinc-700 text-zinc-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-6">
                  It's not for you if
                </span>
                <ul className="space-y-4" role="list">
                  {notForYou.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <X className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-500 dark:text-zinc-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Coach */}
        <section id="coach" className="py-16 lg:py-24 bg-zinc-50 dark:bg-zinc-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="reveal rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 md:p-12">
              <div className="grid md:grid-cols-[180px_1fr] gap-8 md:gap-12 items-center">
                <div className="w-48 h-48 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white font-black text-5xl md:text-7xl shadow-xl mx-auto md:mx-0" aria-hidden="true">
                  GN
                </div>
                <div>
                  <span className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-4">
                    Your coach
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-950 dark:text-white mb-4">
                    Giannis Notaras
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-lg">
                    Sport-psychology coach and founder of The Mental Sport. Giannis has spent years turning the research on pressure, focus and confidence into simple protocols athletes can actually run — the same ones taught, module by module, inside this course. No jargon. Just what works when the whistle blows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing / Enroll */}
        <section id="enroll" className="py-16 lg:py-24 bg-white dark:bg-zinc-950">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-12 reveal">
              <span className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-4">
                Enroll today
              </span>
              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight">
                One decision between you and a trained mind.
              </h2>
            </div>
            <div className="max-w-2xl mx-auto reveal">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-xl overflow-hidden">
                <div className="p-8 md:p-10 text-center border-b border-zinc-200 dark:border-zinc-800">
                  <span className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-3" data-gumroad-field="name">
                    The Mental Performance Protocol
                  </span>
                  <div className="text-5xl md:text-7xl font-black text-zinc-950 dark:text-white leading-none tracking-tight mb-2" data-gumroad-field="price">
                    {PRICE}
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400">One-time payment · lifetime access</p>
                </div>
                <div className="p-8 md:p-10">
                  <ul className="space-y-4 mb-8" role="list">
                    {[
                      'All 8 video modules + protocols',
                      'The complete 8-book library (PDF)',
                      '30-day journal + full audio course',
                      'Lifetime access & every future update',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-700 dark:text-zinc-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={GUMROAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-base rounded-lg transition-all hover:scale-[1.02] hover:shadow-[0_14px_44px_rgba(220,38,38,0.28)]"
                    data-gumroad-action="buy"
                    onClick={() => trackGumroadClick('pricing_cta')}
                  >
                    Enroll now — <span data-gumroad-field="price">{PRICE}</span>
                    <ArrowRight className="w-5 h-5" />
                  </a>
                  <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm mt-6">
                    Secure checkout on Gumroad · instant access · 30-day money-back guarantee
                  </p>
                </div>
              </div>

              {/* Guarantee */}
              <div className="mt-8 reveal flex items-start gap-4 p-6 rounded-2xl border-2 border-dashed border-red-500/30 bg-red-50 dark:bg-red-950/20">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-white">
                    <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-950 dark:text-white mb-2">Run it for 30 days, risk-free.</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Go through the protocols. If your mental game isn't sharper, email us within 30 days for a full refund. The risk is on us — because the work works.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 lg:py-24 bg-zinc-50 dark:bg-zinc-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center mb-12 reveal">
              <span className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-4">
                Questions
              </span>
              <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight">
                Good. Here are answers.
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="reveal rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden group"
                  open={i === 0}
                  style={{ transitionDelay: `${i * 50}ms` }}
                >
                  <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none font-semibold text-zinc-950 dark:text-white">
                    {faq.question}
                    <ChevronDown className="w-5 h-5 text-red-500 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="px-5 pb-5 text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 lg:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-transparent" aria-hidden="true" />
          <div className="absolute inset-0 bottom-0 h-[400px] bg-gradient-to-t from-red-600/20 to-transparent" aria-hidden="true" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="reveal rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 md:p-14 text-center">
              <span className="inline-block px-3 py-1 bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-black uppercase tracking-[0.2em] rounded-full mb-6">
                Your move
              </span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-tight mb-6">
                The next big moment is coming. Be ready for it.
              </h2>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                Stop leaving your best performances to chance. Train the mental game the same way you train everything else — deliberately.
              </p>
              <a
                href={GUMROAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-lg rounded-xl transition-all hover:scale-[1.02] hover:shadow-[0_14px_44px_rgba(220,38,38,0.28)]"
                data-gumroad-action="buy"
                onClick={() => trackGumroadClick('final_cta')}
              >
                Get The Mental Performance Protocol — <span data-gumroad-field="price">{PRICE}</span>
              </a>
              <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
                Instant access · 30-day guarantee
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-10 bg-zinc-50 dark:bg-zinc-900">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                © The Mental Sport · by Giannis Notaras
              </p>
              <nav className="flex flex-wrap gap-6" aria-label="Footer">
                <a href="https://notarasio.gumroad.com" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-colors">
                  All products
                </a>
                <a href="https://thementalsport.com" target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-colors">
                  thementalsport.com
                </a>
                <a href="#enroll" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-red-500 transition-colors">
                  Enroll
                </a>
              </nav>
            </div>
          </div>
        </footer>

        {/* Gumroad Overlay Script */}
        <Script
          src="https://gumroad.com/js/gumroad-embed.js"
          strategy="lazyOnload"
          id="gumroad-script"
        />
      </main>
    </>
  );
}