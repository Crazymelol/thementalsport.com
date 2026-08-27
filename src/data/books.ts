export interface Book {
    id: string; // URL slug
    asin: string;
    // Gumroad product link (public /l/ permalink on notarasio.gumroad.com).
    // Replaces the old Shopify cart permalinks — checkout now runs on Gumroad.
    checkoutUrl?: string;
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
    category: 'athletes' | 'mindset' | 'parents-kids';
}

export const books: Book[] = [
    {
        id: "the-competition-protocol",
        asin: "B0GKF5TGMQ",
        checkoutUrl: "https://notarasio.gumroad.com/l/yfkgwv",
        title: "The Competition Protocol",
        subtitle: "The 7-day system for athletes who train well and tighten up on the day",
        description: "The week before a competition is where results are decided, and most athletes spend it getting more anxious. This is an hour-by-hour manual for those 7 days: gear, food, warm-up, sleep and the mental routine that makes competing feel routine instead of terrifying.",
        author: "Giannis Notaras",
        coverImage: "/covers/the-competition-protocol.png?v=3",
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
        price: "$17",
        category: "athletes"
    },
    {
        id: "mental-blocks",
        asin: "B0F87QX82W",
        checkoutUrl: "https://notarasio.gumroad.com/l/albwf",
        title: "Overcoming Mental Blocks",
        subtitle: "Great in practice, terrible in games? This is why, and how to fix it",
        description: "You can do it in training. Every time. Then the whistle goes and it leaves you. That is not weakness, it is a specific and well-documented brain event, and it has a fix. This book gives you the protocol instead of telling you to believe in yourself.",
        author: "Giannis Notaras",
        coverImage: "/covers/overcoming-mental-blocks.png?v=3",
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
        price: "$17",
        category: "mindset"
    },
    {
        id: "unbreakable",
        asin: "B0FBRXBBPK",
        checkoutUrl: "https://notarasio.gumroad.com/l/lazrca",
        title: "Unbreakable",
        subtitle: "A story for the child who falls apart after one mistake (ages 6-9)",
        description: "Some kids make one mistake and the rest of the day is gone. Climb Mental Toughness Mountain with Leo and Maya, a story that teaches children ages 6-9 how to turn worried thoughts around, calm themselves down, and keep going after they get it wrong.",
        author: "Giannis Notaras",
        coverImage: "/covers/unbreakable.png?v=3",
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
        price: "$12",
        category: "parents-kids"
    },
    {
        id: "confidence-building",
        asin: "B0F8CT8Z7M",
        checkoutUrl: "https://notarasio.gumroad.com/l/bknbwi",
        title: "Confidence-Building Workbook",
        subtitle: "For the athlete whose confidence disappears the moment it counts",
        description: "Confidence built on praise disappears the moment you lose. This is a workbook, not a pep talk: exercises that dismantle the beliefs holding you back and rebuild confidence on evidence you collect yourself, so it survives a bad day.",
        author: "Giannis Notaras",
        coverImage: "/covers/confidence-building.png?v=3",
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
        price: "$17",
        category: "mindset"
    },
    {
        id: "resilient-confidence",
        asin: "B0F87V8WRX",
        checkoutUrl: "https://notarasio.gumroad.com/l/jzzsp",
        title: "Unlocking Resilient Confidence",
        subtitle: "How to build confidence that doesn't vanish after a loss",
        description: "Most athletes ride their confidence up and down with their results. This is how to build the other kind: belief that holds when you are losing, when you are criticised, and when nothing is going your way.",
        author: "Giannis Notaras",
        coverImage: "/covers/resilient-confidence.png?v=3",
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
        price: "$17",
        category: "athletes"
    },
    {
        id: "nurturing-self-worth",
        asin: "B0F845R96L",
        checkoutUrl: "https://notarasio.gumroad.com/l/zkkptv",
        title: "Nurturing Self-Worth",
        subtitle: "For the parent whose kid is far too hard on himself",
        description: "If your child is harder on himself than any coach would be, the problem is not effort, it is where he thinks his value comes from. A parent's guide to raising a kid whose sense of worth is not attached to the scoreboard.",
        author: "Giannis Notaras",
        coverImage: "/covers/nurturing-self-worth.png?v=3",
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
        price: "$17",
        category: "parents-kids"
    },
    {
        id: "physiological-performance",
        asin: "B0F87P1H5Y",
        checkoutUrl: "https://notarasio.gumroad.com/l/ryzhc",
        title: "Physiological Peak Performance Blueprint",
        subtitle: "Why you fade when it matters, and how to train the systems that stop it",
        description: "Sometimes it is not your head, it is your physiology. A science-driven guide to the energy systems, breathing, and recovery that decide whether you fade in the last ten minutes or finish strong.",
        author: "Giannis Notaras",
        coverImage: "/covers/physiological-performance.png?v=3",
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
        price: "$17",
        category: "athletes"
    },
    {
        id: "adhd-athletes-edge",
        asin: "B0F85N8SBQ",
        checkoutUrl: "https://notarasio.gumroad.com/l/boced",
        title: "The ADHD Athlete's Edge",
        subtitle: "For the athlete whose brain will not switch off on game day",
        description: "Generic focus advice was not written for your brain. A practical guide for athletes with ADHD: routines that work with how you actually think, ways to handle game-day overwhelm, and how to turn the restlessness into an advantage.",
        author: "Giannis Notaras",
        coverImage: "/covers/adhd-athletes-edge.png?v=3",
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
        price: "$17",
        category: "athletes"
    }
];
