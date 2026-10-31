"""Builds assets/docs/soumik-chatterjee-cv.pdf. Run: python3 scripts/cv.py"""
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'docs', 'soumik-chatterjee-cv.pdf')
BLUE = colors.HexColor('#1A5FD0')
INK = colors.black

doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=40, rightMargin=40, topMargin=28, bottomMargin=20,
                        title='Soumik Chatterjee CV', author='Soumik Chatterjee')
W = A4[0] - 80

name = ParagraphStyle('name', fontName='Helvetica-Bold', fontSize=19, leading=21, textColor=INK)
headline = ParagraphStyle('headline', fontName='Helvetica-Bold', fontSize=11, leading=14, textColor=BLUE)
contact = ParagraphStyle('contact', fontName='Helvetica', fontSize=8.1, leading=11, textColor=INK)
sec = ParagraphStyle('sec', fontName='Helvetica-Bold', fontSize=10.5, leading=13, textColor=BLUE, spaceBefore=5, spaceAfter=1)
body = ParagraphStyle('body', fontName='Helvetica', fontSize=8.4, leading=10.4, textColor=INK)
bul = ParagraphStyle('bul', parent=body, leftIndent=10, bulletIndent=1, spaceAfter=0.5)
bul2 = ParagraphStyle('bul2', parent=bul, leftIndent=18, bulletIndent=9)
role = ParagraphStyle('role', fontName='Helvetica-Bold', fontSize=8.8, leading=11.5, textColor=INK)
role2 = ParagraphStyle('role2', parent=role, fontSize=8.5, leftIndent=8)
date = ParagraphStyle('date', parent=body, alignment=2, fontSize=8.5)
sub = ParagraphStyle('sub', parent=body, fontSize=8.2, leading=10, textColor=BLUE, spaceAfter=0.5)
sub2 = ParagraphStyle('sub2', parent=sub, leftIndent=8)

S = []

def section(t):
    S.append(Paragraph(t, sec))
    S.append(HRFlowable(width='100%', thickness=0.6, color=INK, spaceAfter=3))

def rolerow(title, when, style=role):
    t = Table([[Paragraph(title, style), Paragraph(when, date)]], colWidths=[W * 0.76, W * 0.24])
    t.setStyle(TableStyle([('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                           ('TOPPADDING', (0, 0), (-1, -1), 1.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                           ('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    S.append(t)

def bullets(items, style=bul):
    for i in items:
        S.append(Paragraph(i, style, bulletText='•'))

L = lambda u, t=None: '<link href="%s" color="#1A5FD0">%s</link>' % (u, t or u)

S.append(Paragraph('SOUMIK CHATTERJEE', name))
S.append(Paragraph('AI Specialist | Community and Member Support | AI Workflows | Part-time AI Training', headline))
S.append(Paragraph('Kolkata, India | soumik2808@gmail.com | +91 84202 70119 | %s | %s | %s' % (
    L('https://cosmik.work'), L('https://www.linkedin.com/in/soumikaispecialist'), L('https://github.com/pymikofficial')), contact))

section('SUMMARY')
S.append(Paragraph(
    'AI specialist with 9+ years across software engineering, client operations, education and founder support. I work in three lanes, '
    'community and member support, AI workflows, and part-time AI training. For God Crew I built <b>9 pipeline systems and one founder dashboard</b> that save the '
    'founder <b>20 to 30 hours a month</b> and track a <b>$1.47M CAD pipeline</b>. At CampK12 I held <b>90%+ client retention</b> for 3 years, '
    'and I have mentored <b>1,200+ students</b> across schools, colleges and professional programmes.', body))

section('PROFESSIONAL EXPERIENCE')

rolerow('AI Specialist, independent', 'Feb 2026 - Present')
S.append(Paragraph('CosmikWork (my registered practice, Udyam) | Remote from Kolkata | Workflow, pipeline and outreach systems for early-stage founders', sub))

rolerow('God Crew (Toronto), Chief of Staff to Founder, Growth Systems and Automation', 'Feb 2026 - Present', role2)
S.append(Paragraph('24/7 biohazard and trauma scene cleanup company | Remote', sub2))
bullets([
    'Joined a team of one developer and one salesperson with a payments-only dashboard, mapped the growth process end to end and built '
    '<b>9 pipeline systems feeding one sales dashboard</b>, ideated with the founder and run by me.',
    'Replaced <b>20 to 30 hours a month</b> of the founder\'s manual number-checking with that dashboard, which tracks <b>2,314 prospects '
    'across 924 companies and $1,471,100 CAD in pipeline</b>, built within 90 days.',
    'Kept the pipelines booking <b>60+ qualified calls a month</b>, prospected <b>100+ influencer leads</b> and onboarded the top 12 as '
    'affiliates, and ran a direct mail campaign to <b>1,579 GTA households</b>.',
    'Wrote <b>9 SOPs</b> so every workflow runs without depending on one person.',
], bul2)

rolerow('Navgurukul Foundation, Placement Outreach Manager', 'Mar 2026 - Apr 2026', role2)
S.append(Paragraph('Nonprofit for underserved learners | Remote | 45-day placement drive, reporting to the CxO', sub2))
bullets([
    'Designed the outreach workflow and tracker, trained 3 interns to run it, and reached <b>2,093 companies with 4,200 open roles</b>.',
    'Signed <b>31 hiring partners against a target of 25 (124%)</b>, taking each conversation through to a signed partnership.',
], bul2)

rolerow('Vokido, Growth Consultant, Partner Channels', 'Sep 2026', role2)
S.append(Paragraph('AI spoken-English app for kids | Remote | One-month fixed-term agreement', sub2))
bullets(['Designed the partner onboarding workflow and commission model for pan-India partner centres.'], bul2)

rolerow('Fellow Leader, Math and Computer (Grades 5-12)', 'Apr 2024 - Mar 2026')
S.append(Paragraph('Teach For India (education nonprofit) | Kolkata | KECT Academy, St. Patrick\'s Day School (Dhapa)', sub))
bullets([
    'Introduced an AI-assisted lesson prep workflow that <b>cut teacher prep time by 40%</b> across Math and Computer studies.',
    'Ran a repeatable assess, track and intervene cycle for <b>500+ students</b> in two schools (80 taught daily), lifting average class '
    'assessment scores by <b>20%</b>.',
    'Engaged <b>300+ parents and staff</b> through structured progress updates and managed CSR partner Axis Max Life Insurance.',
])

rolerow('Client Relations and College Talent Manager', 'Mar 2020 - Apr 2023')
S.append(Paragraph('CampK12 (US-based online coding and AI education startup) | India / US / UK / UAE / Australia (Remote)', sub))
bullets([
    'Automated instructor outreach, <b>cutting manual outreach effort by 30%</b>, and standardised the recruit, onboard and match process '
    'for a <b>400+ instructor workforce</b>, 99% of them college students.',
    'Matched instructors to each client\'s needs across India, US, UK, UAE and Australia accounts, holding <b>90%+ client retention for '
    '3 years</b>, including saving a dissatisfied US customer\'s year-long subscription with a bilingual English-Spanish instructor.',
])

rolerow('Senior Software Engineering Analyst', 'Apr 2015 - Apr 2019')
S.append(Paragraph('Accenture | Chennai and Hyderabad', sub))
bullets([
    'Built <b>Python automation frameworks</b> for clients including UCI Hospital and Bank of America, <b>reducing post-deployment '
    'defects by 15%</b>.',
    'Bridged US, UAE and European clients with engineering teams, and onboarded clients directly in the final 1.5 years.',
])

section('COMMUNITY AND TRAINING')

rolerow('Community Contributor', 'Oct 2026 - Present')
S.append(Paragraph('AI Automation Society (Skool community) | Remote | Volunteer', sub))
bullets(['Helped <b>17 members</b> and logged <b>17 onboarding gaps</b> with a suggested fix for each, shared with the AIS team.'])

rolerow('Part-time AI Trainer', '2016 - Present')
S.append(Paragraph('Simplilearn (Oxford programme) | Masters\' Union', sub))
bullets([
    'Teaching Assistant on Simplilearn\'s Oxford programme on a one-year contract from Sep 2026, an AI session for Masters\' Union in '
    'Oct 2026, and <b>500+ college students</b> mentored in Computer Science and AI/ML.',
])

section('SHIPPED AI TOOLS')
S.append(Paragraph(
    '<b>14 live tools</b> built solo with the Claude API, including <b>Process Mapper</b>, <b>SOP Generator</b>, <b>Meeting Minutes Extractor</b> '
    'and <b>Executive Briefing Generator</b>. Two Chrome extensions with <b>300+ users</b>. All at %s' % L('https://cosmik.work/shipped'), body))

section('SKILLS AND TOOLS')
S.append(Paragraph('<b>Skills</b> member onboarding and support, escalation, process mapping, workflow design and testing, automation, KPI dashboards, '
                   'SOPs and handover, CRM pipelines, outbound prospecting, AI training and mentoring', body))
S.append(Paragraph('<b>Tools</b> Claude, Claude Code, Claude API, n8n, Make.com, Python, Apollo.io, Clay, GoHighLevel, Skool, Google Workspace, '
                   'Slack, VS Code, GitHub, Netlify', body))

section('EDUCATION')
S.append(Paragraph('B.Tech, Computer Science, CIEM (WBUT), 2014 | PG Certificate, Data Science and Engineering, Great Lakes Institute, 2020', body))

doc.build(S)
print('wrote', os.path.abspath(OUT))
