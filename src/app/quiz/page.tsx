import type { Metadata } from 'next';
import MentalGameQuiz from '@/components/MentalGameQuiz';

export const metadata: Metadata = {
    title: "What's Your Mental Game Score? Free 2-Minute Athlete Quiz",
    description: 'Score your mental game across nerves, focus, confidence, and recovery. Find the one weak spot costing you games and get a free personalized plan to fix it.',
    keywords: ['mental game quiz', 'sports psychology quiz', 'mental toughness test', 'athlete mindset assessment'],
    alternates: { canonical: 'https://thementalsport.com/quiz' },
    openGraph: {
        type: 'website',
        url: 'https://thementalsport.com/quiz',
        title: "What's Your Mental Game Score?",
        description: 'Score your mind across nerves, focus, confidence, and recovery in 2 minutes. Find your weak spot and how to fix it.',
        siteName: 'The Mental Sport',
    },
};

export default function QuizPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white py-24 lg:py-32 px-6">
            <MentalGameQuiz />
        </main>
    );
}
