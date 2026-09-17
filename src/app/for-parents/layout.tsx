import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Mental Performance for Parents | The Mental Sport',
  description: 'Practical mental-performance tools for parents supporting young athletes through pressure, setbacks, confidence, and competition. Get the free "What to Say When Your Kid Chokes" guide.',
  keywords: ['sports parents', 'mental performance for young athletes', 'youth sports anxiety', 'help child confidence in sports', 'parent guide sports psychology'],
  openGraph: {
    title: 'Support the Athlete. Protect the Person. | The Mental Sport',
    description: 'Practical tools to help your child handle nerves, mistakes, confidence swings, and the pressure to perform.',
    type: 'website',
  },
};

export default function ForParentsLayout({ children }: { children: ReactNode }) {
  return children;
}