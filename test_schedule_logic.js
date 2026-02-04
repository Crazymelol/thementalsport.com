const now = new Date();
console.log("Current System Time:", now.toString());

const articles = [
    { title: "Intro Article (Today)", date: "2026-02-04" },
    { title: "Day 1 (Tomorrow)", date: "2026-02-05" },
    { title: "Day 2 (Future)", date: "2026-02-06" }
];

const published = articles.filter(article => {
    // Logic from blog.ts
    const articleDate = new Date(article.date);
    return articleDate <= now;
});

console.log("\n--- SIMULATION RESULTS ---");
console.log("Visible Articles:");
published.forEach(a => console.log(`[VISIBLE] ${a.title} (${a.date})`));

console.log("\nHidden Articles:");
articles
    .filter(a => !published.includes(a))
    .forEach(a => console.log(`[HIDDEN]  ${a.title} (${a.date})`));
