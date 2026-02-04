const fs = require('fs');
const path = require('path');

const inputFile = 'c:\\Users\\user\\Desktop\\thementalsport.com\\drafts\\Elite_Athletes_Pregame_Stress\\Elite_Athletes_Pregame_Stress_Master.md';
const outputFile = 'c:\\Users\\user\\Desktop\\thementalsport.com\\drafts\\Elite_Athletes_Pregame_Stress\\Titans_Mindset_KDP.html';

const markdown = fs.readFileSync(inputFile, 'utf8');

// Basic Markdown Parser for KDP
let html = markdown
    // Headers
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    // Bold/Italic
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Images (Handle absolute Windows paths for local viewing)
    .replace(/!\[(.*?)\]\((.*?)\)/gim, (match, alt, src) => {
        // Ensure browser can read local file if possible, or just leave as absolute
        return `<div class="image-container"><img src="${src}" alt="${alt}"></div>`;
    })
    // Horizontal Rules -> Page Break
    .replace(/^---$/gim, '<div class="page-break"></div>')
    // Lists (Simple implementation)
    .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/<\/ul>\n<ul>/gim, '') // Merge adjacent lists
    // Paragraphs (Lines separated by empty lines)
    .replace(/\n\n/gim, '</p><p>')
    // Fix start/end
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');

// Wrap in Boilerplate
const finalHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Titan's Mindset</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Montserrat:wght@700&display=swap');

        @page {
            size: 6in 9in;
            margin: 0.75in 0.6in 0.75in 0.9in; /* Gutter on left */
        }
        
        body {
            font-family: 'Crimson Pro', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #111;
            margin: 40px auto;
            max-width: 800px; /* For screen reading */
        }

        /* Screen specific overrides to mimic paper */
        @media screen {
            body {
                background: #f5f5f5;
                padding: 40px;
            }
            .page {
                background: white;
                width: 6in;
                min-height: 9in;
                padding: 1in;
                margin: 20px auto;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
        }

        h1 {
            font-family: 'Montserrat', sans-serif;
            font-size: 28pt;
            text-transform: uppercase;
            text-align: right;
            margin-top: 2in;
            margin-bottom: 0.5in;
            page-break-before: always;
            border-bottom: 3px solid #000;
        }

        h2 {
            font-family: 'Montserrat', sans-serif;
            font-size: 16pt;
            margin-top: 1.5em;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        
        h3 {
            font-family: 'Montserrat', sans-serif;
            font-size: 13pt;
            margin-top: 1.5em;
            color: #444;
        }

        p {
            margin-bottom: 1em;
            text-align: justify;
        }

        .image-container {
            text-align: center;
            margin: 2em 0;
        }

        img {
            max-width: 100%;
            height: auto;
            border: 1px solid #eee;
        }

        .page-break {
            page-break-after: always;
            border: 0;
            margin: 0;
            padding: 0;
            height: 0;
            visibility: hidden;
        }
        
        /* Specific tweaks for Cover */
        h1:first-of-type {
            margin-top: 0;
            text-align: center;
            border: none;
        }
        
        ul {
            margin-left: 1.5em;
        }
    </style>
</head>
<body>
    ${html}
</body>
</html>
`;

fs.writeFileSync(outputFile, finalHtml);
console.log('HTML generated at: ' + outputFile);
