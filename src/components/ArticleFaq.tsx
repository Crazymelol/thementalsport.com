import { FaqItem } from '@/lib/blog';

// Visible FAQ accordion rendered at the foot of an article. The same Q&A pairs
// are emitted as FAQPage JSON-LD by ArticleSchema; Google requires the schema
// to match content the reader can actually see, so this must stay in sync.
// Uses the native <details> element so it needs no client-side JavaScript.

export default function ArticleFaq({ items, accent }: { items: FaqItem[]; accent: string }) {
    if (!items || items.length === 0) return null;

    return (
        <section className="mt-16 pt-12 border-t border-zinc-200">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8">
                Frequently Asked Questions
            </h2>
            <div className="space-y-3">
                {items.map((item, i) => (
                    <details key={i} className="group border border-zinc-200 open:border-zinc-400 transition-colors">
                        <summary className="cursor-pointer list-none flex items-start justify-between gap-4 p-5 font-bold text-zinc-900 hover:bg-zinc-50">
                            <span>{item.q}</span>
                            <span
                                className="text-2xl leading-none shrink-0 transition-transform duration-200 group-open:rotate-45"
                                style={{ color: accent }}
                                aria-hidden="true"
                            >
                                +
                            </span>
                        </summary>
                        <div className="px-5 pb-5 -mt-1 text-zinc-600 leading-relaxed">
                            {item.a}
                        </div>
                    </details>
                ))}
            </div>
        </section>
    );
}
