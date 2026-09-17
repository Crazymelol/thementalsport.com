'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertCircle, Loader2, Mail, Users, Target, Trophy, Building2 } from 'lucide-react';

const PAIN_POINTS = [
  { problem: 'Technically superior squad that underperforms at major tournaments', cause: 'No system for managing competitive anxiety and pressure spikes' },
  { problem: 'Athletes who perform brilliantly in training but collapse in competition', cause: "Training environment doesn't replicate competitive psychological demands" },
  { problem: 'One error cascading into multiple errors in high-stakes moments', cause: 'No error recovery protocol — athletes carry mistakes instead of resetting' },
  { problem: 'Inconsistent performances across a competitive season', cause: 'Mental state is unmanaged — athletes arrive to competition in random psychological conditions' },
];

const PROGRAM_PHASES = [
  { month: 'Month 1', title: 'Baseline Assessment', items: ['Individual mental skills profiling for every athlete', 'Identify performance limiters: anxiety type, attentional style, confidence structure', 'Pre-competition routine foundations established'] },
  { month: 'Months 2–3', title: 'Core Skill Installation', items: ['Pressure simulation training protocols', 'Error recovery systems embedded into existing sessions', "Self-talk restructuring for each athlete's profile"] },
  { month: 'Months 4–5', title: 'Competition Application', items: ['In-competition mental skills reinforcement', 'Post-competition mental performance debrief', 'Collective efficacy building for team sports'] },
  { month: 'Month 6', title: 'Autonomy Transfer', items: ['Athletes run their own mental routines independently', 'Coaching staff trained to maintain the system', 'Program documented for ongoing use'] },
];

const PROOF_POINTS = [
  { stat: '34%', label: 'Fewer tournament performance collapses in clubs with structured mental conditioning programs' },
  { stat: '23–40%', label: 'Improvement in competition performance metrics after 6-month implementation' },
  { stat: '3', label: 'New club partnerships per quarter — limited intentionally to maintain quality' },
];

const TARGET_CLUBS = [
  { icon: Trophy, title: 'Competitive Youth Academies', desc: 'Clubs developing athletes aged 12–21 for national or professional pathways. Building the mental infrastructure early creates compounding advantages.' },
  { icon: Target, title: 'Elite Amateur Clubs', desc: 'Competitive organizations at national or high regional level where performance under pressure determines outcomes — and where the physical gap between teams is marginal.' },
  { icon: Building2, title: 'Sports Organizations & Federations', desc: 'National-level bodies seeking to implement mental performance standards across member clubs and coaching education programs.' },
];

export default function ForClubsPage() {
  const [step, setStep] = useState<'form' | 'success' | 'error'>('form');
  const [formData, setFormData] = useState({
    clubName: '',
    yourRole: '',
    sport: '',
    squadSize: '',
    biggestChallenge: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.clubName.trim()) newErrors.clubName = 'Club name is required';
    if (!formData.yourRole.trim()) newErrors.yourRole = 'Your role is required';
    if (!formData.sport.trim()) newErrors.sport = 'Sport is required';
    if (!formData.squadSize.trim()) newErrors.squadSize = 'Squad size is required';
    if (!formData.biggestChallenge.trim()) newErrors.biggestChallenge = 'Tell us your biggest challenge';
    if (!formData.email.trim() || !formData.email.includes('@')) newErrors.email = 'Valid email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/club-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStep('success');
    } catch {
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const resetForm = () => {
    setFormData({ clubName: '', yourRole: '', sport: '', squadSize: '', biggestChallenge: '', email: '' });
    setErrors({});
    setStep('form');
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Hero */}
      <section className="bg-zinc-950 text-white py-24 lg:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,_rgba(220,38,38,0.15),_transparent_50%)] pointer-events-none" />
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6">For Sports Clubs & Academies</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-tight mb-8">
            YOUR ATHLETES HAVE THE TALENT.<br />
            <span className="text-zinc-400">DO THEY HAVE THE MENTAL SYSTEM?</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mb-10 leading-relaxed">
            Done-for-you mental conditioning programs for competitive sports clubs and academies.
            Integrated into your existing training calendar. Built to run after we leave.
          </p>
          <div className="space-y-4 max-w-xs">
            <a href="mailto:hello@thementalsport.com?subject=Club Assessment Request" className="inline-block w-full bg-white text-zinc-950 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] hover:bg-zinc-100 transition-colors text-center rounded-lg">
              Request Free Assessment <ArrowRight className="w-4 h-4 inline ml-2" />
            </a>
            <p className="text-zinc-500 text-sm text-center">30 minutes. No pitch. A diagnostic of your team's mental performance gaps.</p>
          </div>
        </div>
      </section>

      {/* Proof Points */}
      <section className="py-16 px-6 bg-zinc-100 border-y border-zinc-200">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROOF_POINTS.map((p) => (
            <div key={p.stat} className="text-center">
              <div className="text-5xl md:text-6xl font-black text-zinc-950 mb-3">{p.stat}</div>
              <p className="text-sm text-zinc-600 leading-relaxed">{p.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-4 text-center">DOES THIS SOUND FAMILIAR?</h2>
          <p className="text-zinc-500 mb-12 text-lg text-center max-w-2xl mx-auto">These are not talent problems. They are training gaps.</p>
          <div className="space-y-8">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="border-l-4 border-zinc-950 pl-6 bg-zinc-50 rounded-r-xl p-6 hover:border-red-500 transition-colors">
                <p className="font-black text-lg mb-2 text-zinc-950">{p.problem}</p>
                <p className="text-zinc-500 text-sm">Root cause: {p.cause}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Program */}
      <section className="py-20 px-6 bg-zinc-950 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-4 text-center">WHAT A REAL PROGRAM LOOKS LIKE</h2>
          <p className="text-zinc-400 mb-12 text-lg max-w-2xl mx-auto text-center">Not a workshop. Not a seminar. Structural change integrated into your existing training calendar.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PROGRAM_PHASES.map((phase) => (
              <div key={phase.month} className="border border-zinc-800 p-8 rounded-xl bg-zinc-900/50">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500 mb-2">{phase.month}</p>
                <h3 className="text-xl font-black uppercase mb-6">{phase.title}</h3>
                <ul className="space-y-3">
                  {phase.items.map((item, i) => (
                    <li key={i} className="text-zinc-400 text-sm flex gap-3">
                      <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-12 text-center">WHO THIS IS FOR</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TARGET_CLUBS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-zinc-50 p-8 rounded-xl border border-zinc-200 hover:border-zinc-900 transition-colors">
                <div className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-black uppercase text-base mb-4 text-zinc-950">{title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diagnostic Request Form */}
      <section className="py-24 px-6 bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-red-600 mb-4">3 Spots Available This Quarter</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase mb-6">START WITH A FREE DIAGNOSTIC</h2>
            <p className="text-zinc-500 text-lg leading-relaxed">
              30 minutes. We map your club's current mental performance gaps and show you exactly what a structured program would address. No pitch until you ask for one.
            </p>
          </div>

          {step === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center" role="alert">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-green-900 mb-3">Assessment Request Sent!</h3>
              <p className="text-green-700 mb-6">Thanks, <strong>{formData.clubName}</strong>. We'll review your details and reach out within 24 hours to schedule your free 30-minute diagnostic.</p>
              <button onClick={resetForm} className="text-sm font-black uppercase tracking-wider text-red-600 hover:underline">Request another assessment</button>
            </div>
          )}

          {step === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center" role="alert">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-red-900 mb-3">Something went wrong</h3>
              <p className="text-red-700 mb-6">We couldn't submit your request. Please try again or email us directly at <a href="mailto:hello@thementalsport.com" className="underline">hello@thementalsport.com</a></p>
              <button onClick={() => setStep('form')} className="text-sm font-black uppercase tracking-wider text-red-600 hover:underline">Try again</button>
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="clubName" className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Club / Academy Name *</label>
                  <input
                    id="clubName"
                    name="clubName"
                    type="text"
                    value={formData.clubName}
                    onChange={handleChange}
                    placeholder="e.g., Northside FC Academy"
                    className={`w-full px-4 py-3 rounded-lg border bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${errors.clubName ? 'border-red-500' : 'border-zinc-300'}`}
                    required
                    disabled={submitting}
                  />
                  {errors.clubName && <p className="mt-1 text-sm text-red-600">{errors.clubName}</p>}
                </div>
                <div>
                  <label htmlFor="yourRole" className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Your Role *</label>
                  <input
                    id="yourRole"
                    name="yourRole"
                    type="text"
                    value={formData.yourRole}
                    onChange={handleChange}
                    placeholder="e.g., Technical Director, Head Coach"
                    className={`w-full px-4 py-3 rounded-lg border bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${errors.yourRole ? 'border-red-500' : 'border-zinc-300'}`}
                    required
                    disabled={submitting}
                  />
                  {errors.yourRole && <p className="mt-1 text-sm text-red-600">{errors.yourRole}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="sport" className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Primary Sport *</label>
                  <input
                    id="sport"
                    name="sport"
                    type="text"
                    value={formData.sport}
                    onChange={handleChange}
                    placeholder="e.g., Soccer, Swimming, Tennis"
                    className={`w-full px-4 py-3 rounded-lg border bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${errors.sport ? 'border-red-500' : 'border-zinc-300'}`}
                    required
                    disabled={submitting}
                  />
                  {errors.sport && <p className="mt-1 text-sm text-red-600">{errors.sport}</p>}
                </div>
                <div>
                  <label htmlFor="squadSize" className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Squad Size (Total Athletes) *</label>
                  <input
                    id="squadSize"
                    name="squadSize"
                    type="text"
                    value={formData.squadSize}
                    onChange={handleChange}
                    placeholder="e.g., 45 athletes across 3 age groups"
                    className={`w-full px-4 py-3 rounded-lg border bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${errors.squadSize ? 'border-red-500' : 'border-zinc-300'}`}
                    required
                    disabled={submitting}
                  />
                  {errors.squadSize && <p className="mt-1 text-sm text-red-600">{errors.squadSize}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="biggestChallenge" className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Biggest Mental Performance Challenge *</label>
                <textarea
                  id="biggestChallenge"
                  name="biggestChallenge"
                  rows={4}
                  value={formData.biggestChallenge}
                  onChange={handleChange}
                  placeholder="Describe the specific situation where your athletes struggle most mentally (e.g., 'U16 team leads at halftime but loses focus in final 15 minutes...')"
                  className={`w-full px-4 py-3 rounded-lg border bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors resize-none ${errors.biggestChallenge ? 'border-red-500' : 'border-zinc-300'}`}
                  required
                  disabled={submitting}
                />
                {errors.biggestChallenge && <p className="mt-1 text-sm text-red-600">{errors.biggestChallenge}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Your Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@club.com"
                  className={`w-full px-4 py-3 rounded-lg border bg-white text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-500' : 'border-zinc-300'}`}
                  required
                  disabled={submitting}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-zinc-950 text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-black transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Request Free Assessment
                  </>
                )}
              </button>

              <p className="text-xs text-zinc-500 text-center">By submitting, you agree to be contacted about your assessment. No spam. <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a></p>
            </form>
          )}

          {/* Alternative CTA */}
          <div className="mt-10 pt-10 border-t border-zinc-200 text-center">
            <p className="text-zinc-600 text-sm mb-4">Prefer to start the conversation directly?</p>
            <a
              href="mailto:hello@thementalsport.com?subject=Club Assessment Request&body=Club name:%0AYour role:%0ASport:%0ASquad size:%0ABiggest mental performance challenge:"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-zinc-300 text-zinc-950 font-black uppercase tracking-[0.2em] text-sm hover:border-zinc-950 hover:bg-zinc-100 transition-colors rounded-lg"
            >
              <Mail className="w-4 h-4" />
              Email Us Directly
            </a>
            <p className="mt-4 text-zinc-500 text-sm">Or follow <a href="https://instagram.com/mentalsportpro" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">@mentalsportpro</a> on Instagram for weekly frameworks.</p>
          </div>
        </div>
      </section>

      <div className="py-8 px-6 text-center bg-zinc-100 border-t border-zinc-200">
        <Link href="/" className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-950 transition-colors">← TheMentalSport.com</Link>
      </div>
    </main>
  );
}