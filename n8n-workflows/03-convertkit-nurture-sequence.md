# ConvertKit 7-Email Nurture Sequence Setup Guide

## Overview
This sequence fires when someone subscribes (tagged as `lead-magnet-free-chapter`).
It warms them up over 14 days and drives them to buy books on Amazon.

Set this up manually in ConvertKit → Automations → New Automation.

---

## Trigger
**Tag added:** `lead-magnet-free-chapter`

---

## Email Sequence

### Email 1 — Immediately after sign-up
**Subject:** Your free chapter is here
**Body:**
Hey [First Name],

Here's the first chapter of The Competition Protocol — the 7-day pre-event mental system used by elite athletes.

[ATTACH PDF or link to Google Drive]

One thing to know about me: everything I teach is field-tested. Not theory. Not motivational fluff.

Tomorrow I'll share the single biggest mistake athletes make the week before a competition.

— Giannis

---

### Email 2 — Day 2
**Subject:** The mistake that costs athletes their best performances

Most athletes grind harder the week before competition. That's sabotage — your nervous system needs 72 hours of reduced load to peak. The Competition Protocol's T-Minus 7 checklist fixes this.

→ Get The Competition Protocol ($9.99): https://www.amazon.com/dp/B0GKF5TGMQ

---

### Email 3 — Day 4
**Subject:** Why your confidence collapses under pressure

Confidence is a skill, not a feeling. It's built through deliberate reps. Unlocking Resilient Confidence is the system I use with professional athletes.

→ Get it on Amazon ($9.99): https://www.amazon.com/dp/B0F87V8WRX

---

### Email 4 — Day 7
**Subject:** The mental block no one talks about

Mental blocks are unprocessed fear in your nervous system. Overcoming Mental Blocks gives you the framework to identify and dismantle yours.

→ Get it on Amazon ($9.99): https://www.amazon.com/dp/B0F87QX82W

---

### Email 5 — Day 9
**Subject:** For the parents and coaches reading this

Nurturing Self-Worth gives parents and educators a step-by-step system for building genuine self-esteem in kids — the kind that holds under competitive pressure.

→ Get it on Amazon ($9.99): https://www.amazon.com/dp/B0F845R96L

---

### Email 6 — Day 12
**Subject:** The physiology of peak performance

Your nervous system, sleep architecture, and nutrition timing directly affect mental sharpness on game day. The Physiological Peak Performance Blueprint connects those dots.

→ Get it on Amazon ($14.99): https://www.amazon.com/dp/B0F87P1H5Y

---

### Email 7 — Day 14
**Subject:** Everything I've built for you

📘 The Competition Protocol ($9.99) → amazon.com/dp/B0GKF5TGMQ
📘 Overcoming Mental Blocks ($9.99) → amazon.com/dp/B0F87QX82W
📘 Unlocking Resilient Confidence ($9.99) → amazon.com/dp/B0F87V8WRX
📘 Confidence-Building Workbook ($12.99) → amazon.com/dp/B0F8CT8Z7M
📘 ADHD Athlete's Edge ($14.99) → amazon.com/dp/B0F85N8SBQ
📘 Physiological Blueprint ($14.99) → amazon.com/dp/B0F87P1H5Y
📘 Nurturing Self-Worth ($9.99) → amazon.com/dp/B0F845R96L
📗 Unbreakable ($6.99) → amazon.com/dp/B0FBRXBBPK

**Want all 8 in one go?** Get the complete library for $67 (vs $131 buying separately): https://thementalsport.com/products/the-complete-mental-performance-library-all-8-books — first order? Code **WELCOME15** takes another 15% off.

**Or go all-in on coaching:** The Mental Performance Protocol course — Standard, Premium, or Elite tiers: https://thementalsport.com/course

Reply and tell me which one you picked. I read every reply.

— Giannis

---

## ConvertKit Setup Steps

1. Go to **Automations → New Automation**
2. Set trigger: **Tag Added → lead-magnet-free-chapter**
3. Add each email with the delays above
4. Set emails to send at **10am in subscriber's timezone**
5. After Email 7, add tag: **nurture-sequence-complete**
6. Activate the automation

## After the sequence
Send 1 broadcast per week (Tuesday) with a new blog article excerpt + book recommendation.
Use n8n workflow 02 to auto-generate the social content.
