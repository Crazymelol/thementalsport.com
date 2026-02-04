const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const dir = path.join(__dirname, 'src/content/articles');
const files = fs.readdirSync(dir).filter(f => f.startsWith('titans-protocol-day-'));

// Sort files to ensure Day 1, Day 2, etc. order
files.sort();

let currentDate = new Date('2026-02-04'); // Start Day 1 today

files.forEach(file => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const doc = matter(content);

    // Format YYYY-MM-DD
    const dateStr = currentDate.toISOString().split('T')[0];

    doc.data.date = dateStr;
    console.log(`Updating ${file} to ${dateStr}`);

    const newContent = matter.stringify(doc.content, doc.data);

    // Preserve the original formatting style if matter.stringify changes it too much? 
    // actually matter.stringify is fine, but sometimes it adds excessive newlines.
    // Let's just do a regex replace for the date line to be surgical if possible, 
    // or trust matter.stringify. 
    // Given the files are simple, matter.stringify is safe but let's be careful with quotes.
    // simpler: regex replace the date line.

    const lines = content.split('\n');
    const newLines = lines.map(line => {
        if (line.trim().startsWith('date:')) {
            return `date: "${dateStr}"`;
        }
        return line;
    });

    fs.writeFileSync(filePath, newLines.join('\n'));

    // Increment date
    currentDate.setDate(currentDate.getDate() + 1);
});
