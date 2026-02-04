import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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
