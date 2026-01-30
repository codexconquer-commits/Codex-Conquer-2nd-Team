'''from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.colors import HexColor
from datetime import datetime
import os

BLUE = HexColor("#2563eb")
import re
from html import unescape

def clean_text_for_pdf(text):
    if not text:
        return ""

    # Remove all HTML tags
    text = re.sub(r"<[^>]+>", "", text)

    # Decode HTML entities
    text = unescape(text)

    # Normalize whitespace
    text = text.replace("\r", "").strip()

    return text

def build_letter_pdf(filename, title, body_text, employee_name):
    os.makedirs("generated_letters", exist_ok=True)

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # ✅ CUSTOM STYLE NAMES (NO COLLISION)
    styles.add(ParagraphStyle(
        name="CompanyHeader",
        fontSize=18,
        textColor=BLUE,
        spaceAfter=6,
        fontName="Helvetica-Bold"
    ))

    styles.add(ParagraphStyle(
        name="CompanyInfo",
        fontSize=11,
        spaceAfter=14
    ))

    styles.add(ParagraphStyle(
        name="LetterTitle",
        fontSize=16,
        alignment=TA_CENTER,
        spaceBefore=20,
        spaceAfter=20,
        fontName="Helvetica-Bold"
    ))

    styles.add(ParagraphStyle(
        name="LetterBody",
        fontSize=12,
        leading=22,
        spaceAfter=18,
        alignment=0  # Justified
    ))

    styles.add(ParagraphStyle(
        name="LetterFooter",
        fontSize=11,
        spaceBefore=30
    ))

    story = []

    # -------- HEADER --------
    story.append(Paragraph(
        "<font color='#2563eb'><b>CodexConquer</b></font>",
        styles["CompanyHeader"]
    ))

    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "123 Business Avenue, Suite 100<br/>"
        "New York, NY 10001<br/>"
        "Phone: (555) 123-4567 | Email: hr@codexconquer.com",
        styles["CompanyInfo"]
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(
    "<font color='#2563eb'>______________________________________________</font>",
    styles["CompanyInfo"]
    ))

    story.append(Spacer(1, 18))


    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "<font color='#2563eb'>__________________________________________</font>",
        styles["CompanyInfo"]
    ))

    # -------- TITLE --------
    story.append(Spacer(1, 14))
    story.append(Paragraph(title.upper(), styles["LetterTitle"]))
    story.append(Spacer(1, 18))
    # -------- DATE --------
    story.append(Paragraph(
        f"<b>Date:</b> {datetime.now().strftime('%d %B %Y')}",
        styles["LetterBody"]
    ))

    # -------- GREETING --------
    story.append(Paragraph(f"Dear {employee_name},", styles["LetterBody"]))

    # -------- BODY --------
    clean_body = clean_text_for_pdf(body_text)

    # Body as ONE flowing paragraph (like HTML)
    story.append(Spacer(1, 10))

    story.append(Paragraph(clean_body, styles["LetterBody"]))

    # -------- FOOTER --------
    story.append(Spacer(1, 20))
    story.append(Paragraph("Sincerely,", styles["LetterFooter"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<b>Human Resources Department</b><br/>CodexConquer",
        styles["LetterFooter"]
    ))

    doc.build(story)
'''
'''from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime
import os
from bs4 import BeautifulSoup

def build_letter_pdf(emp, title, body):
    os.makedirs("generated_letters", exist_ok=True)

    filename = f"generated_letters/{title.replace(' ', '_')}_{emp['name'].replace(' ', '_')}.pdf"

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # ---- Custom styles (NO name collisions) ----
    styles.add(ParagraphStyle(
        name="CompanyName",
        fontSize=14,
        textColor="#2563eb",
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        name="CompanyMeta",
        fontSize=10,
        spaceAfter=12
    ))

    styles.add(ParagraphStyle(
        name="LetterTitle",
        fontSize=16,
        alignment=1,
        spaceAfter=20
    ))

    styles.add(ParagraphStyle(
        name="LetterBody",
        fontSize=12,
        leading=20,
        spaceAfter=20
    ))

    styles.add(ParagraphStyle(
        name="LetterFooter",
        fontSize=12,
        spaceBefore=30
    ))

    story = []

    soup = BeautifulSoup(body, "html.parser")
    clean_body = soup.get_text(separator="\n").strip()
    # ---- HEADER ----
    story.append(Paragraph("CodexConquer", styles["CompanyName"]))
    story.append(Paragraph(
        "123 Business Avenue, Suite 100<br/>"
        "New York, NY 10001<br/>"
        "Phone: (555) 123-4567 | Email: hr@codexconquer.com",
        styles["CompanyMeta"]
    ))

    story.append(Spacer(1, 12))

    # ---- TITLE ----
    story.append(Paragraph(title.upper(), styles["LetterTitle"]))

    # ---- DATE ----
    story.append(Paragraph(
        f"<b>Date:</b> {datetime.now().strftime('%d %B %Y')}",
        styles["CompanyMeta"]
    ))

    # ---- GREETING ----
    story.append(Paragraph(f"Dear {emp['name']},", styles["LetterBody"]))

    # ---- BODY (CLEAN, FLOWING TEXT) ----
    for line in clean_body.split("\n"):
        if line.strip():
            story.append(Paragraph(line, styles["LetterBody"]))

    # ---- FOOTER ----
    story.append(Paragraph(
        "Sincerely,<br/><br/>"
        "<b>Human Resources Department</b><br/>"
        "CodexConquer",
        styles["LetterFooter"]
    ))

    doc.build(story)
    return filename
'''
'''
def build_letter_pdf(emp, title, body_text):
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from datetime import datetime
    import os

    os.makedirs("generated_letters", exist_ok=True)

    filename = f"generated_letters/{title.replace(' ', '_')}_{emp['name'].replace(' ', '_')}.pdf"

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="Header",
        fontSize=10,
        spaceAfter=12
    ))

    styles.add(ParagraphStyle(
        name="TitleStyle",
        fontSize=16,
        alignment=1,
        spaceAfter=20
    ))

    styles.add(ParagraphStyle(
        name="Body",
        fontSize=12,
        leading=20,
        spaceAfter=14
    ))

    styles.add(ParagraphStyle(
        name="Footer",
        fontSize=12,
        spaceBefore=30
    ))

    story = []

    # HEADER
    story.append(Paragraph("<b>CodexConquer</b>", styles["Header"]))
    story.append(Paragraph(
        "123 Business Avenue, Suite 100<br/>"
        "New York, NY 10001<br/>"
        "Phone: (555) 123-4567 | Email: hr@codexconquer.com",
        styles["Header"]
    ))

    story.append(Spacer(1, 20))

    # TITLE
    story.append(Paragraph(title.upper(), styles["TitleStyle"]))

    # DATE
    story.append(Paragraph(
        f"<b>Date:</b> {datetime.now().strftime('%d %B %Y')}",
        styles["Header"]
    ))

    story.append(Spacer(1, 12))

    # GREETING
    story.append(Paragraph(f"Dear {emp['name']},", styles["Body"]))

    # BODY (paragraph-safe)
    for para in body_text.split("\n\n"):
        story.append(Paragraph(para.strip(), styles["Body"]))

    # FOOTER
    story.append(Paragraph(
        "Sincerely,<br/><br/>"
        "<b>Human Resources Department</b><br/>"
        "CodexConquer",
        styles["Footer"]
    ))

    doc.build(story)
    return filename
'''
'''
def build_letter_pdf(emp, title, body_text):
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from datetime import datetime
    import os

    os.makedirs("generated_letters", exist_ok=True)

    filename = f"generated_letters/{title.replace(' ', '_')}_{emp['name'].replace(' ', '_')}.pdf"

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="Header",
        fontSize=10,
        spaceAfter=12
    ))

    styles.add(ParagraphStyle(
        name="TitleStyle",
        fontSize=16,
        alignment=1,   # center
        spaceAfter=20
    ))

    styles.add(ParagraphStyle(
        name="Body",
        fontSize=12,
        leading=20,
        spaceAfter=14
    ))

    styles.add(ParagraphStyle(
        name="Footer",
        fontSize=12,
        spaceBefore=30
    ))

    story = []

    # HEADER
    story.append(Paragraph("<b>CodexConquer</b>", styles["Header"]))
    story.append(Paragraph(
        "123 Business Avenue, Suite 100<br/>"
        "New York, NY 10001<br/>"
        "Phone: (555) 123-4567 | Email: hr@codexconquer.com",
        styles["Header"]
    ))

    story.append(Spacer(1, 20))

    # TITLE
    story.append(Paragraph(title.upper(), styles["TitleStyle"]))

    # DATE
    story.append(Paragraph(
        f"<b>Date:</b> {datetime.now().strftime('%d %B %Y')}",
        styles["Header"]
    ))

    story.append(Spacer(1, 12))

    # GREETING
    story.append(Paragraph(f"Dear {emp['name']},", styles["Body"]))

    # BODY (TEXT-ONLY)
    for para in body_text.split("\n\n"):
        if para.strip():
            story.append(Paragraph(para.strip(), styles["Body"]))

    # FOOTER
    story.append(Paragraph(
        "Sincerely,<br/><br/>"
        "<b>Human Resources Department</b><br/>"
        "CodexConquer",
        styles["Footer"]
    ))

    doc.build(story)

    return filename
'''
'''
import pdfkit
import os

WKHTML_PATH = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"

config = pdfkit.configuration(wkhtmltopdf=WKHTML_PATH)

def build_letter_pdf(html_content, filename):
    os.makedirs("generated_letters", exist_ok=True)

    file_path = f"generated_letters/{filename}.pdf"

    options = {
        "page-size": "A4",
        "margin-top": "20mm",
        "margin-right": "20mm",
        "margin-bottom": "20mm",
        "margin-left": "20mm",
        "encoding": "UTF-8",
        "enable-local-file-access": "",
        "print-media-type": "",

    }

    pdfkit.from_string(
        html_content,
        file_path,
        options=options,
        configuration=config
    )

    return file_path
'''
import os
import pdfkit

WKHTML_PATH = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"

config = pdfkit.configuration(wkhtmltopdf=WKHTML_PATH)

def build_letter_pdf(html, filename):
    print("🔥🔥🔥 USING WKHTMLTOPDF VERSION 🔥🔥🔥")
    print("HTML PREVIEW START >>>")
    print(html[:500])
    print("<<< HTML PREVIEW END")

    os.makedirs("generated_letters", exist_ok=True)

    output_path = f"generated_letters/{filename}.pdf"

    options = {
        "page-size": "A4",
        "margin-top": "15mm",
        "margin-bottom": "15mm",
        "margin-left": "15mm",
        "margin-right": "15mm",
        "encoding": "UTF-8",
        "enable-local-file-access": ""
    }

    pdfkit.from_string(
        html,
        output_path,
        configuration=config,
        options=options
    )

    return output_path
