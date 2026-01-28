export interface Book {
    id: string; // URL slug
    asin: string;
    title: string;
    subtitle: string;
    description: string;
    coverImage: string; // URL or placeholder path
    author: string;
    features: string[];
    reviews: {
        quote: string;
        author: string;
        role: string;
    }[];
    palette: {
        primary: string; // Main accent color
        secondary: string;
    };
    price: string;
}

export const books: Book[] = [
    {
        id: "the-competition-protocol",
        asin: "COMING_SOON",
        title: "The Competition Protocol",
        subtitle: "A Step-by-Step Guide to Getting the Best of You",
        description: "Master the art of preparation. This book is a manual for the 7 days leading up to your event, teaching you how to build rituals and standard procedures that automate excellence and eliminate anxiety.",
        author: "Giannis Notaras",
        coverImage: "/covers/the-competition-protocol.jpg", // Final Cover
        features: [
            "The T-Minus 7 Day countdown checklist",
            "How to build an 'Anchor' to trigger flow state instantly",
            "SOPs for gear check, nutrition, and warm-up",
            "Visualizing the win: A structured protocol"
        ],
        reviews: [
            {
                quote: "I used to panic before every race. The protocols in this book gave me a system to trust. Now I just execute.",
                author: "Beta Reader",
                role: "Triathlete"
            }
        ],
        palette: {
            primary: "#dc2626", // Red-600 (Intense)
            secondary: "#1c1917" // Stone-900
        },
        price: "$19.99"
    },
    {
        id: "mental-blocks",
        asin: "B0F87QX82W",
        title: "Overcoming Mental Blocks",
        subtitle: "A Guide to Peak Performance",
        description: "Your roadmap to silencing inner critics, mastering your mindset, and unlocking the unstoppable version of YOU.",
        author: "Giannis Notaras",
        coverImage: "/covers/overcoming-mental-blocks.png",
        features: [
            "Identify and dismantle mental barriers holding you back.",
            "Tame performance anxiety with proven techniques.",
            "Build unshakable mental resilience.",
            "Create a personalized plan for consistent peak performance."
        ],
        reviews: [
            {
                quote: "A lifeline for anyone striving to excel. It isn't a quick fix; it's a lifelong toolkit.",
                author: "Sarah M.",
                role: "Competitive Athlete"
            },
            {
                quote: "This book helped me break through the mental barriers that were holding me back. The practical exercises are game-changers!",
                author: "Michael R.",
                role: "Business Executive"
            },
            {
                quote: "Finally, a book that addresses the mental game with real, actionable strategies. Highly recommend!",
                author: "Jennifer K.",
                role: "Performance Coach"
            }
        ],
        palette: {
            primary: "#d97706", // Amber-600
            secondary: "#1c1917" // Stone-900
        },
        price: "$9.99"
    },
    {
        id: "unbreakable",
        asin: "B0FBRXBBPK",
        title: "Unbreakable",
        subtitle: "Leo and Maya's Mental Toughness Adventure",
        description: "Climb Mental Toughness Mountain with Leo and Maya! A powerful and playful journey that teaches children ages 6–9 how to stay strong on the inside—even when life gets tough.",
        author: "Giannis Notaras",
        coverImage: "/covers/unbreakable.png",
        features: [
            "Turn worried thoughts into helpful ones",
            "Stay calm using balloon breaths",
            "Learn from mistakes and keep going",
            "Use 'yet' to build a growth mindset"
        ],
        reviews: [
            {
                quote: "My 7-year-old loves Leo and Maya! This book taught her how to handle disappointment in sports.",
                author: "Parent Review",
                role: "Amazon Verified Purchase"
            },
            {
                quote: "Perfect for teaching kids resilience. The balloon breathing technique works wonders!",
                author: "Teacher Review",
                role: "Elementary School Teacher"
            }
        ],
        palette: { primary: "#0ea5e9", secondary: "#1c1917" },
        price: "$6.99"
    },
    {
        id: "confidence-building",
        asin: "B0F8CT8Z7M",
        title: "Confidence-Building Workbook",
        subtitle: "Overcome Self-Doubt and Cultivate Unshakable Self-Assurance",
        description: "This hands-on, step-by-step guide helps you dismantle limiting beliefs, conquer fear, and build resilient confidence. Packed with actionable exercises, reflective prompts, and science-backed strategies.",
        author: "Giannis Notaras",
        coverImage: "/covers/confidence-building.png",
        features: [
            "Identify and challenge barriers like negative self-talk and fear of judgment",
            "Set SMART goals tailored to your confidence journey",
            "Master practical tools including positive affirmations and visualization",
            "Build a support network to sustain your growth"
        ],
        reviews: [
            {
                quote: "The exercises in this workbook transformed my self-doubt into genuine confidence. Worth every penny!",
                author: "Alex T.",
                role: "Entrepreneur"
            },
            {
                quote: "Practical, science-backed, and easy to follow. This workbook is a must-have for anyone struggling with confidence.",
                author: "Rachel P.",
                role: "Marketing Professional"
            }
        ],
        palette: { primary: "#22c55e", secondary: "#1c1917" },
        price: "$12.99"
    },
    {
        id: "resilient-confidence",
        asin: "B0F87V8WRX",
        title: "Unlocking Resilient Confidence",
        subtitle: "The Key to Consistent High Performance",
        description: "A definitive guide to building an unshakable mindset that thrives under pressure, transforms adversity into advantage, and fuels excellence in sports, business, and life.",
        author: "Giannis Notaras",
        coverImage: "/covers/resilient-confidence.png",
        features: [
            "Replace fleeting confidence with deep, intrinsic belief in your abilities",
            "Master mental strategies like visualization and the 'Give Your Best' philosophy",
            "Turn criticism and setbacks into catalysts for growth",
            "Thrive in high-pressure environments with grace and grit"
        ],
        reviews: [
            {
                quote: "This book gave me the mental tools to perform under pressure. A must-read for anyone in competitive environments.",
                author: "David L.",
                role: "Professional Athlete"
            },
            {
                quote: "The 'Give Your Best' philosophy changed how I approach challenges. Incredible insights!",
                author: "Emma S.",
                role: "Sales Director"
            }
        ],
        palette: { primary: "#eab308", secondary: "#1c1917" },
        price: "$9.99"
    },
    {
        id: "nurturing-self-worth",
        asin: "B0F845R96L",
        title: "Nurturing Self-Worth",
        subtitle: "The Complete Parent's Guide to Building Healthy Self-Esteem in Children",
        description: "A comprehensive guide for parents and educators to raise children who believe in themselves, handle setbacks with strength, and thrive socially and academically.",
        author: "Giannis Notaras",
        coverImage: "/covers/nurturing-self-worth.png",
        features: [
            "Understand the psychology behind self-esteem development",
            "Everyday strategies to encourage healthy self-talk and emotional intelligence",
            "Guidance on handling criticism, comparison, and perfectionism",
            "Build resilience through failure and learning 'the power of yet'"
        ],
        reviews: [
            {
                quote: "As a parent, this book gave me the confidence to help my child build genuine self-esteem. Highly practical!",
                author: "Patricia W.",
                role: "Parent & Educator"
            },
            {
                quote: "The strategies in this book are backed by research and easy to implement. My students have benefited tremendously.",
                author: "Mark T.",
                role: "School Counselor"
            }
        ],
        palette: { primary: "#ef4444", secondary: "#1c1917" },
        price: "$9.99"
    },
    {
        id: "physiological-performance",
        asin: "B0F87P1H5Y",
        title: "Physiological Peak Performance Blueprint",
        subtitle: "Unlock Your Body's Full Potential: The Science-Driven Guide to Optimizing Physical Performance",
        description: "Dives deep into the science of human physiology, offering a roadmap to harness your body's innate systems for unparalleled strength, endurance, and efficiency.",
        author: "Giannis Notaras",
        coverImage: "/covers/physiological-performance.png",
        features: [
            "Optimize energy systems for explosive power or endurance",
            "Enhance cardiovascular and respiratory efficiency",
            "Master neuromuscular adaptations for strength and precision",
            "Apply physiology-backed strategies to real-world training"
        ],
        reviews: [
            {
                quote: "The science in this book is incredible. It helped me optimize my training and see real results!",
                author: "Carlos M.",
                role: "Endurance Athlete"
            },
            {
                quote: "Finally, a book that explains the 'why' behind performance training. Game-changing for coaches!",
                author: "Dr. Lisa H.",
                role: "Sports Physiologist"
            }
        ],
        palette: { primary: "#8b5cf6", secondary: "#1c1917" },
        price: "$14.99"
    },
    {
        id: "adhd-athletes-edge",
        asin: "B0F85N8SBQ",
        title: "The ADHD Athlete's Edge",
        subtitle: "Turn Your Distraction Into Domination with Daily Routines Designed to Channel Hyperactivity into Peak Performance",
        description: "A practical and motivating guide for athletes with ADHD to unlock their full potential by learning how to train with their brain rather than fighting it.",
        author: "Giannis Notaras",
        coverImage: "/covers/adhd-athletes-edge.png",
        features: [
            "Build mental focus and reduce game-day distractions",
            "Step-by-step tools for managing emotional overwhelm",
            "Design routines that actually work for an ADHD brain",
            "Nutrition and recovery strategies tailored for neurodiverse athletes"
        ],
        reviews: [
            {
                quote: "As an athlete with ADHD, this book gave me the tools to turn my 'weakness' into my greatest strength!",
                author: "Tyler J.",
                role: "College Athlete"
            },
            {
                quote: "The routines in this book are specifically designed for how my brain works. Finally, something that makes sense!",
                author: "Megan R.",
                role: "Track & Field Competitor"
            }
        ],
        palette: { primary: "#ec4899", secondary: "#1c1917" },
        price: "$14.99"
    }
];
