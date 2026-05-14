#!/usr/bin/env python3
"""Generate the Free Chapter PDF lead magnet."""
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER

OUT = '/home/notaras/thementalsport/public/free-chapter.pdf'

styles = getSampleStyleSheet()
title_style = ParagraphStyle('TT', parent=styles['Heading1'], fontSize=32, textColor=HexColor('#0a0a0a'), alignment=TA_CENTER, spaceAfter=20, fontName='Helvetica-Bold')
sub_style = ParagraphStyle('SUB', parent=styles['Heading2'], fontSize=14, textColor=HexColor('#666'), alignment=TA_CENTER, spaceAfter=40)
h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=20, textColor=HexColor('#dc2626'), spaceBefore=20, spaceAfter=12, fontName='Helvetica-Bold')
body = ParagraphStyle('B', parent=styles['BodyText'], fontSize=12, leading=18, textColor=HexColor('#1a1a1a'), spaceAfter=12)
quote = ParagraphStyle('Q', parent=styles['BodyText'], fontSize=14, leading=22, textColor=HexColor('#444'), leftIndent=24, rightIndent=24, spaceAfter=18, fontName='Helvetica-Oblique')
cta = ParagraphStyle('CTA', parent=styles['Heading2'], fontSize=18, textColor=HexColor('#dc2626'), alignment=TA_CENTER, spaceBefore=30, fontName='Helvetica-Bold')

doc = SimpleDocTemplate(OUT, pagesize=LETTER, leftMargin=0.8*inch, rightMargin=0.8*inch, topMargin=1*inch, bottomMargin=0.8*inch, title='The Competition Protocol - Free Chapter', author='Giannis Notaras')

flow = []
flow.append(Paragraph('THE COMPETITION<br/>PROTOCOL', title_style))
flow.append(Paragraph('FREE CHAPTER · BY GIANNIS NOTARAS', sub_style))
flow.append(Paragraph('Chapter 1: The Biology of Choking', h2))

flow.append(Paragraph("You've practiced this move a thousand times. You can do it in your sleep. But today — with the crowd watching and the clock ticking — you freeze. Your legs feel like cement. Your mind goes blank.", body))
flow.append(Paragraph('You just choked.', body))
flow.append(Paragraph('<b>But here is the good news: You aren\'t a coward. You are biology.</b>', body))

flow.append(Paragraph('The Tiger in the Room', h2))
flow.append(Paragraph("When you step onto the field, your brain's threat detection center (the <b>Amygdala</b>) scans for danger. In the wild, danger meant a tiger. In sports, danger means humiliation, losing, or disappointing your team.", body))
flow.append(Paragraph("Your brain doesn't know the difference. It dumps <b>cortisol</b> and <b>adrenaline</b> into your blood to help you fight the tiger.", body))
flow.append(Paragraph('• Heart rate spikes (to pump blood to muscles)<br/>• Vision tunnels (to focus on the threat)<br/>• Fine motor skills shut down (you don\'t need fine motor skills to punch a tiger)', body))
flow.append(Paragraph("This is why you can run fast (gross motor skill) but can't sink a putt (fine motor skill).", body))

flow.append(Paragraph('The GSP Protocol: Fear Is Fuel', h2))
flow.append(Paragraph("Georges St-Pierre is one of the greatest MMA fighters of all time. He was also terrified before every fight. He admitted to vomiting backstage. He admitted to fearing humiliation more than physical pain.", body))
flow.append(Paragraph("But GSP had a secret weapon. He didn't try to stop the fear. He <b>reframed</b> it.", body))
flow.append(Paragraph('"The fear I felt before the fight was the same energy that made me train harder than anyone. Without the fear, I am average. With it, I am dangerous."', quote))
flow.append(Paragraph("Same biology. Different label. Different result.", body))

flow.append(PageBreak())
flow.append(Paragraph('The Reframe Protocol (Use This Today)', h2))
flow.append(Paragraph("The next time you feel pre-event panic, do not say:", body))
flow.append(Paragraph('<i>"I am nervous."</i>', quote))
flow.append(Paragraph("Instead, say (out loud, even):", body))
flow.append(Paragraph('<i>"I am ready. My body is preparing me."</i>', quote))
flow.append(Paragraph("This isn't positive thinking. This is biology. Cortisol and adrenaline are exactly what you need to perform at maximum capacity. The only question is whether you label that energy as <b>threat</b> or as <b>readiness</b>.", body))
flow.append(Paragraph("Elite athletes don't have less fear. They have a better label.", body))

flow.append(Paragraph('What This Means for You', h2))
flow.append(Paragraph("This was Chapter 1 of <b>The Competition Protocol</b>. The full book covers the complete 7-day countdown system used by Olympic athletes and elite performers:", body))
flow.append(Paragraph('• Day 7: The Mamba Contract (Kobe\'s commitment ritual)<br/>• Day 6: Audio conditioning (Tom Brady\'s soundtrack method)<br/>• Day 5: Breath control (Stanford\'s physiological sigh)<br/>• Day 4: Negative visualization (Phelps\' Beijing protocol)<br/>• Day 3: The Anchor (instant flow state trigger)<br/>• Day 2: Gear audit + SOPs<br/>• Day 1: The Final Hours protocol (the GSP closing routine)', body))

flow.append(Paragraph("If you want the complete system:", body))
flow.append(Paragraph('Get The Competition Protocol on Amazon → $9.99', cta))
flow.append(Paragraph('amazon.com/dp/B0GKF5TGMQ', body))

flow.append(Spacer(1, 0.3*inch))
flow.append(Paragraph("Or go further with the full 8-week course:", body))
flow.append(Paragraph('The Mental Performance Protocol → thementalsport.com/course', cta))

flow.append(Spacer(1, 0.5*inch))
flow.append(Paragraph("— Giannis Notaras<br/>Mental Performance Expert<br/>thementalsport.com", body))

doc.build(flow)
print(f'Generated: {OUT}')
import os
print(f'Size: {os.path.getsize(OUT)} bytes')
