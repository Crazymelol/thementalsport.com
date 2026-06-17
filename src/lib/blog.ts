import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { books, Book } from '@/data/books';

const SERIES_SLUG_PREFIX = 'titans-protocol-day-';

const articlesDirectory = path.join(process.cwd(), 'src/content/articles');

export interface Article {
    slug: string;
    title: string;
    description: string;
    date: string;
    content: string;
    tags: string[];
}

export function getAllArticles(): Article[] {
    // specific check to prevent error if dir doesn't exist yet
    if (!fs.existsSync(articlesDirectory)) {
        return [];
    }

    const fileNames = fs.readdirSync(articlesDirectory);
    const allArticles = fileNames.map((fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(articlesDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
            slug,
            content,
            title: data.title,
            description: data.description,
            date: data.date,
            tags: data.tags || [],
        };
    });

    // Sort by date desc
    const now = new Date();
    // Reset time to midnight to ensure inclusive comparison if needed, 
    // or just compare strict timestamps. For creating a "daily release", 
    // simple comparison is usually enough.

    const publishedArticles = allArticles.filter(article => {
        const articleDate = new Date(article.date);
        return articleDate <= now;
    });

    return publishedArticles.sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1));
}

export function getArticleBySlug(slug: string): Article | null {
    try {
        const fullPath = path.join(articlesDirectory, `${slug}.md`);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
            slug,
            content,
            title: data.title,
            description: data.description,
            date: data.date,
            tags: data.tags || [],
        };
    } catch {
        return null;
    }
}

export function isSeriesArticle(article: Article): boolean {
    return article.slug.startsWith(SERIES_SLUG_PREFIX);
}

// The "Day N" number is parsed from the filename (guaranteed unique, 1-48),
// not from the title text, which has duplicate/inconsistent day labels.
export function getSeriesDayNumber(article: Article): number | null {
    const match = article.slug.match(/^titans-protocol-day-(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

export function getStandaloneArticles(): Article[] {
    return getAllArticles().filter((article) => !isSeriesArticle(article));
}

export function getSeriesArticles(): Article[] {
    return getAllArticles()
        .filter(isSeriesArticle)
        .sort((a, b) => (getSeriesDayNumber(a) ?? 0) - (getSeriesDayNumber(b) ?? 0));
}

export function pickBook(tags: string[]): Book {
    const t = tags.map((tag) => tag.toLowerCase());
    const has = (...keywords: string[]) =>
        keywords.some((k) => t.some((tag) => tag.includes(k)));

    if (has('adhd'))
        return books.find((b) => b.id === 'adhd-athletes-edge') ?? books[0];
    if (has('nutrition', 'diet', 'hydration', 'supplement', 'caffeine', 'creatine', 'physiology', 'metabolism', 'biohack', 'breathing', 'cortisol', 'cold plunge', 'sauna', 'sleep', 'recovery', 'neuroscience'))
        return books.find((b) => b.id === 'physiological-performance') ?? books[0];
    if (has('confidence', 'imposter', 'self-talk', 'affirmation', 'muhammad ali'))
        return books.find((b) => b.id === 'confidence-building') ?? books[0];
    if (has('identity', 'self-worth', 'purpose', 'legacy', 'nurtur'))
        return books.find((b) => b.id === 'nurturing-self-worth') ?? books[0];
    // Adult resilience/mental-toughness themes route to the adult book on the
    // topic (resilient-confidence) — "unbreakable" is a kids' picture book and
    // would be a mismatched recommendation for this content.
    if (has('resilience', 'mental tough', 'stoic', 'leadership', 'culture', 'teamwork', 'injury', 'rehab', 'burnout', 'longevity'))
        return books.find((b) => b.id === 'resilient-confidence') ?? books[0];
    if (has('anxiety', 'fear', 'mental block', 'pressure', 'mental health', 'failure'))
        return books.find((b) => b.id === 'mental-blocks') ?? books[0];

    return books.find((b) => b.id === 'the-competition-protocol') ?? books[0];
}
