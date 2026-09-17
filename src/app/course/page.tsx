import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'The Mental Performance Protocol | The Mental Sport',
  description: 'Redirecting to the Mental Performance Protocol...',
};

export default function CoursePage() {
  redirect('/protocol');
}