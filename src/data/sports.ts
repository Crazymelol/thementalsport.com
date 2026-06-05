export interface SportData {
    slug: string;
    name: string;
    headline: string;
    subheadline: string;
    description: string;
    uniqueChallenge: string;
    challengeDetail: string;
    techniques: { title: string; description: string }[];
    athletes: { name: string; lesson: string }[];
    bookId: string;
    metaTitle: string;
    metaDescription: string;
    tags: string[];
}

export const sports: SportData[] = [
    {
        slug: 'swimming',
        name: 'Swimming',
        headline: 'Mental Performance for Swimmers',
        subheadline: 'The psychological edge that separates good swimmers from elite ones',
        description: 'Swimming is one of the most mentally demanding sports in the world. Isolated in water, unable to hear your coach, racing against a clock — every race is won or lost in the mind before the body hits the water.',
        uniqueChallenge: 'The Isolation Problem',
        challengeDetail: 'Unlike team sports, swimmers have zero external feedback during a race. No coach, no teammates, no crowd noise — just you, your breath, and the black line. Elite swimmers train their internal monologue as rigorously as their stroke mechanics.',
        techniques: [
            {
                title: 'The Black Line Anchor',
                description: 'Use the lane line as a physical anchor for your mental process. Every time your eyes track it, trigger a breath reset and a single-word cue ("smooth", "power", "attack"). This links external stimulus to internal state — making focus automatic rather than effortful.'
            },
            {
                title: 'Split-Target Visualization',
                description: 'Elite swimmers don\'t visualize "winning." They visualize their 50m splits — tactile sensations at the turn, stroke rate in the back half, the wall approach. Specific process visualization outperforms outcome visualization by 40% in controlled studies.'
            },
            {
                title: 'Pre-Race Isolation Protocol',
                description: 'The 8 minutes before you step on the block are critical. Headphones, no eye contact, controlled breathing. Build a ritual that triggers your competitive state without burning cortisol. Most swimmers waste this window in conversation.'
            },
            {
                title: 'The False Start Recovery',
                description: 'False starts, lane violations, disqualification threats — swimming has more chaos triggers per race than most sports. Elite swimmers practice psychological recovery drills: stop the emotional spiral in under 10 seconds using a physical reset (jaw clench → release, fist → open hand).'
            }
        ],
        athletes: [
            { name: 'Michael Phelps', lesson: 'Phelps used visualization so specifically he could describe every sensation of a perfect race — including what it felt like when his goggles filled with water, and how he\'d finish anyway. He visualized failure scenarios and his response to them, not just perfect performances.' },
            { name: 'Katie Ledecky', lesson: 'Ledecky\'s self-talk during races is process-focused, not outcome-focused. Her mental cue system focuses on stroke mechanics at each 50m mark — her mind never drifts to time or competitors.' },
            { name: 'Ryan Lochte', lesson: 'Lochte has spoken about his pre-race tunnel — a complete sensory shutdown where external stimuli are eliminated. He doesn\'t listen to music or talk to anyone in the 30 minutes before a major final.' }
        ],
        bookId: 'the-competition-protocol',
        metaTitle: 'Mental Performance for Swimmers | Sports Psychology & Training',
        metaDescription: 'Build the mental edge elite swimmers use before every race. Visualization, self-talk, pre-race routines, and psychological recovery techniques.',
        tags: ['swimming', 'mental performance', 'sports psychology', 'Michael Phelps', 'visualization']
    },
    {
        slug: 'basketball',
        name: 'Basketball',
        headline: 'Mental Performance for Basketball Players',
        subheadline: 'How elite players stay locked in when the game is on the line',
        description: 'Basketball is a game of momentum, and momentum is 90% psychological. Every possession can shift the energy of an entire game. The players who dominate aren\'t always the most talented — they\'re the ones who control their mental state when pressure peaks.',
        uniqueChallenge: 'The Momentum Trap',
        challengeDetail: 'Basketball\'s pace creates constant psychological swings. A 10-0 run can shake the most prepared team. Elite players develop "emotional neutrality" — a trained ability to treat a three-pointer and a turnover with the same internal response. Not cold. Neutral. Present.',
        techniques: [
            {
                title: 'The Goldfish Memory',
                description: 'After a bad play — turnover, missed free throw, blown defensive assignment — elite players develop a 3-second emotional processing window. Feel it, flush it, reset. The players who dwell cost their team the next two possessions. Practice this in training: intentionally make mistakes and practice your 3-second recovery.'
            },
            {
                title: 'Free Throw Ritual Locking',
                description: 'The free throw is pure psychology — no defense, no time pressure, just you and the basket. Every elite shooter has an identical routine (bounces, breath, visualization) that hasn\'t changed in years. The routine activates the same neural pathways that fired during thousands of made free throws in practice.'
            },
            {
                title: 'The Defensive Possession Reset',
                description: 'After a made basket against you, there\'s a walk back to the defensive end. Elite defenders use this as a reset window: one breath, one cue word ("lock", "compete", "now"), then full presence. Most players use this time to replay what went wrong.'
            },
            {
                title: 'Crunch-Time State Management',
                description: 'In the final 2 minutes of a close game, cortisol spikes and fine motor skills degrade. Elite players counteract this with controlled diaphragmatic breathing during timeouts and dead balls, keeping heart rate manageable and maintaining shooting mechanics under pressure.'
            }
        ],
        athletes: [
            { name: 'Kobe Bryant', lesson: 'Bryant\'s Mamba Mentality wasn\'t about intensity — it was about process neutrality. He treated every shot the same whether it was the first of a blowout or the last in the finals. His pre-shot routine was identical regardless of stakes, creating a consistent neural pathway to his best mechanics.' },
            { name: 'LeBron James', lesson: 'LeBron has spoken publicly about meditation and mindfulness practice since 2012. He uses pre-game breathing routines and credits mental clarity for his ability to make decisions at game speed under maximum pressure.' },
            { name: 'Stephen Curry', lesson: 'Curry\'s pre-game warmup is famous for its specificity and consistency — it never changes. This isn\'t superstition; it\'s state induction. The same routine triggers the same mental state, and that state is peak shooting performance.' }
        ],
        bookId: 'the-competition-protocol',
        metaTitle: 'Mental Performance for Basketball Players | Mindset & Focus Training',
        metaDescription: 'Develop the mental game of elite basketball players. Free throw psychology, momentum control, crunch-time focus, and emotional recovery techniques.',
        tags: ['basketball', 'mental performance', 'Kobe Bryant', 'LeBron James', 'focus', 'sports psychology']
    },
    {
        slug: 'tennis',
        name: 'Tennis',
        headline: 'Mental Performance for Tennis Players',
        subheadline: 'Win the points between the points — where tennis matches are actually decided',
        description: 'Tennis is the sport where mental performance is most visibly decisive. Matches are decided by micro-moments between points — the 20-second window where a player either controls their state or surrenders to it. Djokovic, Nadal, and Federer are masters of this window.',
        uniqueChallenge: 'The Between-Point Battle',
        challengeDetail: 'Research shows that 70% of a tennis match is the time between points. The actual ball-in-play duration is a fraction of total match time. Yet most players spend their training time exclusively on stroke mechanics and zero time training the between-point mental process. This is the biggest leverage point in tennis psychology.',
        techniques: [
            {
                title: 'The 20-Second Protocol',
                description: 'Elite players use the 20 seconds between points as a structured reset: (1) Physical release — shake out hands, adjust grip, take a step back. (2) Breath — one slow exhale through the mouth. (3) Cue — one technical word for the next point. (4) Engage. This turns the gap from a liability into an advantage.'
            },
            {
                title: 'Serve Routine Anchoring',
                description: 'Your pre-serve routine is your most controllable mental tool. Nadal\'s ball bouncing, Djokovic\'s toe-touching, Federer\'s hair adjustment — these aren\'t habits. They\'re state triggers. Build your routine in practice, never change it under pressure, and let it fire your optimal serving state automatically.'
            },
            {
                title: 'Scoreboard Blindness',
                description: 'The scoreboard is a distraction from the present point. Elite players train themselves to see the score as data, not narrative. "40-love up" and "40-love down" should trigger the same internal process: this point, this ball, this moment. Practice playing training sets without tracking score to build this skill.'
            },
            {
                title: 'Error Response Training',
                description: 'Unforced errors trigger emotional responses that affect the next 3-5 points. Build an error response ritual: walk to the back fence, take one breath, decide the tactical adjustment, turn and compete. This 10-second process prevents the double-fault cascade pattern that kills sets.'
            }
        ],
        athletes: [
            { name: 'Novak Djokovic', lesson: 'Djokovic credits meditation and mindfulness for his late-career dominance. His between-point routines are the most studied in tennis psychology. His ability to maintain emotional neutrality while reading crowd energy as a competitor rather than a threat is documented in his book "Serve to Win."' },
            { name: 'Rafael Nadal', lesson: 'Nadal\'s rituals are obsessively consistent — water bottle placement, ball bouncing count, ear-touching sequence. This isn\'t OCD; it\'s state management. Each ritual step primes the same neural circuit, and that circuit fires his best tennis.' },
            { name: 'Serena Williams', lesson: 'Williams has publicly discussed using affirmations and positive self-talk throughout matches. Her famous fist pumps after key points are deliberate state-elevation tools, not just celebration — they flood the body with dopamine and testosterone before the next point.' }
        ],
        bookId: 'the-competition-protocol',
        metaTitle: 'Mental Performance for Tennis Players | Between-Point Psychology',
        metaDescription: 'Master the 20-second window between points where tennis matches are won. Routines, self-talk, error recovery, and focus techniques from elite tennis psychology.',
        tags: ['tennis', 'mental performance', 'Djokovic', 'Nadal', 'sports psychology', 'focus']
    },
    {
        slug: 'running',
        name: 'Running',
        headline: 'Mental Performance for Runners',
        subheadline: 'The psychological tools that break barriers and beat the wall',
        description: 'Running is where physical limits and mental limits collide most visibly. Every runner has experienced the wall — the moment where the body says stop and only the mind can keep moving. The difference between runners who break through and those who don\'t is almost entirely psychological.',
        uniqueChallenge: 'The Internal Monologue War',
        challengeDetail: 'Studies show runners\' internal self-talk directly predicts performance more than VO2 max at equivalent fitness levels. When the suffering peaks, the brain generates an automatic distress narrative. Elite runners have replaced this with a trained alternative script — not motivational platitudes, but specific technical instructions that redirect attention from pain to process.',
        techniques: [
            {
                title: 'Dissociation vs Association Strategy',
                description: 'Elite long-distance runners use association (focusing inward on form, breathing, cadence) to optimize performance and dissociation (redirecting attention outward to scenery, other runners) to manage suffering. Knowing when to switch — typically association from mile 1 to mile threshold, then flexible — is a trainable skill.'
            },
            {
                title: 'The Segmentation Method',
                description: 'Breaking a marathon into 4 × 10km psychological blocks makes the undertaking feel manageable. Elite runners don\'t run 42km — they run "to the 10km mark, then re-evaluate." Each segment gets a specific mental cue. The full race isn\'t confronted until the final segment.'
            },
            {
                title: 'Pain Reframing Protocol',
                description: 'Research at Canterbury Christ Church University found that runners using positive self-talk during maximal effort tests endured 18% longer than controls. The language matters: "This burn means I\'m getting faster" outperforms "Push through." Reframe pain as signal, not enemy.'
            },
            {
                title: 'Race-Day Simulation Training',
                description: 'Practice suffering. One training run per month should involve deliberately inducing the mental state of a hard race — the doubt, the physical discomfort, the desire to quit — and practicing your response. Mental skills learned only in comfort fail under competition pressure.'
            }
        ],
        athletes: [
            { name: 'Eliud Kipchoge', lesson: 'Kipchoge famously says "No human is limited." This isn\'t motivational language — it\'s his operational belief system. He has described his internal monologue as almost completely calm during races that would be existentially painful for other athletes. His training program explicitly includes mental performance work.' },
            { name: 'David Goggins', lesson: 'Goggins developed the "40% Rule" — the idea that when your mind says stop, you\'re typically at 40% of actual capacity. He trains his mind to access the remaining 60% through deliberate suffering practice and internal negotiation techniques.' },
            { name: 'Shalane Flanagan', lesson: 'Flanagan used visualization and mantras extensively. Before her 2017 NYC Marathon win, she had mentally run every mile of the course hundreds of times. Her pre-race ritual was the same for every race regardless of stakes.' }
        ],
        bookId: 'the-competition-protocol',
        metaTitle: 'Mental Performance for Runners | Training the Mind to Break Barriers',
        metaDescription: 'Master the psychology of running — beat the wall, control your internal monologue, and perform under pressure. Science-backed techniques for all distances.',
        tags: ['running', 'mental performance', 'marathon', 'Eliud Kipchoge', 'sports psychology', 'endurance']
    },
    {
        slug: 'boxing',
        name: 'Boxing',
        headline: 'Mental Performance for Boxers',
        subheadline: 'Fight psychology: control fear, manage adrenaline, dominate under pressure',
        description: 'Boxing is the purest test of mental performance in sport. When a punch lands, the amygdala fires — fear, rage, panic. Elite fighters have trained their psychological response to this trigger so thoroughly that they respond with tactical intelligence, not raw emotion. That gap is everything.',
        uniqueChallenge: 'The Adrenaline Override',
        challengeDetail: 'In the seconds before a fight, fighters experience the most intense adrenaline dump of any sport. Heart rate hits 180+ BPM before the first punch. Most fighters have never trained their psychological response to this physiological state — they just hope to manage it. Elite fighters engineer it, using the adrenaline as fuel rather than fighting it as noise.',
        techniques: [
            {
                title: 'Controlled Aggression Priming',
                description: 'The night before, elite fighters don\'t watch their opponent\'s highlight reel (anxiety trigger). They watch their own best performances. This primes the neural patterns associated with success rather than threat response. On fight day, controlled anger — not uncontrolled fear — is the optimal state.'
            },
            {
                title: 'The Between-Round Protocol',
                description: 'You have 60 seconds between rounds. Elite fighters use exactly: 15 seconds to receive corner coaching (listen), 15 seconds to recover (breathe), 15 seconds to visualize the next round tactically, 10 seconds to prime state (cue word, physical activation), 5 seconds to engage. This replaces the panic of "I\'m losing" with process.'
            },
            {
                title: 'Takedown Response Training',
                description: 'Getting hurt triggers the most dangerous mental spiral in boxing — desperation. Build a specific psychological response to being hurt: hands up → breathe → survive → reset → re-engage. Practice this in sparring by asking your sparring partner to land clean shots and drilling your psychological recovery each time.'
            },
            {
                title: 'The Stare-Down Protocol',
                description: 'The weigh-in stare-down is a psychological battle. Elite fighters know that emotional reaction = conceding the frame. Develop a specific internal monologue for this moment that keeps you tactical rather than reactive. You\'re reading your opponent, not competing with them.'
            }
        ],
        athletes: [
            { name: 'Muhammad Ali', lesson: 'Ali\'s psychological warfare was as calculated as his boxing. His trash talk wasn\'t emotion — it was strategy, designed to destabilize opponents before the first round. But inside the ring, Ali was ice-cold. His internal state was completely opposite to his external display.' },
            { name: 'Floyd Mayweather', lesson: 'Mayweather has been studied by sports psychologists for his seemingly inhuman composure under pressure. He credits his ability to "slow the fight down" mentally — his perception of time under extreme pressure is different from most fighters, a skill developed through high-volume sparring with deliberate psychological training.' },
            { name: 'Georges St-Pierre', lesson: 'GSP is the most psychologically studied fighter in MMA/boxing crossover research. He has spoken extensively about managing fear before fights and his use of visualization, breathing, and sport psychology tools. His book "The Way of the Fight" is largely about mental performance.' }
        ],
        bookId: 'mental-blocks',
        metaTitle: 'Mental Performance for Boxers | Fight Psychology & Mental Toughness',
        metaDescription: 'Master fight psychology — control adrenaline, build composure under fire, and develop the mental game that separates good fighters from elite ones.',
        tags: ['boxing', 'mental performance', 'fight psychology', 'Muhammad Ali', 'GSP', 'mental toughness']
    },
    {
        slug: 'gymnastics',
        name: 'Gymnastics',
        headline: 'Mental Performance for Gymnasts',
        subheadline: 'When execution is perfect in practice but breaks under competition — and how to fix it',
        description: 'Gymnastics uniquely punishes mental error. A movement that\'s been performed 10,000 times in practice can fail in competition not because the body forgot — but because the mind changed. Overthinking, anticipatory anxiety, and performance blocks are epidemic in gymnastics. The mental game is the last frontier.',
        uniqueChallenge: 'The Overthinking Spiral',
        challengeDetail: 'Gymnastics skills are stored as unconscious motor programs. Under normal conditions, they execute automatically. Under competition pressure, conscious attention intrudes on the automatic process — and disrupts it. This is called "paralysis by analysis" and it\'s the primary cause of competition-day skill breakdowns. The fix is counterintuitive: less conscious control, not more.',
        techniques: [
            {
                title: 'Automaticity Preservation',
                description: 'During competition, your only mental job is to trigger the motor program — not supervise it. Develop a single pre-skill trigger (one word, one breath, one physical cue) that activates the automatic sequence. When you catch yourself thinking about technique mid-skill, the program has already failed. The cue must come before, not during.'
            },
            {
                title: 'Fear of Return Protocol',
                description: 'After an injury or skill block, the return to that skill is psychological, not physical. Build a graduated exposure hierarchy: mental rehearsal → practice in low-consequence setting → practice with mat → practice at full intensity → competition equivalent. Each step requires demonstrated composure before progressing.'
            },
            {
                title: 'Competition Simulation Training',
                description: 'The neural state during a competition routine is fundamentally different from practice. Train in competition conditions — leotard, full performance energy, judges watching, consequences present — at least once per week. Your body needs to be habituated to performing the full skill sequence in a high-stakes context.'
            },
            {
                title: 'The Score Detachment Practice',
                description: 'Gymnastics scores are subjective and often feel unjust. Emotional reactions to scores disrupt the next performance. Build a score-detachment process: receive score → note it → file it → return to process. The score is data. Your next routine is the only thing you control.'
            }
        ],
        athletes: [
            { name: 'Simone Biles', lesson: 'Biles\' withdrawal at the Tokyo Olympics was the most public display of sports psychology in history — a world #1 choosing mental health over performance. Her subsequent comeback at Paris 2024 demonstrated what managed mental health in sport looks like: she performed her most difficult skills when the stakes were highest.' },
            { name: 'Nadia Comaneci', lesson: 'The first perfect 10 in Olympic gymnastics required not just physical perfection but mental stillness. Comaneci has described her internal state during that routine as almost trance-like — complete absorption in the movement with no concurrent awareness of consequences.' }
        ],
        bookId: 'mental-blocks',
        metaTitle: 'Mental Performance for Gymnasts | Overcoming Performance Blocks',
        metaDescription: 'Fix the mental blocks, overthinking spirals, and competition anxiety that break gymnastics performances. Proven techniques from elite gymnastics psychology.',
        tags: ['gymnastics', 'mental performance', 'performance blocks', 'Simone Biles', 'sports psychology', 'anxiety']
    },
    {
        slug: 'soccer',
        name: 'Soccer',
        headline: 'Mental Performance for Soccer Players',
        subheadline: 'The psychological game inside the beautiful game',
        description: 'Soccer\'s 90-minute duration, low-scoring nature, and split-second decision demands make mental performance critical at every level. A single lapse in concentration leads to a conceded goal. A penalty kick in the 90th minute is won or lost entirely in the mind.',
        uniqueChallenge: 'Decision-Making Under Fatigue',
        challengeDetail: 'As physical fatigue accumulates through a match, the prefrontal cortex — responsible for decision-making — degrades first. Elite players make tactically sound decisions in the 85th minute of a physical game because their decision-making process has been automated through repetition. When you\'re too tired to think, you execute training.',
        techniques: [
            {
                title: 'Penalty Kick Psychology',
                description: 'Penalty kicks are 95% psychological. Research shows the goalkeeper guesses the correct direction 60% of the time but saves only 20% of penalties — because placement accuracy degrades under pressure. Build a pre-kick routine that activates your best shooting mechanics: pick your target before approaching, commit completely, and execute mechanically.'
            },
            {
                title: 'The Concentration Grid',
                description: 'Soccer\'s 90 minutes require sustained concentration with appropriate intensity fluctuation — maximum focus during ball-in-play, deliberate recovery during stoppages. Train concentration like a physical muscle: high-intensity focus intervals in training, then deliberate recovery, mirrors what\'s needed in match conditions.'
            },
            {
                title: 'Error Flush Protocol',
                description: 'A defensive error in soccer typically leads to a goal. The emotional aftermath — guilt, self-blame, dropped head — creates vulnerability for the next 10 minutes. Elite defenders have a 5-second error processing window: acknowledge it, identify the fix, look up, compete. The team needs you present, not in your head.'
            },
            {
                title: 'Communication Under Pressure',
                description: 'Team communication degrades under pressure — players go quiet exactly when coordination is most critical. Elite teams practice verbal communication protocols that are maintained regardless of score or game intensity. This requires deliberate psychological training, not just tactical repetition.'
            }
        ],
        athletes: [
            { name: 'Cristiano Ronaldo', lesson: 'Ronaldo\'s pre-match routine is documented and unchanged across 20 years of elite competition. His visualization practice — including visualizing specific scoring scenarios — is part of his daily preparation. His reaction to failures (immediate replacement with a success image) is a trained psychological skill.' },
            { name: 'Lionel Messi', lesson: 'Despite vomiting before important matches in his early career (anxiety response), Messi developed world-class composure under pressure through deliberate psychological work. His decision-making at game speed is a function of automated pattern recognition built through thousands of hours of focused practice.' }
        ],
        bookId: 'the-competition-protocol',
        metaTitle: 'Mental Performance for Soccer Players | Focus, Decisions & Composure',
        metaDescription: 'Develop elite soccer psychology — penalty kick confidence, decision-making under fatigue, error recovery, and 90-minute concentration. Built for serious players.',
        tags: ['soccer', 'football', 'mental performance', 'Ronaldo', 'Messi', 'sports psychology', 'focus']
    },
    {
        slug: 'golf',
        name: 'Golf',
        headline: 'Mental Performance for Golfers',
        subheadline: 'The game after the game — why golf is 90% mental and what to do about it',
        description: 'Golf is unique: the ball doesn\'t move, there\'s no defender, and every shot happens in complete stillness. This makes it the most purely psychological sport on earth. Overthinking, yips, course management anxiety, and emotional momentum are the primary determinants of score — not swing mechanics.',
        uniqueChallenge: 'The Paralysis-by-Analysis Epidemic',
        challengeDetail: 'Golf\'s technical complexity — grip, stance, alignment, ball position, swing plane, tempo — creates ideal conditions for overthinking. The most common cause of scorecard disasters is conscious mechanical interference with an unconscious motor skill. The "yips" are the most extreme version: anxiety-induced neuromuscular disruption of automatic movements.',
        techniques: [
            {
                title: 'The One-Thought Pre-Shot Routine',
                description: 'Elite golfers limit conscious thought to one technical cue per shot during competition. Not five. One. Build your pre-shot routine to arrive at one clear mechanical thought (or a swing feel), execute the routine identically every time, and commit fully. Indecision at address is the most expensive microsecond in golf.'
            },
            {
                title: 'Bogey Response Protocol',
                description: 'A bogey psychologically triggers a recovery attempt on the next hole — which is the most common cause of doubles. Build a specific bogey response: accept it ("par-bogey-par is a 74"), reset your target (next fairway, not next scorecard redemption), and play the next shot as if the previous hole didn\'t exist.'
            },
            {
                title: 'Course Management Psychology',
                description: 'Aggressive course management is often ego-driven, not strategically sound. The devil\'s advocate test: "If my opponent played this shot, what would I want them to do?" This moves course management from ego to strategy. Elite golfers play within their percentage — not their best-case scenario.'
            },
            {
                title: 'The Yips Treatment Protocol',
                description: 'The yips are an anxiety-driven disruption of automatic motor skills. Treatment involves: graduated exposure (starting from 1-foot putts), psychological decoupling (focus on target not mechanics), and routine reinforcement. This is a sports psychology issue, not a technique issue.'
            }
        ],
        athletes: [
            { name: 'Tiger Woods', lesson: 'Woods\' mental performance was as engineered as his swing. From age 6, his father subjected him to deliberate psychological disruption during practice — noise, distraction, taunting — to build composure under any conditions. Tiger\'s famous "process" focus (next shot, not leaderboard) is a trained psychological skill.' },
            { name: 'Jack Nicklaus', lesson: 'Nicklaus is considered the greatest clutch performer in golf history. He attributed his performance under pressure to visualization — specifically, he never hit a shot without first seeing the ball flight, bounce, and roll in his mind. He called it "going to the movies."' }
        ],
        bookId: 'the-competition-protocol',
        metaTitle: 'Mental Performance for Golfers | Fix the Yips, Manage the Course, Score Lower',
        metaDescription: 'Master golf psychology — pre-shot routines, yips treatment, bogey recovery, and the mental game that determines 90% of your score. Proven techniques.',
        tags: ['golf', 'mental performance', 'yips', 'Tiger Woods', 'sports psychology', 'pre-shot routine']
    },
    {
        slug: 'weightlifting',
        name: 'Weightlifting & Strength Sports',
        headline: 'Mental Performance for Weightlifters',
        subheadline: 'Psyching up, managing attempts, and performing maximally when it counts',
        description: 'Weightlifting and powerlifting are sports where 100% of performance happens in a 2-second window. Everything else — years of training, hours of preparation — is setup for that moment. The psychological demands are unique: maximal arousal, zero margin for error, immediate and unambiguous outcome.',
        uniqueChallenge: 'The Activation Calibration Problem',
        challengeDetail: 'Strength sports require a specific psychological state: high arousal, complete commitment, zero fear. Too little arousal = submaximal effort. Too much = technique breakdown and injury. Elite lifters have learned to hit their exact optimal activation zone on demand, regardless of external conditions.',
        techniques: [
            {
                title: 'Psyche-Up Protocol Engineering',
                description: 'Build a specific psyche-up sequence that reliably produces your optimal state. This might include: music (specific tracks), physical priming (specific movements), internal cues (specific imagery or self-talk). The sequence must be long enough to build state but short enough to maintain it through the lift. Most elite lifters use a 90-120 second window.'
            },
            {
                title: 'Attempt Selection Psychology',
                description: 'The psychological cost of a miss is higher than most lifters account for. Failed attempts trigger doubt that contaminates subsequent lifts. Conservative attempt selection in competition (90-95% probability of success) often produces better total scores than aggressive selection (70% probability). Confidence compounds; doubt compounds too.'
            },
            {
                title: 'The Tunnel Visualization',
                description: 'Elite lifters visualize the complete movement — not just the lift, but every preceding moment: the approach, the setup, the breath, the brace, the descent, the drive, the lockout, the rack. This full-sequence visualization primes every step rather than just the peak effort.'
            },
            {
                title: 'Miss Recovery Protocol',
                description: 'After a failed lift in competition, you typically have one or two attempts remaining. The psychological recovery from a miss is the most critical skill in strength sports. Build a specific post-miss routine: walk away, breathe, review (technique cue), recommit (one cue word), approach. Most elite lifters practice this in training by intentionally missing and drilling the recovery.'
            }
        ],
        athletes: [
            { name: 'Dmitry Klokov', lesson: 'The Russian Olympic weightlifting program is famous for its psychological preparation methodology, which Klokov has documented. Russian lifters practice "voluntary activation" — deliberately inducing high-arousal states — as a separate training discipline from technique work.' },
            { name: 'Ed Coan', lesson: 'Coan, considered the greatest powerlifter in history, was renowned for his methodical, cold approach to competition — the opposite of the screaming psyche-up culture. His optimal state was focused calm, and he engineered his entire preparation around maintaining it.' }
        ],
        bookId: 'physiological-performance',
        metaTitle: 'Mental Performance for Weightlifters | Psyche-Up, Attempt Selection & Focus',
        metaDescription: 'Build the psychological edge in strength sports. Psyche-up protocols, attempt selection psychology, visualization, and miss recovery for competitive lifters.',
        tags: ['weightlifting', 'powerlifting', 'mental performance', 'strength sports', 'sports psychology', 'focus']
    },
    {
        slug: 'martial-arts',
        name: 'Martial Arts & MMA',
        headline: 'Mental Performance for Martial Artists',
        subheadline: 'The psychological foundation of combat sports excellence',
        description: 'Martial arts demand the complete integration of technical skill and mental performance. A black belt with poor psychology loses to a blue belt with elite mental game. Fear management, tactical thinking under threat, and composure in chaos are the decisive factors at every level of competition.',
        uniqueChallenge: 'The Threat Response Override',
        challengeDetail: 'When facing a trained opponent, the human threat response system activates instinctively. Heart rate spikes, tunnel vision narrows, higher cognition degrades. Elite martial artists don\'t eliminate this response — they train their tactical decision-making to operate within it. The goal is to respond, not react.',
        techniques: [
            {
                title: 'Pre-Fight Anxiety Channeling',
                description: 'Nervousness before a fight is physiologically identical to excitement. The interpretation is a choice. Elite fighters use cognitive reframing: "I\'m not anxious — I\'m ready." This isn\'t positive thinking; it\'s accurate neuroscience. The physical state is identical; the performance implications diverge based on the label you assign it.'
            },
            {
                title: 'Tactical Calm Under Pressure',
                description: 'The highest-level martial arts fights are often the calmest. Elite competitors slow their perception of chaos by maintaining tactical awareness — scanning for openings, reading patterns, staying three moves ahead — which occupies the frontal cortex and prevents emotional flooding. Practice tactical narration in sparring: "He drops his right hand when he jabs. Watch for it."'
            },
            {
                title: 'Reset After Takedown/Knockdown',
                description: 'Being taken down or rocked is the most psychologically destabilizing event in combat sports. Build a specific recovery protocol: protect → breathe → assess → re-engage. The fighters who lose after being knocked down often lose to the psychological response to the knockdown, not the knockdown itself.'
            },
            {
                title: 'Weight Cut Mental Recovery',
                description: 'The weight cut is a psychological marathon before the physical one. Dehydration impairs cognitive function and emotional regulation. Build a specific rehydration and psychological reset protocol for the 24 hours between weigh-in and competition that prioritizes mental recovery alongside physical recovery.'
            }
        ],
        athletes: [
            { name: 'Georges St-Pierre', lesson: 'GSP is the most well-known advocate for sports psychology in MMA. He has worked with sport psychologists throughout his career and speaks openly about managing fear before fights. His calm, analytical approach during fights — even when in danger — is a trained psychological state.' },
            { name: 'Jon Jones', lesson: 'Jones\'s in-cage IQ is frequently noted — his ability to solve tactical problems under maximum pressure demonstrates what high-level cognitive function under stress looks like. Whether winning or in danger, Jones\'s tactical processing continues rather than defaulting to pure reaction.' },
            { name: 'Demetrious Johnson', lesson: 'Mighty Mouse\'s longevity and consistency at the championship level is frequently attributed to his mental game — specifically his ability to remain composed regardless of opponent size advantage or fight dynamics. He credits deliberate practice of mental performance skills.' }
        ],
        bookId: 'mental-blocks',
        metaTitle: 'Mental Performance for Martial Artists | Combat Sports Psychology',
        metaDescription: 'Develop elite fight psychology for martial arts and MMA. Fear management, tactical calm, pre-fight anxiety, and psychological recovery for combat athletes.',
        tags: ['martial arts', 'MMA', 'mental performance', 'GSP', 'combat sports', 'sports psychology', 'fear']
    }
];
