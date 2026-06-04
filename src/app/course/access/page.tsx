import { Metadata } from 'next';
import AccessClient from './AccessClient';

export const metadata: Metadata = {
    title: 'Course Access | The Mental Performance Protocol',
    robots: { index: false, follow: false },
};

export default function CourseAccessPage() {
    return <AccessClient />;
}
