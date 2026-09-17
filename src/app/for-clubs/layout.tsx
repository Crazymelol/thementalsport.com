import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Mental Conditioning for Sports Clubs & Academies | The Mental Sport',
  description: 'Done-for-you mental conditioning programs for competitive sports clubs and academies. Reduce choking, build pressure-proof athletes, and win the moments that matter. Request a free diagnostic.',
  keywords: ['sports club mental conditioning', 'academy mental performance', 'team sports psychology', 'club mental training program', 'athlete mental skills coaching'],
  openGraph: {
    title: 'Mental Conditioning for Sports Clubs & Academies | The Mental Sport',
    description: 'Done-for-you mental conditioning programs for competitive sports clubs and academies. Integrated into your existing training calendar.',
    type: 'website',
  },
};

export default function ForClubsLayout({ children }: { children: ReactNode }) {
  return children;
}