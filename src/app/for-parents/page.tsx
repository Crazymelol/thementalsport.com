'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardCheck, MessageCircle, Mail, Lock, Download, AlertCircle, Check } from 'lucide-react';
import NewsletterWrapper from '@/components/NewsletterWrapper';

const parentArticles = [
  { href: '/blog/sports-psychology-for-youth-athletes', title: 'Sports Psychology for Youth Athletes' },
  { href: '/blog/what-to-say-to-nervous-young-athlete', title: 'What to Say to a Nervous Young Athlete' },
  { href: '/blog/sideline-behavior-sports-parents', title: 'The Sports Parent Sideline Guide' },
];

const problems = [
  { title: 'Nerves before competition', description: 'Build a simple preparation routine and language that calms without adding pressure.' },
  { title: 'Confidence after mistakes', description: 'Help your child reset, learn, and return to the next play instead of carrying the last one.' },
  { title: 'Pressure from sport', description: 'Keep performance separate from identity while still supporting serious improvement.' },
];

const resources = [
  { href: '/book/nurturing-self-worth', title: 'Nurturing Self-Worth', description: 'A parent guide for confidence beyond the scoreboard.', icon: BookOpen },
  { href: '/book/unbreakable', title: 'Unbreakable', description: 'A story for young athletes learning to recover from mistakes.', icon: BookOpen },
  { href: 'https://notarasio.gumroad.com/l/mzcxp', title: 'Personalised Performance Plan', description: 'A focused $97 plan for your athlete\'s current challenge.', icon: ClipboardCheck, external: true },
];

export default function ForParentsPage() {
  const [showLeadMagnet, setShowLeadMagnet] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleLeadMagnetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'for-parents-lead-magnet', tags: ['parent', 'lead-magnet'] }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      setSubmitted(true);
      setShowLeadMagnet(false);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Hero */}
      <section className="bg-zinc-950 text-white py-24 lg:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,_rgba(220,38,38,0.15),_transparent_50%)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950/40 to-zinc-950 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">For Parents of Young Athletes</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-tight">
            SUPPORT THE ATHLETE.<br />
            <span className="text-red-500">PROTECT THE PERSON.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            Practical tools to help your child handle nerves, mistakes, confidence swings, and the pressure to perform — without making sport feel like another test.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/quiz" className="inline-flex items-center gap-2 bg-white text-zinc-950 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors rounded-lg">
              Take the free quiz <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/books" className="inline-flex items-center gap-2 border border-zinc-700 text-white px-8 py-4 text-sm font-black uppercase tracking-[0.2em] hover:border-white transition-colors rounded-lg">
              Find a parent guide <BookOpen className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-zinc-500 text-xs uppercase tracking-widest">Free 7-day system • No credit card</p>
        </div>
      </section>

      {/* Lead Magnet Banner */}
      <section className="py-16 px-6 bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-2">FREE PARENT GUIDE</p>
              <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight mb-3">
                What to Say When Your Kid Chokes
              </h2>
              <p className="text-lg opacity-90 max-w-xl">
                The exact scripts, reset routines, and sideline language to use in the 5 moments every sports parent dreads — so you show up as a calm anchor, not extra pressure.
              </p>
              <ul className="mt-6 space-y-2 text-sm opacity-90">
                {[
                  'Pre-game: The one sentence that lowers arousal instantly',
                  'Mid-game meltdown: The 3-word reset you can say from the stands',
                  'Post-game silence: What to ask instead of "How did you play?"',
                  'The confidence spiral: How to rebuild belief after a bad weekend',
                  'Sideline traps: 4 things to never say (and what to say instead)',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Download className="w-4 h-4 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-shrink-0">
              {submitted ? (
                <div className="bg-white/10 backdrop-blur rounded-xl p-8 text-center border border-white/20">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-2">Check your inbox!</h3>
                  <p className="opacity-90 mb-4">The guide is on its way to <strong>{email}</strong></p>
                  <button onClick={() => setSubmitted(false)} className="text-sm underline hover:no-underline">Download another copy</button>
                </div>
              ) : showLeadMagnet ? (
                <form onSubmit={handleLeadMagnetSubmit} className="bg-white/10 backdrop-blur rounded-xl p-8 border border-white/20 w-full max-w-xs">
                  <h3 className="text-lg font-black mb-4">Get the free PDF</h3>
                  <p className="text-sm opacity-80 mb-4">We\'ll email it instantly. No spam, unsubscribe anytime.</p>
                  {error && <p className="text-red-200 text-sm mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}
                  <div className="space-y-3">
                    <label htmlFor="parent-email" className="sr-only">Email address</label>
                    <input
                      id="parent-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-colors"
                      required
                      disabled={submitting}
                    />
                    <button type="submit" disabled={submitting} className="w-full py-3 bg-white text-red-600 font-black uppercase tracking-wider text-sm rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? (
                        <>
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Send Me the Guide
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs opacity-50 text-center mt-3">By submitting, you agree to receive mental performance emails from The Mental Sport. <Link href="/privacy" className="underline hover:no-underline">Privacy Policy</Link></p>
                </form>
              ) : (
                <button onClick={() => setShowLeadMagnet(true)} className="w-full max-w-xs py-4 bg-white text-red-600 font-black uppercase tracking-wider text-sm rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Get the Free Guide
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What Are You Seeing? */}
      <section className="py-20 px-6 bg-zinc-50 border-b border-zinc-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-4 text-center">What are you seeing?</h2>
          <p className="text-zinc-500 mb-10 text-lg text-center max-w-2xl mx-auto">The goal is not to remove every difficult feeling. It is to help your child build a response they can trust.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {problems.map(({ title, description }) => (
              <div key={title} className="bg-white border border-zinc-200 p-8 hover:border-zinc-900 transition-colors rounded-xl">
                <h3 className="font-black uppercase text-base mb-4 text-zinc-900">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Choose the Right Next Step */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">A practical starting point</p>
            <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight mb-6">Choose the right next step.</h2>
            <p className="text-zinc-600 leading-relaxed">Start with free guidance, choose a focused parent resource, or bring one specific situation to a one-to-one session.</p>
          </div>
          <div className="space-y-4">
            {resources.map((resource, i) => (
              <Link
                key={i}
                href={resource.href}
                target={resource.external ? '_blank' : undefined}
                rel={resource.external ? 'noopener noreferrer' : undefined}
                className={`flex items-center justify-between p-5 transition-colors rounded-xl ${
                  resource.external
                    ? 'border border-red-600 bg-red-50 hover:bg-red-100'
                    : 'border border-zinc-200 hover:border-zinc-900'
                }`}
              >
                <span>
                  <strong className="block font-black uppercase">{resource.title}</strong>
                  <span className="text-sm text-zinc-500">{resource.description}</span>
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Parent Resources */}
      <section className="py-20 px-6 bg-zinc-950 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-4 text-center">Start with these parent resources.</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {parentArticles.map((article) => (
              <Link key={article.href} href={article.href} className="border border-zinc-800 p-6 hover:border-white transition-colors rounded-xl h-full flex flex-col">
                <MessageCircle className="w-5 h-5 text-red-500 mb-4" />
                <span className="font-black uppercase leading-tight mb-4 flex-1">{article.title}</span>
                <ArrowRight className="w-4 h-4 self-end" />
              </Link>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-6 text-xs font-black uppercase tracking-widest justify-center">
            <Link href="/start-here" className="text-red-400 hover:text-red-300 flex items-center gap-1">Start here <ArrowRight className="w-3 h-3" /></Link>
            <Link href="/quiz" className="text-zinc-400 hover:text-white flex items-center gap-1">Take the quiz <ClipboardCheck className="w-3 h-3" /></Link>
          </div>
        </div>
      </section>

      {/* Newsletter / Lead Magnet fallback */}
      <section className="py-16 px-6 bg-zinc-100 border-t border-zinc-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-4">Want more like this?</h2>
          <p className="text-zinc-600 mb-8">Weekly mental-game scripts, reset routines, and parent strategies — free in your inbox.</p>
          <NewsletterWrapper className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-950 text-white font-black uppercase tracking-widest text-sm hover:bg-zinc-800 transition-colors rounded-lg">
            Subscribe
          </NewsletterWrapper>
        </div>
      </section>

      <div className="py-8 px-6 text-center bg-zinc-100 border-t border-zinc-200">
        <Link href="/" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-950 transition-colors">← TheMentalSport.com</Link>
      </div>
    </main>
  );
}