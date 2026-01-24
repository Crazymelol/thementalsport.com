import { MetadataRoute } from 'next';
import { books } from '@/data/books';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://thementalsport.com';

    // Homepage
    const routes = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 1,
        },
    ];

    // Book pages
    const bookPages = books.map((book) => ({
        url: `${baseUrl}/book/${book.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    return [...routes, ...bookPages];
}
