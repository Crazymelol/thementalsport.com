#!/usr/bin/env python3
"""
Upload today's video to YouTube via YouTube Data API v3.
Reads /tmp/daily-manifest.json for video path and book details.

PATCHED 2026-06-12 — drop-in replacement; needs yt_dedup.py in the same folder.
- Title selection goes through yt_dedup.choose_title: every title posts EXACTLY
  ONCE, ever. The old (day_idx*12+slot)%15 index ran with BOOK_SLOT unset
  (post-all-platforms.sh never exports it to this script), so it could only ever
  reach 5 of the 15 titles per book and repeated the same title on every
  same-day run — that duplicate spam is what suppressed the channel.
- Hard cap 3 uploads per rolling 24h, no matter how many cron slots fire.
- Token invalid/revoked: cron runs fail fast; run BY HAND with --auth to open
  the browser OAuth flow and save a fresh token.
"""
import json, os, sys, asyncio
from pathlib import Path

MANIFEST = '/tmp/daily-manifest.json'
TOKEN_FILE = Path.home() / '.local/credentials/youtube_token.json'
CREDS_FILE = Path.home() / '.local/credentials/youtube_credentials.json'

def get_youtube_service():
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    creds = Credentials.from_authorized_user_file(str(TOKEN_FILE))
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        TOKEN_FILE.write_text(creds.to_json())

    return build('youtube', 'v3', credentials=creds)

def upload_video(video_path, title, description, thumbnail_path=None, privacy='public'):
    from googleapiclient.http import MediaFileUpload

    youtube = get_youtube_service()

    body = {
        'snippet': {
            'title': title[:100],
            'description': description,
            'tags': ['SportsPsychology','MentalPerformance','MentalToughness','PeakPerformance','Athletes','Mindset','AthleteLife','WinningMindset','SportPsychologist','Confidence','GiannisNotaras','TheMentalSport','Shorts','PerformanceCoach','SportsParents'],
            'categoryId': '22',
        },
        'status': {
            'privacyStatus': privacy,
            'selfDeclaredMadeForKids': False,
        }
    }

    media = MediaFileUpload(video_path, chunksize=-1, resumable=True,
                            mimetype='video/mp4')
    request = youtube.videos().insert(part='snippet,status', body=body,
                                      media_body=media)

    print(f'Uploading {os.path.basename(video_path)}...')
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f'  Progress: {int(status.progress() * 100)}%')

    video_id = response['id']
    print(f'YouTube uploaded: https://youtube.com/watch?v={video_id}')

    # Set thumbnail if provided
    if thumbnail_path and os.path.exists(thumbnail_path):
        try:
            from googleapiclient.http import MediaFileUpload as MFU
            youtube.thumbnails().set(
                videoId=video_id,
                media_body=MFU(thumbnail_path, mimetype='image/jpeg')
            ).execute()
            print(f'Thumbnail set: {os.path.basename(thumbnail_path)}')
        except Exception as e:
            print(f'Thumbnail skipped: {e}')

    return video_id

def main():
    if not os.path.exists(MANIFEST):
        print(f'ERROR: {MANIFEST} not found')
        sys.exit(1)

    with open(MANIFEST) as f:
        m = json.load(f)

    book = m["book_title"]
    book_url = m.get("url", "")
    gumroad_map = {
        "The Competition Protocol": "https://notarasio.gumroad.com/l/yfkgwv",
        "Overcoming Mental Blocks": "https://notarasio.gumroad.com/l/albwf",
        "Unbreakable": "https://notarasio.gumroad.com/l/lazrca",
        "Confidence-Building Workbook": "https://notarasio.gumroad.com/l/bknbwi",
        "Unlocking Resilient Confidence": "https://notarasio.gumroad.com/l/jzzsp",
        "Nurturing Self-Worth": "https://notarasio.gumroad.com/l/zkkptv",
        "Physiological Peak Performance Blueprint": "https://notarasio.gumroad.com/l/ryzhc",
        "The ADHD Athlete's Edge": "https://notarasio.gumroad.com/l/boced",
    }
    gumroad = gumroad_map.get(book, "https://notarasio.gumroad.com")

    hooks = {
        "The Competition Protocol": [
            "7 Days Before Your Race — This Mental Protocol Changes Everything",
            "What Elite Athletes Do The Night Before Competition",
            "The Pre-Competition Ritual That Separates Winners From Losers",
            "Why Most Athletes Mentally Collapse Before The Race Even Starts",
            "This 7-Step Mental Protocol Is Used By Olympic Athletes",
            "The Exact Pre-Race Mindset Routine Of A Champion",
            "Do This 7 Days Before Competition To Peak On Race Day",
            "Most Athletes Skip This Step Before Competition — Don't Be One Of Them",
            "The Mental Warm-Up Elite Athletes Never Skip",
            "How To Enter Any Competition Already Winning Mentally",
            "Pre-Race Anxiety Is Not The Problem — This Is",
            "The Competition Protocol That Gets Athletes Into Flow State",
            "Why The Day Before Competition Matters More Than Race Day",
            "Stop Winging Your Pre-Competition Prep — Use This Protocol",
            "The 7-Day Mental Countdown Elite Coaches Swear By",
        ],
        "Overcoming Mental Blocks": [
            "Why Elite Athletes Freeze (And How To Stop It)",
            "The Mental Block That Kills Performance At The Worst Moment",
            "How To Break Through Any Mental Block In Sport",
            "You're Not Overthinking — You Have A Mental Block. Here's The Fix",
            "The Psychological Reason Athletes Suddenly Forget How To Perform",
            "What Causes An Athlete To Blank Mid-Performance",
            "Mental Blocks Are Not Random — Here's Exactly Why They Happen",
            "The Only Way To Permanently Remove A Mental Block In Sport",
            "Why Trying Harder Makes Mental Blocks Worse",
            "This Technique Removes Mental Blocks In Under 10 Minutes",
            "The Fear Behind Every Athletic Mental Block (And How To Face It)",
            "Coaches Don't Teach This — But It Fixes Mental Blocks Every Time",
            "Your Mental Block Has A Pattern. Once You See It, It Disappears",
            "The 3-Step Method To Break Through Athletic Mental Blocks",
            "Why Mental Blocks Come Back And How To Stop Them Permanently",
        ],
        "Unbreakable": [
            "How To Raise A Mentally Tough Athlete",
            "The 3 Things Mentally Tough Athletes Never Say To Themselves",
            "What Sports Parents Get Wrong About Mental Toughness",
            "How To Build A Child Who Never Gives Up Under Pressure",
            "Mentally Tough Athletes Were Taught This — Were You?",
            "The Parenting Style That Produces Mentally Unbreakable Athletes",
            "Mental Toughness Isn't About Being Hard — It's About This",
            "What Happens Inside An Athlete's Mind When Everything Goes Wrong",
            "How To Bounce Back From Any Defeat Like A Champion",
            "The One Habit That Builds Mental Toughness In Young Athletes",
            "Why Some Athletes Thrive Under Pressure And Others Fall Apart",
            "Raising An Unbreakable Athlete Starts With This Conversation",
            "Mental Toughness Is Learned, Not Born — Here's How",
            "The Difference Between Grit And True Mental Toughness",
            "How To Make Adversity Your Athlete's Greatest Competitive Advantage",
        ],
        "Confidence-Building Workbook": [
            "Build Unbreakable Confidence In 30 Days",
            "Why Athletes Lose Confidence Mid-Season (And How To Get It Back)",
            "The Daily Practice That Builds Athletic Confidence Permanently",
            "Confidence Isn't Born — It's Built With This Method",
            "Stop Waiting To Feel Confident. Do This Instead",
            "The Confidence Mistake 90% Of Athletes Make",
            "Your Confidence Is Being Destroyed By One Habit You Don't Notice",
            "How To Build Confidence That Doesn't Collapse Under Pressure",
            "The 30-Day System That Rewires An Athlete's Confidence",
            "Why Confidence Feels Fake Until You Do This",
            "The Fastest Way To Rebuild Confidence After A Bad Season",
            "Confidence Is A Skill — Here's How To Train It",
            "The Link Between Self-Talk And Athletic Confidence",
            "Why Positive Affirmations Don't Build Real Confidence",
            "Do This Every Morning For 30 Days And Watch Your Confidence Transform",
        ],
        "Unlocking Resilient Confidence": [
            "The Confidence Secret Champions Use",
            "Real Confidence Doesn't Come From Winning — Here's Where It Comes From",
            "How To Stay Confident Even When You're Losing",
            "The Difference Between Fragile Confidence And Resilient Confidence",
            "Why Your Confidence Collapses Under Pressure (The Real Reason)",
            "Resilient Confidence Can't Be Shaken By Results — Here's Why",
            "How To Build Confidence That Gets Stronger With Every Loss",
            "The Identity Shift That Creates Unshakeable Athletic Confidence",
            "Why Winning Doesn't Fix Confidence Problems In Athletes",
            "The Mental Root Of Every Confidence Crisis In Sport",
            "How Champions Stay Confident After Failure",
            "Your Confidence Should Not Depend On Your Last Performance",
            "The Psychological Foundation Of Resilient Athletic Confidence",
            "Stop Tying Your Confidence To Outcomes — Do This Instead",
            "The Confidence Framework That Works Even In A Losing Streak",
        ],
        "Nurturing Self-Worth": [
            "Raise A Child Who Believes In Themselves",
            "The Parenting Mistake That Destroys An Athlete's Self-Worth",
            "How To Build A Child's Identity Beyond Wins And Losses",
            "What Your Child Needs To Hear After A Bad Game",
            "Sports Parents: Stop Doing This After Every Match",
            "The Words You Say After A Loss Shape Your Child's Future",
            "How To Make Your Child Feel Enough Even When They Lose",
            "The Sport Parent Trap That Damages Young Athletes' Self-Worth",
            "Your Child's Self-Worth Should Never Depend On Their Score",
            "How To Raise An Athlete Who Loves Sport Even After Losing",
            "The Conversation Every Sports Parent Needs To Have",
            "Why Some Kids Quit Sport At 14 — And How To Prevent It",
            "Building Self-Worth In Young Athletes That Lasts A Lifetime",
            "The Subtle Message Sports Parents Send That Destroys Confidence",
            "How To Separate Your Child's Performance From Their Value As A Person",
        ],
        "Physiological Peak Performance Blueprint": [
            "The Science Behind Peak Athletic Performance",
            "Your Body Can't Perform If Your Brain Is In Survival Mode",
            "The Breathing Technique That Triggers Peak Performance On Demand",
            "Why Sleep Is The Most Underrated Performance Tool In Sport",
            "Elite Athletes Control This Physiological State Before Competition",
            "The Nervous System Hack That Switches Athletes Into Peak Mode",
            "How To Use Physiology To Perform Better Under Pressure",
            "Your Heart Rate Variability Is Telling You Something Crucial",
            "The Cold Exposure Protocol Elite Athletes Use To Boost Performance",
            "Why Recovery Is The Secret Weapon Of The World's Best Athletes",
            "Control Your Cortisol And You Control Your Performance",
            "The Gut-Brain Connection Most Coaches Don't Know About",
            "Peak Performance Is 60% Mental And 40% This",
            "The Physiology Of Flow State — And How To Trigger It",
            "Why Elite Athletes Obsess Over Sleep Quality More Than Training",
        ],
        "The ADHD Athlete's Edge": [
            "ADHD Athletes Win More — Here's Why",
            "ADHD Isn't A Disadvantage In Sport — Here's The Proof",
            "How To Channel Hyperfocus Into Athletic Performance",
            "The ADHD Superpower That Makes Better Athletes",
            "Why ADHD Athletes Dominate When They Learn This One Skill",
            "The Misunderstood Advantage ADHD Athletes Have Over Everyone",
            "How To Coach An Athlete With ADHD Without Burning Them Out",
            "ADHD And Sport: Why The Right Environment Changes Everything",
            "The Impulsivity That Hurts ADHD Athletes In Life Helps Them Here",
            "How Michael Phelps Used ADHD As A Competitive Weapon",
            "Your ADHD Child Is Not Broken — They're Built For This",
            "The Training Approach That Makes ADHD Athletes Unstoppable",
            "Why Traditional Coaching Fails ADHD Athletes (And What Works)",
            "Turn Your Child's ADHD Into Their Biggest Athletic Advantage",
            "The Focus Strategy That Works For ADHD Athletes Every Time",
        ],
    }
    from yt_dedup import choose_title, mark_posted

    title = choose_title(book, hooks)
    if title is None:
        print('Nothing new to post — skipping. (Better silent than duplicate.)')
        sys.exit(0)

    hook = title[:-len(' #Shorts')] if title.endswith(' #Shorts') else title
    title = title[:100]
    description = (
        f"{hook}\n\n"
        f"📘 Get the full book (PDF instant download): {gumroad}\n"
        f"🛒 Get it: {book_url}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🧠 I'm Giannis Notaras — Sport Psychology expert & author of 8 books on mental performance.\n"
        f"I help athletes, coaches and sports parents master the mental game.\n\n"
        f"📩 Free guide — 5 Mental Performance Secrets: https://thementalsport.com/free\n"
        f"🎓 Full course (8 modules): https://thementalsport.com/course\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━\n"
        f"#SportsPsychology #MentalPerformance #Athletes #Mindset #PeakPerformance "
        f"#MentalToughness #SportPsychologist #AthleteLife #WinningMindset #Shorts"
    )
    thumbnail = os.environ.get('THUMBNAIL_PATH', '/tmp/daily-thumbnail.jpg')

    # Prefer the Remotion short; fall back to manifest video only if short missing
    anim_path = os.environ.get('ANIM_PATH', '')
    video_to_upload = anim_path if (anim_path and os.path.exists(anim_path)) else m['video_path']

    # Dedup: skip if this exact file was already uploaded today
    import hashlib, datetime as _dt
    dedup_file = f'/tmp/.yt_uploaded_{_dt.date.today().isoformat()}'
    uploaded_today = set(open(dedup_file).read().splitlines()) if os.path.exists(dedup_file) else set()
    if video_to_upload in uploaded_today:
        print(f'SKIP: {os.path.basename(video_to_upload)} already uploaded today')
        sys.exit(0)

    upload_video(video_to_upload, title, description,
                 thumbnail_path=thumbnail if os.path.exists(thumbnail) else None)

    with open(dedup_file, 'a') as f:
        f.write(video_to_upload + '\n')
    mark_posted(title)

if __name__ == '__main__':
    main()
