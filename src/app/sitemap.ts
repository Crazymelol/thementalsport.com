import { MetadataRoute } from 'next';
import { books } from '@/data/books';
import { getAllArticles } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://thementalsport.com';

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
        { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${baseUrl}/books`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
        { url: `${baseUrl}/course`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    ];

    const bookPages: MetadataRoute.Sitemap = books.map((book) => ({
        url: `${baseUrl}/book/${book.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
    }));

    const articles = getAllArticles();
    const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
        url: `${baseUrl}/blog/${article.slug}`,
        lastModified: new Date(article.date),
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    return [...staticRoutes, ...bookPages, ...articlePages];
}
