#!/usr/bin/env python3
"""
Daily content generator: 9 quote images + 1 video for today's book.
Rotates through 8 books based on day of year.
Posts everything to LinkedIn via API.
Run daily at 8 AM via n8n cron.
"""
import os, sys, json, textwrap, datetime, requests
from PIL import Image, ImageDraw, ImageFont

# ── Book rotation ──────────────────────────────────────────────────────────────
BOOKS = [
    {
        "id": "competition-protocol",
        "title": "The Competition Protocol",
        "subtitle": "7-Day Pre-Event System",
        "amazon": "https://www.amazon.com/dp/B0GKF5TGMQ",
        "cover": "/home/notaras/thementalsport/public/covers/final_neon_cover.jpg",
        "color": "#dc2626",
        "quotes": [
            ("The night before the competition is not the time to prepare. It is the time to trust your preparation.", "The Competition Protocol"),
            ("Phelps swam blind at Beijing and broke the world record. He had visualized that disaster 1,000 times.", "Bob Bowman"),
            ("Fear is not a weakness. Fear is biology. Label it as readiness.", "The Competition Protocol"),
            ("Elite athletes don't have less anxiety. They have a better relationship with it.", "The Competition Protocol"),
            ("The anchor is a single gesture that collapses months of training into one instant.", "The Competition Protocol"),
            ("GSP vomited backstage before every UFC fight. He still won. Fear is fuel.", "Georges St-Pierre"),
            ("Kobe signed the Mamba Contract before every season. 5 goals. 5 commitments. Public accountability.", "The Mamba Mentality"),
            ("Your pre-event routine is not superstition. It is neuroscience.", "The Competition Protocol"),
            ("Day 7 is not the start of preparation. It is the start of trust.", "The Competition Protocol"),
        ],
    },
    {
        "id": "mental-blocks",
        "title": "Overcoming Mental Blocks",
        "subtitle": "Peak Performance Guide",
        "amazon": "https://www.amazon.com/dp/B0F87QX82W",
        "cover": "/home/notaras/thementalsport/public/covers/overcoming-mental-blocks.png",
        "color": "#d97706",
        "quotes": [
            ("A mental block is not a wall. It is a door you haven't learned to open yet.", "Overcoming Mental Blocks"),
            ("The inner critic speaks loudest right before your breakthrough.", "Overcoming Mental Blocks"),
            ("Performance anxiety is your body preparing to perform. Use it.", "Overcoming Mental Blocks"),
            ("You don't need to silence your doubts. You need to act alongside them.", "Overcoming Mental Blocks"),
            ("Mental resilience is not built in comfort. It is built in the moments you almost quit.", "Overcoming Mental Blocks"),
            ("Tiger Woods rehearses failure before every tournament. He visualizes the bad shot — then the recovery.", "Earl Woods"),
            ("The difference between choking and winning is not talent. It is trained response.", "Overcoming Mental Blocks"),
            ("Pressure is a privilege. It means something is at stake.", "Overcoming Mental Blocks"),
            ("Your self-talk in the final seconds determines the outcome more than any training session.", "Overcoming Mental Blocks"),
        ],
    },
    {
        "id": "unbreakable",
        "title": "Unbreakable",
        "subtitle": "Leo and Maya's Mental Toughness Adventure",
        "amazon": "https://www.amazon.com/dp/B0FBRXBBPK",
        "cover": "/home/notaras/thementalsport/public/covers/unbreakable.png",
        "color": "#0ea5e9",
        "quotes": [
            ("I can't do it YET. Three letters that change everything.", "Unbreakable"),
            ("Mistakes are not failures. Mistakes are data.", "Unbreakable"),
            ("A balloon breath in, a balloon breath out. Calm is a skill, not a gift.", "Unbreakable"),
            ("Tough days don't last. Tough kids do.", "Unbreakable"),
            ("Growth mindset is not believing you are great. It is believing you can grow.", "Carol Dweck"),
            ("When Leo fell off the mountain, he didn't quit. He asked what he learned.", "Unbreakable"),
            ("Worry thoughts are just thoughts — not facts, not futures.", "Unbreakable"),
            ("The strongest kids are not the ones who never cry. They are the ones who get back up.", "Unbreakable"),
            ("You are not your worst moment. You are what you do next.", "Unbreakable"),
        ],
    },
    {
        "id": "confidence-building",
        "title": "Confidence-Building Workbook",
        "subtitle": "Overcome Self-Doubt",
        "amazon": "https://www.amazon.com/dp/B0F8CT8Z7M",
        "cover": "/home/notaras/thementalsport/public/covers/confidence-building.png",
        "color": "#22c55e",
        "quotes": [
            ("Confidence is not the absence of doubt. It is action in spite of doubt.", "Confidence-Building Workbook"),
            ("Serena Williams talked to herself in third person during matches. 'Serena, you've got this.' It works.", "Sports Psychology Research"),
            ("Every time you keep a promise to yourself, your confidence account grows.", "Confidence-Building Workbook"),
            ("Self-doubt is normal. Self-abandonment is optional.", "Confidence-Building Workbook"),
            ("The mirror exercise is not vanity. It is rewiring.", "Confidence-Building Workbook"),
            ("SMART goals are not about ambition. They are about proof that you can deliver to yourself.", "Confidence-Building Workbook"),
            ("Your posture changes your hormones. Power pose for 2 minutes before competition. Science backs it.", "Amy Cuddy"),
            ("Write 3 wins every night. Not victories — any forward motion counts.", "Confidence-Building Workbook"),
            ("You do not rise to the level of your goals. You fall to the level of your systems.", "James Clear"),
        ],
    },
    {
        "id": "resilient-confidence",
        "title": "Unlocking Resilient Confidence",
        "subtitle": "Consistent High Performance",
        "amazon": "https://www.amazon.com/dp/B0F87V8WRX",
        "cover": "/home/notaras/thementalsport/public/covers/resilient-confidence.png",
        "color": "#eab308",
        "quotes": [
            ("Resilient confidence is not shaken by one bad result. It is built across 1,000 results.", "Unlocking Resilient Confidence"),
            ("Give Your Best is not a motivational poster. It is a daily decision.", "Unlocking Resilient Confidence"),
            ("Federer lost more matches than most players ever play. He is the greatest because of how he lost.", "Unlocking Resilient Confidence"),
            ("External validation is rented confidence. Internal belief is owned.", "Unlocking Resilient Confidence"),
            ("When criticism lands, ask one question: Is it true? If not, discard it. If yes, use it.", "Unlocking Resilient Confidence"),
            ("Michael Jordan was cut from his high school team. He used the embarrassment as rocket fuel.", "Unlocking Resilient Confidence"),
            ("The growth zone is one millimeter past your comfort zone. Not ten miles. One millimeter.", "Unlocking Resilient Confidence"),
            ("Adversity is not the enemy of confidence. Avoided adversity is.", "Unlocking Resilient Confidence"),
            ("Pressure reveals character. It does not create it. Start building now.", "Unlocking Resilient Confidence"),
        ],
    },
    {
        "id": "nurturing-self-worth",
        "title": "Nurturing Self-Worth",
        "subtitle": "Building Self-Esteem in Children",
        "amazon": "https://www.amazon.com/dp/B0F845R96L",
        "cover": "/home/notaras/thementalsport/public/covers/nurturing-self-worth.png",
        "color": "#ef4444",
        "quotes": [
            ("Children hear what you say to them. They become what you say about them.", "Nurturing Self-Worth"),
            ("Praise the effort, not the result. 'You worked so hard' beats 'You are so smart.'", "Carol Dweck Research"),
            ("The power of yet is the most important two-letter suffix in parenting.", "Nurturing Self-Worth"),
            ("When a child fails, the question is not 'Why did you fail?' It is 'What will you try next?'", "Nurturing Self-Worth"),
            ("Emotional intelligence is not born. It is modeled.", "Nurturing Self-Worth"),
            ("A child who is never allowed to struggle is a child who is never allowed to grow.", "Nurturing Self-Worth"),
            ("Self-worth built on achievements is fragile. Self-worth built on values is unbreakable.", "Nurturing Self-Worth"),
            ("The most powerful sentence a parent can say: 'I believe in you even when it is hard.'", "Nurturing Self-Worth"),
            ("Children don't need perfect parents. They need present parents.", "Nurturing Self-Worth"),
        ],
    },
    {
        "id": "physiological-performance",
        "title": "Physiological Peak Performance",
        "subtitle": "Science-Driven Training Guide",
        "amazon": "https://www.amazon.com/dp/B0F87P1H5Y",
        "cover": "/home/notaras/thementalsport/public/covers/physiological-performance.png",
        "color": "#8b5cf6",
        "quotes": [
            ("Your body is the hardware. Your mind is the operating system. Train both.", "Physiological Peak Performance"),
            ("VO2 max is trainable. Willpower is also trainable. Start with whichever is weaker.", "Physiological Peak Performance"),
            ("Sleep is not recovery. Sleep is performance. LeBron sleeps 12 hours for a reason.", "Physiological Peak Performance"),
            ("The physiological sigh: double inhale through nose, long exhale. Drops cortisol in 90 seconds.", "Stanford Neuroscience"),
            ("Neuromuscular adaptation is why practice makes permanent, not just perfect.", "Physiological Peak Performance"),
            ("Cold exposure increases norepinephrine by 300%. It is not torture. It is a tool.", "Physiological Peak Performance"),
            ("Zone 2 cardio builds the aerobic base that every elite sport sits on top of.", "Physiological Peak Performance"),
            ("Your muscles don't grow during training. They grow during recovery. Respect recovery.", "Physiological Peak Performance"),
            ("The Wim Hof method is not mysticism. It is controlled hyperventilation with documented effects.", "Physiological Peak Performance"),
        ],
    },
    {
        "id": "adhd-athletes-edge",
        "title": "The ADHD Athlete's Edge",
        "subtitle": "Turn Distraction Into Domination",
        "amazon": "https://www.amazon.com/dp/B0F85N8SBQ",
        "cover": "/home/notaras/thementalsport/public/covers/adhd-athletes-edge.png",
        "color": "#ec4899",
        "quotes": [
            ("ADHD is not a deficit of attention. It is a deficit of consistency — and that is trainable.", "The ADHD Athlete's Edge"),
            ("Hyperfocus is ADHD's superpower. The goal is not to eliminate it. The goal is to aim it.", "The ADHD Athlete's Edge"),
            ("Simone Biles has ADHD. Her leaked medical records were meant to shame her. She wore them as a badge.", "The ADHD Athlete's Edge"),
            ("Dopamine floods ADHD brains. Design your training to surf the floods.", "The ADHD Athlete's Edge"),
            ("A boring routine is ADHD kryptonite. Build rituals with novelty baked in.", "The ADHD Athlete's Edge"),
            ("The 2-minute rule: if a task takes less than 2 minutes, do it now. ADHD brains need momentum.", "The ADHD Athlete's Edge"),
            ("Short training blocks with defined endpoints outperform long sessions for neurodiverse athletes.", "The ADHD Athlete's Edge"),
            ("Emotional dysregulation in ADHD athletes is not immaturity. It is neurology. Coach accordingly.", "The ADHD Athlete's Edge"),
            ("Your ADHD brain is not broken. It is differently calibrated for a different kind of excellence.", "The ADHD Athlete's Edge"),
        ],
    },
]

W, H = 1080, 1080

def get_font(size, bold=False):
    paths = [
        f'/usr/share/fonts/truetype/dejavu/DejaVuSans{"Bold" if bold else ""}.ttf',
        f'/usr/share/fonts/truetype/liberation/LiberationSans-{"Bold" if bold else "Regular"}.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def make_quote_image(quote, attribution, book_title, accent_color, out_path):
    bg = (12, 12, 12)
    accent = hex_to_rgb(accent_color)
    img = Image.new('RGB', (W, H), bg)
    draw = ImageDraw.Draw(img)
    draw.rectangle([0, 0, W, 10], fill=accent)
    draw.rectangle([0, H-10, W, H], fill=accent)
    draw.rectangle([0, 0, 8, H], fill=accent)
    fq = get_font(120, bold=True)
    draw.text((60, 40), '"', font=fq, fill=(*accent, 80))
    ftext = get_font(44, bold=True)
    lines = textwrap.wrap(quote, width=28)
    y = 220
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=ftext)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) // 2, y), line, font=ftext, fill=(240, 240, 240))
        y += bbox[3] - bbox[1] + 16
    y += 30
    fatrib = get_font(30)
    atrib_text = f'— {attribution}'
    bbox = draw.textbbox((0, 0), atrib_text, font=fatrib)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), atrib_text, font=fatrib, fill=accent)
    y = H - 100
    fbk = get_font(26)
    bk_text = f'From: {book_title}'
    bbox = draw.textbbox((0, 0), bk_text, font=fbk)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), bk_text, font=fbk, fill=(120, 120, 120))
    y += 40
    fsite = get_font(24)
    site_text = 'thementalsport.com'
    bbox = draw.textbbox((0, 0), site_text, font=fsite)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), site_text, font=fsite, fill=(80, 80, 80))
    img.save(out_path)

def make_video(book, out_path):
    import subprocess, shutil
    frames_dir = '/tmp/daily-video-frames'
    if os.path.exists(frames_dir):
        shutil.rmtree(frames_dir)
    os.makedirs(frames_dir)
    accent = hex_to_rgb(book['color'])
    cover_img = Image.open(book['cover']).convert('RGB').resize((W, H), Image.LANCZOS)
    FPS = 30
    frame = 0
    for i in range(FPS * 4):
        alpha = min(1.0, i / (FPS * 0.5))
        base = Image.new('RGB', (W, H), (0, 0, 0))
        blended = Image.blend(base, cover_img, alpha)
        blended.save(f'{frames_dir}/frame_{frame:04d}.png')
        frame += 1
    hook_quote, hook_attr = book['quotes'][0]
    for i in range(FPS * 4):
        img = Image.new('RGB', (W, H), (10, 10, 10))
        draw = ImageDraw.Draw(img)
        draw.rectangle([0, 0, W, 8], fill=accent)
        f_lg = get_font(46, bold=True)
        f_sm = get_font(28)
        lines = textwrap.wrap(hook_quote, width=26)
        y = 200
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=f_lg)
            tw = bbox[2] - bbox[0]
            draw.text(((W - tw) // 2, y), line, font=f_lg, fill=(240, 240, 240))
            y += bbox[3] - bbox[1] + 14
        y += 20
        bbox = draw.textbbox((0, 0), f'— {hook_attr}', font=f_sm)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) // 2, y), f'— {hook_attr}', font=f_sm, fill=accent)
        img.save(f'{frames_dir}/frame_{frame:04d}.png')
        frame += 1
    for i in range(FPS * 4):
        img = Image.new('RGB', (W, H), (10, 10, 10))
        draw = ImageDraw.Draw(img)
        draw.rectangle([0, 0, W, 8], fill=accent)
        f_title = get_font(58, bold=True)
        f_sub = get_font(30)
        title_lines = textwrap.wrap(book['title'], width=20)
        y = 200
        for line in title_lines:
            bbox = draw.textbbox((0, 0), line, font=f_title)
            tw = bbox[2] - bbox[0]
            draw.text(((W - tw) // 2, y), line, font=f_title, fill=(240, 240, 240))
            y += bbox[3] - bbox[1] + 12
        y += 30
        for line in textwrap.wrap(book['subtitle'], width=30):
            bbox = draw.textbbox((0, 0), line, font=f_sub)
            tw = bbox[2] - bbox[0]
            draw.text(((W - tw) // 2, y), line, font=f_sub, fill=accent)
            y += bbox[3] - bbox[1] + 10
        img.save(f'{frames_dir}/frame_{frame:04d}.png')
        frame += 1
    for i in range(FPS * 3):
        img = Image.new('RGB', (W, H), accent)
        draw = ImageDraw.Draw(img)
        f_big = get_font(68, bold=True)
        f_med = get_font(38, bold=True)
        y = 300
        for text, font in [('GET IT ON AMAZON', f_big), ('thementalsport.com', f_med)]:
            bbox = draw.textbbox((0, 0), text, font=font)
            tw = bbox[2] - bbox[0]
            draw.text(((W - tw) // 2, y), text, font=font, fill=(255, 255, 255))
            y += bbox[3] - bbox[1] + 20
        img.save(f'{frames_dir}/frame_{frame:04d}.png')
        frame += 1
    subprocess.run(['ffmpeg', '-y', '-framerate', '30', '-i', f'{frames_dir}/frame_%04d.png',
                    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', out_path], check=True, capture_output=True)
    print(f'Video generated: {out_path}')

def linkedin_register_image(token, person_urn):
    resp = requests.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0'},
        json={"registerUploadRequest": {
            "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
            "owner": person_urn,
            "serviceRelationships": [{"relationshipType": "OWNER", "identifier": "urn:li:userGeneratedContent"}]
        }}
    )
    data = resp.json()
    upload_url = data['value']['uploadMechanism']['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']['uploadUrl']
    asset = data['value']['asset']
    return upload_url, asset

def linkedin_post(token, person_urn, media_list, caption, category='IMAGE'):
    return requests.post(
        'https://api.linkedin.com/v2/ugcPosts',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0'},
        json={
            "author": person_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {"com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": caption},
                "shareMediaCategory": category,
                "media": media_list,
            }},
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
        }
    ).json()

def main():
    token = open('/home/notaras/.local/credentials/li_access_token.txt').read().strip()
    person_urn = 'urn:li:person:t0pJmRkuIa'

    day_index = datetime.date.today().timetuple().tm_yday % len(BOOKS)
    book = BOOKS[day_index]
    print(f"Book of the day: {book['title']}")

    out_dir = f'/tmp/daily-content-{datetime.date.today()}'
    os.makedirs(out_dir, exist_ok=True)

    # Generate 9 quote images
    image_paths = []
    for i, (quote, attr) in enumerate(book['quotes']):
        path = f'{out_dir}/quote_{i+1:02d}.png'
        make_quote_image(quote, attr, book['title'], book['color'], path)
        image_paths.append(path)
        print(f'  Image {i+1}/9')

    # Generate video
    video_path = f'{out_dir}/promo.mp4'
    make_video(book, video_path)

    hashtags = '#MentalPerformance #Athletes #SportsPsychology #Mindset #PeakPerformance #MentalToughness #ElitePerformance'
    free_chapter_cta = '\n\nWant a free chapter on The Biology of Choking? Download at thementalsport.com (link in bio)'

    # Post video to LinkedIn
    reg = requests.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0'},
        json={"registerUploadRequest": {
            "recipes": ["urn:li:digitalmediaRecipe:feedshare-video"],
            "owner": person_urn,
            "serviceRelationships": [{"relationshipType": "OWNER", "identifier": "urn:li:userGeneratedContent"}]
        }}
    ).json()
    video_upload_url = reg['value']['uploadMechanism']['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']['uploadUrl']
    video_asset = reg['value']['asset']
    with open(video_path, 'rb') as f:
        requests.put(video_upload_url, data=f, headers={'Authorization': f'Bearer {token}', 'media-type-family': 'VIDEO'})
    video_caption = f"{book['quotes'][0][0]}\n\n{book['title']} — {book['subtitle']}\n\nGet it: {book['amazon']}{free_chapter_cta}\n\n{hashtags}"
    result = linkedin_post(token, person_urn, [{"status": "READY", "media": video_asset}], video_caption, 'VIDEO')
    print(f'LinkedIn video: {result.get("id", result)}')

    # Upload 9 images and post as carousel
    print('Uploading images...')
    assets = []
    for path in image_paths:
        upload_url, asset = linkedin_register_image(token, person_urn)
        with open(path, 'rb') as f:
            requests.put(upload_url, data=f, headers={'Authorization': f'Bearer {token}'})
        assets.append({"status": "READY", "media": asset})
        print(f'  Uploaded {os.path.basename(path)}')

    photo_caption = f"9 mindset principles from {book['title']} — save this.\n\n{book['amazon']}{free_chapter_cta}\n\n{hashtags}"
    result = linkedin_post(token, person_urn, assets, photo_caption, 'IMAGE')
    print(f'LinkedIn photos: {result.get("id", result)}')

    # Save manifest for Pinterest poster
    manifest = {
        'date': str(datetime.date.today()),
        'book_title': book['title'],
        'book_id': book['id'],
        'color': book['color'],
        'amazon': book['amazon'],
        'image_paths': image_paths,
        'video_path': video_path,
        'quotes': book['quotes'],
    }
    with open('/tmp/daily-manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2)
    print('Manifest saved: /tmp/daily-manifest.json')

if __name__ == '__main__':
    main()
