from fileinput import filename
from pydoc import html
import random
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, render_template, request, redirect, url_for, session, send_file,jsonify
import sqlite3
from functools import wraps
from datetime import date, datetime,timedelta
from utils.email_service import send_email
#from utils.pdf_generator import generate_offer_letter_pdf, generate_generic_letter_pdf
from utils.pdf_generator import build_letter_pdf
import secrets
from bs4 import BeautifulSoup, NavigableString
import os
from flask import current_app
from dateutil.relativedelta import relativedelta

'''from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.colors import HexColor, black
from reportlab.lib.units import inch
from bs4 import BeautifulSoup
import os

def generate_offer_letter_pdf(emp, content_html):
    os.makedirs("generated_letters", exist_ok=True)

    filename = f"generated_letters/Offer_Letter_{emp['name'].replace(' ', '_')}.pdf"

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    blue = HexColor("#2563eb")

    # -------- STYLES --------
    header_style = ParagraphStyle(
        "Header",
        fontSize=11,
        textColor=black,
        spaceAfter=6
    )

    company_style = ParagraphStyle(
        "Company",
        fontSize=14,
        textColor=blue,
        spaceAfter=6,
        fontName="Helvetica-Bold"
    )

    title_style = ParagraphStyle(
        "Title",
        fontSize=16,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName="Helvetica-Bold"
    )

    body_style = ParagraphStyle(
        "Body",
        fontSize=18,
        spaceAfter=16
    )

    footer_style = ParagraphStyle(
        "Footer",
        fontSize=11,
        spaceBefore=25
    )

    story = []

    # -------- COMPANY HEADER --------
    story.append(Paragraph("CodexConquer", company_style))
    story.append(Paragraph(
        "123 Business Avenue, Suite 100<br/>"
        "New York, NY 10001<br/>"
        "Phone: (555) 123-4567 | Email: hr@codexconquer.com",
        header_style
    ))

    # -------- BLUE DIVIDER --------
    divider = Table([[""]], colWidths=[doc.width])
    divider.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 2, blue),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
    ]))
    story.append(divider)

    # -------- TITLE --------
    story.append(Paragraph("OFFER LETTER", title_style))

    # -------- BODY CONTENT --------
    soup = BeautifulSoup(content_html, "html.parser")

    for p in soup.find_all("p"):
        text = p.get_text(" ",strip=True)

    # 🚫 skip header/footer text
        if "CodexConquer" in text or "Human Resources Department" in text:
            continue

        if text:
            story.append(Paragraph(text, body_style))

    # -------- FOOTER --------
    story.append(Spacer(1, 30))
    story.append(Paragraph("Sincerely,", body_style))
    story.append(Spacer(1, 18))
    story.append(Paragraph(
        "<b>Human Resources Department</b><br/>CodexConquer",
        body_style
    ))

    doc.build(story)
    return filename

'''

app = Flask(__name__)
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,   # JS cannot access cookies
    SESSION_COOKIE_SAMESITE="Lax"   # Protect against CSRF
)
app.secret_key = "supersecretkey"

# -------------------- LANDING PAGE --------------------

@app.route("/")
def landing():
    return render_template("public/index.html")

# -------------------- LOGIN REQUIRED DECORATOR --------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function


# -------------------- DATABASE CONNECTION --------------------
def get_db_connection():
    conn = sqlite3.connect("database/hr_system.db")
    conn.row_factory = sqlite3.Row
    return conn


# -------------------- HOME --------------------
@app.route("/")
def home():
    return "HR Automated Letter System - Database Connected 🚀"


# -------------------- LOGIN --------------------
'''@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            (username, password)
        ).fetchone()
        conn.close()

        if user:
            session["user"] = user["username"]
            return redirect(url_for("dashboard"))
        else:
            return "❌ Invalid username or password"

    return render_template("auth/login.html")
'''
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form["username"]
        password = request.form["password"]

        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (username,)
        ).fetchone()
        conn.close()

        #if user and check_password_hash(user["password"], password):
         #   session["user"] = user["username"]
          #  return redirect(url_for("dashboard"))
        if user and check_password_hash(user["password"], password):
            session.clear()              # 🔐 clear old session
            session["user"] = user["username"]
            return redirect(url_for("dashboard"))
  
        else:
            return "❌ Invalid username or password"

    return render_template("auth/login.html")


# -------------------- DASHBOARD --------------------
'''@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard/dashboard.html")
'''
@app.route("/dashboard")
@login_required
def dashboard():
    conn = get_db_connection()

    total_letters = conn.execute("""
        SELECT COUNT(*) FROM letters WHERE status = 'FINAL'
    """).fetchone()[0]

    total_drafts = conn.execute("""
        SELECT COUNT(*) FROM letters WHERE status = 'DRAFT'
    """).fetchone()[0]

    conn.close()

    return render_template(
        "dashboard/dashboard.html",
        total_letters=total_letters,
        total_drafts=total_drafts
    )


# -------------------- ADD EMPLOYEE --------------------
@app.route("/add-employee", methods=["GET", "POST"])
@login_required
def add_employee():
    if request.method == "POST":
        name = request.form["name"]
        designation = request.form["designation"]
        joining_date = request.form["joining_date"]
        email = request.form["email"]

        conn = get_db_connection()
        conn.execute(
            "INSERT INTO employees (name, designation, joining_date, email) VALUES (?, ?, ?, ?)",
            (name, designation, joining_date, email)
        )
        conn.commit()
        conn.close()

        return "✅ Employee added successfully!"

    return render_template("dashboard/add_employee.html")


# -------------------- VIEW EMPLOYEES --------------------
@app.route("/employees")
@login_required
def employees():
    conn = get_db_connection()
    employees = conn.execute("SELECT * FROM employees").fetchall()
    conn.close()
    return render_template("dashboard/employees.html", employees=employees)


# -------------------- OFFER LETTER --------------------

'''@app.route("/offer-letter/<int:emp_id>")
@login_required
def offer_letter(emp_id):
    conn = get_db_connection()

    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()

    if not emp:
        conn.close()
        return "Employee not found"

    # 1️⃣ Generate PDF
    pdf_path = generate_offer_letter_pdf(emp)

    # 2️⃣ Save letter info
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, created_at)
        VALUES (?, ?, ?, ?)
    """, (
        emp_id,
        "Offer Letter",
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()

    # 3️⃣ Redirect to download route
    filename = pdf_path.split("/")[-1]
    return redirect(url_for("download_letter", filename=filename))
'''
@app.route("/offer-letter/<int:emp_id>")
@login_required
def offer_letter(emp_id):
    conn = get_db_connection()

    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()

    conn.close()

    if not emp:
        return "Employee not found"
    joining_date_obj = datetime.strptime(emp["joining_date"], "%Y-%m-%d")
    relieving_date_obj = joining_date_obj + relativedelta(months=3)
    relieving_date = relieving_date_obj.strftime("%d %B %Y")
    # 👉 Just open editable preview (NO PDF here)
    return render_template(
        "letters/offer_letter_preview.html",
        emp_id=emp["id"],
        name=emp["name"],
        designation=emp["designation"],
        stipend="unpaid internship",
        joining_date=emp["joining_date"],
        relieving_date=relieving_date,
        today=datetime.now().strftime("%d %B %Y")
    )
#-------------------- OFFER LETTER DOCUMENT (PRINTABLE) --------------------
'''@app.route("/offer-letter/document/<int:emp_id>")
def offer_letter_document(emp_id):
    emp = {
        "name": "Test User",
        "designation": "Software Intern"
    }

    return render_template(
        "letters/offer_letter_document.html",
        name=emp["name"],
        designation=emp["designation"],
        today=date.today().strftime("%d %B %Y"),
        stipend="Unpaid Internship"
    )
'''

# -------------------- GENERATE LETTER (ALL TYPES) --------------------
'''@app.route("/generate-letter", methods=["GET", "POST"])
@login_required
def generate_letter():
    if request.method == "GET":
        conn = get_db_connection()
        employees = conn.execute("SELECT * FROM employees").fetchall()
        conn.close()
        return render_template(
            "dashboard/generate_letter.html",
            employees=employees
        )

    # ---------- POST ----------
    emp_id = request.form.get("employee_id")
    letter_type = request.form.get("letter_type")

    # ✅ CRITICAL VALIDATION
    if not emp_id or not emp_id.isdigit():
        return "Employee not selected properly. Please select from dropdown."

    emp_id = int(emp_id)

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()
    conn.close()

    if not emp:
        return "Employee not found"

    # ---------- PREVIEW ----------
    if letter_type == "offer":
        return render_template(
            "letters/offer_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            designation=emp["designation"],
            joining_date=emp["joining_date"],
            today=date.today().strftime("%d %B %Y")
        )

    elif letter_type == "relieving":
        return render_template(
            "letters/relieving_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            title="RELIEVING LETTER",
            body=f"This is to formally relieve you from your position of {emp['designation']}.",
            letter_type="Relieving Letter",
            today=date.today().strftime("%d %B %Y")
        )

    elif letter_type == "warning":
        return render_template(
            "letters/generic_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            title="WARNING LETTER",
            body=f"This letter serves as a formal warning regarding your conduct as {emp['designation']}.",
            letter_type="Warning Letter",
            today=date.today().strftime("%d %B %Y")
        )

    elif letter_type == "termination":
        return render_template(
            "letters/generic_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            title="TERMINATION LETTER",
            body=f"Your employment as {emp['designation']} is terminated effective immediately.",
            letter_type="Termination Letter",
            today=date.today().strftime("%d %B %Y")
        )

    elif letter_type == "appreciation":
        return render_template(
            "letters/generic_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            title="CERTIFICATE OF APPRECIATION",
            body=f"This certificate is awarded for outstanding performance as {emp['designation']}.",
            letter_type="Certificate of Appreciation",
            today=date.today().strftime("%d %B %Y")
        )

    return "Invalid letter type"
'''
@app.route("/generate-letter", methods=["GET", "POST"])
@login_required
def generate_letter():

    # ---------- GET ----------
    if request.method == "GET":
        conn = get_db_connection()
        employees = conn.execute("SELECT * FROM employees").fetchall()
        conn.close()
    
        return render_template(
            "dashboard/generate_letter.html",
            employees=employees
        )

    # ---------- POST ----------
    emp_id = request.form.get("employee_id")
    letter_type = request.form.get("letter_type")

    # Validation
    if not emp_id or not emp_id.isdigit():
        return "Employee not selected properly."

    emp_id = int(emp_id)

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()
    conn.close()

    if not emp:
        return "Employee not found"
        # 🔥 AUTO RELIEVING DATE CALCULATION
    joining_date_obj = datetime.strptime(emp["joining_date"], "%Y-%m-%d")
    relieving_date_obj = joining_date_obj + relativedelta(months=3)
    relieving_date = relieving_date_obj.strftime("%d %B %Y")

    today = date.today().strftime("%d %B %Y")

    # ---------------- OFFER LETTER (SEPARATE FLOW) ----------------
    if letter_type == "offer":
        return render_template(
            "letters/offer_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            designation=emp["designation"],
            joining_date=emp["joining_date"],
            relieving_date=relieving_date,
            today=today
        )

    # ---------------- RELIEVING LETTER ----------------
    if letter_type == "relieving":
        return render_template(
            "letters/generic_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            designation=emp["designation"],
            joining_date=emp["joining_date"],
            relieving_date=relieving_date,  # temp
            title="RELIEVING LETTER",
            letter_type="Relieving Letter",
            body="",  # NOT USED
            today=today
        )

    # ---------------- WARNING LETTER ----------------
    if letter_type == "warning":
        return render_template(
            "letters/generic_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            title="WARNING LETTER",
            letter_type="Warning Letter",
            body=f"This letter serves as a formal warning regarding your conduct as {emp['designation']}.",
            today=today
        )

    # ---------------- TERMINATION LETTER ----------------
    '''if letter_type == "termination":
        return render_template(
            "letters/generic_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            title="TERMINATION LETTER",
            letter_type="Termination Letter",
            body=f"Your employment as {emp['designation']} is terminated effective immediately.",
            today=today
        )
'''
    if letter_type == "termination":
        return render_template(
            "letters/generic_letter_preview.html",
            title="TERMINATION LETTER",
            letter_type="Termination Letter",
            emp_id=emp["id"],
            name=emp["name"],
            joining_date=emp["joining_date"],
            relieving_date=relieving_date,
            today=date.today().strftime("%d %B %Y")
        )

    # ---------------- APPRECIATION LETTER ----------------
    '''if letter_type == "appreciation":
        return render_template(
            "letters/generic_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            title="CERTIFICATE OF APPRECIATION",
            letter_type="Certificate of Appreciation",
            body=f"This certificate is awarded for outstanding performance as {emp['designation']}.",
            today=today
        )
'''
    if letter_type == "appreciation":
        return render_template(
            "letters/generic_letter_preview.html",
            emp_id=emp["id"],
            name=emp["name"],
            designation=emp["designation"],
            title="CERTIFICATE OF APPRECIATION",
            letter_type="Appreciation Letter",
            joining_date=emp["joining_date"],
            relieving_date=relieving_date,
            today=date.today().strftime("%d %B %Y")
        )

    return "Invalid letter type"


# -------------------- DOWNLOAD PDF --------------------
'''@app.route("/generated_letters/<path:filename>")
@login_required
def download_letter(filename):
    return send_file(f"generated_letters/{filename}", as_attachment=True)
'''
@app.route("/generated_letters/<path:filename>")
@login_required
def download_letter(filename):
    conn = get_db_connection()

    # Save download time
    conn.execute(
        "UPDATE letters SET downloaded_at = ? WHERE file_path = ?",
        (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), f"generated_letters/{filename}")
    )

    conn.commit()
    conn.close()

    return send_file(f"generated_letters/{filename}", as_attachment=True)


# -------------------- LOGOUT --------------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# -------------------- INIT DB (ONE TIME) --------------------
@app.route("/init-db")
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            password TEXT,
            role TEXT,
            email TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            designation TEXT,
            joining_date TEXT,
            email TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS letters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            letter_type TEXT,
            file_path TEXT,
            status TEXT,
            created_at TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            address TEXT,
            hr_email TEXT,
            signature_name TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hr_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            full_name TEXT,
            email TEXT,
            phone TEXT,
            role TEXT
        )
    """)


    conn.commit()
    conn.close()

    return "✅ Database initialized successfully"

# -------------------- ADD DEFAULT HR --------------------
'''@app.route("/add-hr")
def add_hr():
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        ("admin", "admin123", "HR")
    )
    conn.commit()
    conn.close()
    return "✅ HR user created successfully"'''
@app.route("/add-hr")
def add_hr():
    hashed_password = generate_password_hash("admin123")

    conn = get_db_connection()
    conn.execute(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        ("admin", "harshithach2812@gmail.com", hashed_password, "HR")
    )
    conn.commit()
    conn.close()

    return "✅ HR user created with hashed password"
# -------------------- FINALIZE OFFER LETTER --------------------

'''@app.route("/finalize-offer-letter", methods=["POST"])
@login_required
def finalize_offer_letter():
    emp_id = request.form["emp_id"]
    content = request.form["content"]   # ✅ THIS IS THE KEY

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()

    if not emp:
        conn.close()
        return "Employee not found"

    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph
    from reportlab.lib.units import inch
    from bs4 import BeautifulSoup
    import os
    from datetime import datetime

    os.makedirs("generated_letters", exist_ok=True)
    filename = f"generated_letters/Offer_Letter_{emp['name'].replace(' ', '_')}.pdf"

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    story = []

    # ✅ Convert HTML → PDF paragraphs
    soup = BeautifulSoup(content, "html.parser")
    for element in soup.find_all(["p", "div"]):
        text = element.get_text(strip=True)
        if text:
            story.append(Paragraph(text, styles["Normal"]))
            story.append(Paragraph("<br/>", styles["Normal"]))

    doc.build(story)

    # Save in DB
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        emp_id,
        "Offer Letter",
        filename,
        "FINAL",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()

    return f"""
        <h3>Offer Letter Generated Successfully ✅</h3>
        <a href='/{filename}' target='_blank'>Download Final PDF</a>
    """
'''
'''@app.route("/finalize-offer-letter", methods=["POST"])
@login_required
def finalize_offer_letter():
    emp_id = request.form["emp_id"]
    content = request.form["content"]   # HTML from editor

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()

    conn.close()

    if not emp:
        return "Employee not found"

    # ✅ Generate clean formatted PDF
    pdf_path = generate_offer_letter_pdf(emp, content)
    
    # Save record
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        "Offer Letter",
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

    filename = pdf_path.split("/")[-1]

    return f"""
        <h3>Offer Letter Generated Successfully ✅</h3>
        <a href="/generated_letters/{filename}" target="_blank">
            Download Offer Letter
        </a>
    """
'''
'''@app.route("/finalize-offer-letter", methods=["POST"])
@login_required
def finalize_offer_letter():
    emp_id = request.form["emp_id"]
    #content = request.form["content"]  # BODY ONLY (plain text)

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()

    if not emp:
        conn.close()
        return "Employee not found"

    # ✅ Generate PDF (filename returned)
    html = render_template(
        "offer_letter_preview.html",
        name=os.name,
        designation=designation,
        joining_date=joining_date,
        stipend=stipend,
        today=today,
        emp_id=emp_id,
        draft_id=draft_id
    )

    pdf_path = build_letter_pdf(html, "offer_letter")

    #pdf_path = build_letter_pdf(emp,"Offer Letter",content)

    # ✅ Save to DB
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        "Offer Letter",
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()

    filename = pdf_path.split("/")[-1]

    return f"""
        <h3>Offer Letter Generated Successfully ✅</h3>
        <a href="/{pdf_path}" target="_blank">⬇ Download Offer Letter</a>
    """
'''
'''@app.route("/finalize-offer-letter", methods=["POST"])
@login_required
def finalize_offer_letter():
    emp_id = request.form["emp_id"]

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()

    if not emp:
        conn.close()
        return "Employee not found"

    # ✅ Prepare values for template
    name = emp["name"]
    designation = emp["designation"]
    joining_date = emp["joining_date"]
    #stipend = emp["stipend"]
    today = datetime.now().strftime("%d %B %Y")
    draft_id = None  # final letter, not draft

    # ✅ Render SAME HTML used for preview
    html = render_template(
        "offer_letter_preview.html",
        name=name,
        designation=designation,
        joining_date=joining_date,
        #stipend=stipend,
        today=today,
        emp_id=emp_id,
        draft_id=draft_id
    )

    # ✅ Generate PDF from HTML
    pdf_path = build_letter_pdf(html, f"offer_letter_{emp_id}")

    # ✅ Save PDF info to DB
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        "Offer Letter",
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()

    return f"""
        <h3>Offer Letter Generated Successfully ✅</h3>
        <a href="/{pdf_path}" target="_blank">⬇ Download Offer Letter</a>
    """
'''
'''@app.route("/finalize-offer-letter", methods=["POST"])
@login_required
def finalize_offer_letter():
    emp_id = request.form["emp_id"]

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()

    if not emp:
        conn.close()
        return "Employee not found"

    name = emp["name"]
    designation = emp["designation"]
    joining_date = emp["joining_date"]

    # ✅ SAFE stipend handling
    stipend = emp["stipend"] if "stipend" in emp.keys() else "Unpaid Internship"

    today = datetime.now().strftime("%d %B %Y")
    draft_id = None

    html = render_template(
        "letters/offer_letter_pdf.html",
        name=name,
        designation=designation,
        joining_date=joining_date,
        stipend=stipend,
        today=today,
        emp_id=emp_id,
        draft_id=draft_id
    )

    #pdf_path = build_letter_pdf(html, f"offer_letter_{emp_id}")
    pdf_html = render_template(
    "letters/pdf_wrapper.html",
    content=html
)

    pdf_path = build_letter_pdf(pdf_html, f"offer_letter_{emp_id}")

    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        "Offer Letter",
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()

    return f"""
        <h3>Offer Letter Generated Successfully ✅</h3>
        <a href="/{pdf_path}" target="_blank">⬇ Download Offer Letter</a>
    """
'''
'''@app.route("/finalize-offer-letter", methods=["POST"])
@login_required
def finalize_offer_letter():
    emp_id = request.form["emp_id"]
    html_content = request.form.get("content")  # FULL paperContent

    if not html_content:
        return "No content received"

    pdf_html = render_template(
        "letters/pdf_wrapper.html",
        content=html_content
    )

    pdf_path = build_letter_pdf(pdf_html, f"offer_letter_{emp_id}")

    conn = get_db_connection()
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        "Offer Letter",
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        import os
        from flask import current_app

        static_image_path = os.path.join(
            current_app.root_path,
            "static",
            "images",
            "fsd.webp"
        )

        static_image_path = f"file:///{static_image_path.replace(os.sep, '/')}"
        ))
    conn.commit()
    conn.close()

    return f"""
        <h3>Offer Letter Generated Successfully ✅</h3>
        <a href="/{pdf_path}" target="_blank">⬇ Download Offer Letter</a>
    """
'''
'''@app.route("/finalize-offer-letter", methods=["POST"])
@login_required
def finalize_offer_letter():
    emp_id = request.form["emp_id"]
    html_content = request.form.get("content")  # FULL paperContent HTML

    if not html_content or not html_content.strip():
        return "No content received"

    # ✅ Wrap HTML ONLY to remove UI (sidebar, buttons)
    pdf_html = render_template(
        "letters/pdf_wrapper.html",
        content=html_content
    )

    # ✅ Generate PDF
    pdf_path = build_letter_pdf(
        pdf_html,
        f"offer_letter_{emp_id}"
    )

    # ✅ Save DB record
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        "Offer Letter",
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

    return f"""
        <h3>Offer Letter Generated Successfully ✅</h3>
        <a href="/{pdf_path}" target="_blank">⬇ Download Offer Letter</a>
    """
    '''
@app.route("/finalize-offer-letter", methods=["POST"])
@login_required
def finalize_offer_letter():
    emp_id = request.form["emp_id"]
    html_content = request.form.get("content")  # FULL paperContent

    if not html_content:
        return "No content received from editor"

    logo_path = os.path.join(
    current_app.root_path,
    "static",
    "images",
    "logo.png"
)

    logo_path = f"file:///{logo_path.replace(os.sep, '/')}"

    html_content = html_content.replace(
    '/static/images/logo.png',
    logo_path
)

    pdf_html = render_template(
        "letters/pdf_wrapper.html",
        content=html_content
    )

    pdf_path = build_letter_pdf(pdf_html, f"offer_letter_{emp_id}")

    conn = get_db_connection()
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        "Offer Letter",
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

    return f"""
        <h3>Offer Letter Generated Successfully ✅</h3>
        <a href="/{pdf_path}" target="_blank">⬇ Download Offer Letter</a>
    """



# -------------------- FINALIZE GENERIC LETTER --------------------


'''@app.route("/finalize-generic-letter", methods=["POST"])
@login_required
def finalize_generic_letter():
    print("🔥 FINAL GENERIC LETTER ROUTE 🔥")
    print("FORM DATA:", request.form)

    emp_id = request.form["emp_id"]
    letter_type = request.form["letter_type"]
    content = request.form["content"]

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()

    if not emp:
        conn.close()
        return "Employee not found"

    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph
    from reportlab.lib.styles import getSampleStyleSheet
    from bs4 import BeautifulSoup, NavigableString
    import os
    from datetime import datetime

    os.makedirs("generated_letters", exist_ok=True)

    filename = f"generated_letters/{letter_type.replace(' ', '_')}_{emp['name'].replace(' ', '_')}.pdf"

    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    story = []

    # ---------------- CLEAN HTML ----------------
    soup = BeautifulSoup(content, "html.parser")

    # 🔥 REMOVE stray text nodes (THIS IS THE FIX)
    for node in soup.find_all(string=True):
        if isinstance(node, NavigableString):
            if node.parent.name not in ["p"]:
                node.extract()

    # ---------------- BUILD PDF ----------------
    for p in soup.find_all("p"):
        text = p.get_text(strip=True)
        if text:
            story.append(Paragraph(text, styles["Normal"]))
            story.append(Paragraph("<br/>", styles["Normal"]))

    doc.build(story)

    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        emp_id,
        letter_type,
        filename,
        "FINAL",
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()

    return f"""
        <h3>{letter_type} Generated Successfully ✅</h3>
        <a href='/{filename}' target='_blank'>Download PDF</a>
    """
'''
'''@app.route("/finalize-generic-letter", methods=["POST"])
@login_required
def finalize_generic_letter():
    emp_id = request.form["emp_id"]
    title = request.form["title"]
    content = request.form["content"]   # FULL HTML from editor
    draft_id = request.form.get("draft_id")

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()

    if not emp:
        conn.close()
        return "Employee not found"

    # ✅ Generate clean PDF using SAME ENGINE as offer letter
    pdf_path = generate_generic_letter_pdf(emp, title, content)

    # Save / update DB
    if draft_id:
        conn.execute("""
            UPDATE letters
            SET file_path = ?, status = 'FINAL'
            WHERE id = ?
        """, (pdf_path, draft_id))
    else:
        conn.execute("""
            INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
            VALUES (?, ?, ?, 'FINAL', ?)
        """, (
            emp_id,
            title,
            pdf_path,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))

    conn.commit()
    conn.close()

    filename = pdf_path.split("/")[-1]

    return f"""
        <h3>{title} Generated Successfully ✅</h3>
        <a href="/generated_letters/{filename}" target="_blank">
            Download PDF
        </a>
    """
'''
'''@app.route("/finalize-generic-letter", methods=["POST"])
@login_required
def finalize_generic_letter():
    emp_id = request.form["emp_id"]
    title = request.form["title"]
    content = request.form["content"]

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()

    if not emp:
        conn.close()
        return "Employee not found"

    filename = f"generated_letters/{title.replace(' ', '_')}_{emp['name'].replace(' ', '_')}.pdf"

    from utils.pdf_generator import build_letter_pdf

    build_letter_pdf(
        filename=filename,
        title=title,
        body_text=content,
        employee_name=emp["name"]
    )

    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        title,
        filename,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()

    return f"""
        <h3>{title} Generated Successfully ✅</h3>
        <a href='/{filename}' target='_blank'>Download PDF</a>
    """
'''
'''@app.route("/finalize-generic-letter", methods=["POST"])
@login_required
def finalize_generic_letter():
    emp_id = request.form["emp_id"]
    letter_type = request.form["letter_type"]
    body = request.form["content"]  # BODY ONLY

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()
    conn.close()

    if not emp:
        return "Employee not found"

    pdf_path = build_letter_pdf(emp, letter_type, body)

    conn = get_db_connection()
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        letter_type,
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

    filename = pdf_path.split("/")[-1]
    return f"<a href='/generated_letters/{filename}' target='_blank'>Download PDF</a>"
'''
'''@app.route("/finalize-generic-letter", methods=["POST"])
@login_required
def finalize_generic_letter():
    emp_id = request.form["emp_id"]
    letter_type = request.form["letter_type"]
    body = request.form.get("content", "")

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()
    conn.close()

    if not emp:
        return "Employee not found"

    today = datetime.now().strftime("%d %B %Y")

    # 🔀 STEP 4A: If Relieving Letter → use relieving template
    if letter_type == "Relieving Letter":
        html = render_template(
            "letters/generic_letter_preview.html",
            name=emp["name"],
            designation=emp["designation"],
            joining_date=emp["joining_date"],
            relieving_date="December 27, 2025",  # temporary
            today=today
        )
        filename = f"relieving_letter_{emp_id}"

    # 🔀 STEP 4B: Else → generic letter
    else:
        html = render_template(
            "letters/generic_letter_preview.html",
            name=emp["name"],
            title=letter_type,
            body=body,
            today=today
        )
        filename = f"generic_letter_{emp_id}"

    # Generate PDF
    pdf_path = build_letter_pdf(html, filename)

    # Save record
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        letter_type,
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

    return f"<a href='/{pdf_path}' target='_blank'>Download PDF</a>"
'''
@app.route("/finalize-generic-letter", methods=["POST"])
@login_required
def finalize_generic_letter():
    emp_id = request.form["emp_id"]
    letter_type = request.form["letter_type"]
    body = request.form.get("content", "")

    conn = get_db_connection()
    emp = conn.execute(
        "SELECT * FROM employees WHERE id = ?",
        (emp_id,)
    ).fetchone()
    conn.close()

    if not emp:
        return "Employee not found"
    import os
    from flask import current_app

    logo_path = os.path.join(
        current_app.root_path,
        "static",
        "images",
        "logo.png"
    )

    logo_path = f"file:///{logo_path.replace(os.sep, '/')}"

    today = datetime.now().strftime("%d %B %Y")
        # 🔥 AUTO RELIEVING DATE CALCULATION
    joining_date_obj = datetime.strptime(emp["joining_date"], "%Y-%m-%d")
    relieving_date_obj = joining_date_obj + relativedelta(months=3)
    relieving_date = relieving_date_obj.strftime("%d %B %Y")

    # 🔑 ALWAYS render the SAME template
    html = render_template(
        "letters/generic_letter_preview.html",
        name=emp["name"],
        designation=emp["designation"],
        joining_date=emp["joining_date"],
        relieving_date=relieving_date, # temporary
        title=letter_type,
        letter_type=letter_type,   # ⭐ VERY IMPORTANT
        #body=None,
        draft_content=body,
        today=today,
        logo_path=logo_path
    )

    filename = f"{letter_type.replace(' ', '_').lower()}_{emp_id}"

    # Generate PDF from HTML
    #pdf_path = build_letter_pdf(html, filename)
    pdf_html = render_template(
    "letters/pdf_wrapper.html",
    content=html
)

    pdf_path = build_letter_pdf(pdf_html, filename)

    # Save record
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO letters (employee_id, letter_type, file_path, status, created_at)
        VALUES (?, ?, ?, 'FINAL', ?)
    """, (
        emp_id,
        letter_type,
        pdf_path,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))
    conn.commit()
    conn.close()

    return f"<a href='/{pdf_path}' target='_blank'>Download PDF</a>"

# -------------------- LETTER HISTORY --------------------
'''@app.route("/letter-history")
@login_required
def letter_history():
    conn = get_db_connection()

    letters = conn.execute("""
        SELECT 
            letters.id,
            letters.letter_type,
            letters.file_path,
            letters.created_at,
            letters.downloaded_at,
            employees.name
        FROM letters
        JOIN employees ON letters.employee_id = employees.id
        WHERE letters.status = 'FINAL'
          AND letters.file_path IS NOT NULL
        ORDER BY letters.created_at DESC
    """).fetchall()

    conn.close()

    return render_template(
        "dashboard/letter_history.html",
        letters=letters
    )
'''
'''@app.route("/letter-history")
@login_required
def letter_history():
    conn = get_db_connection()

    rows = conn.execute("""
        SELECT 
            letters.id,
            letters.letter_type,
            letters.file_path,
            letters.created_at,
            employees.name
        FROM letters
        JOIN employees ON letters.employee_id = employees.id
        WHERE letters.status = 'FINAL'
          AND letters.file_path IS NOT NULL
        ORDER BY letters.created_at DESC
    """).fetchall()

    conn.close()

    # ✅ Group letters by type
    grouped_letters = {
        "Offer Letter": [],
        "Relieving Letter": [],
        "Termination Letter": [],
        "Appreciation Letter": []
    }

    for row in rows:
        if row["letter_type"] in grouped_letters:
            grouped_letters[row["letter_type"]].append(row)
        else:
            # fallback for any future letter types
            grouped_letters.setdefault(row["letter_type"], []).append(row)

    return render_template(
        "dashboard/letter_history.html",
        grouped_letters=grouped_letters
    )'''
@app.route("/letter-history")
@login_required
def letter_history():
    conn = get_db_connection()

    rows = conn.execute("""
        SELECT 
            letters.id,
            letters.letter_type,
            letters.file_path,
            letters.created_at,
            employees.name
        FROM letters
        JOIN employees ON letters.employee_id = employees.id
        WHERE letters.status = 'FINAL'
          AND letters.file_path IS NOT NULL
        ORDER BY letters.created_at DESC
    """).fetchall()

    conn.close()

    # ✅ NORMALIZE & GROUP LETTERS
    grouped_letters = {
        "Offer Letter": [],
        "Relieving Letter": [],
        "Termination Letter": [],
        "Appreciation Letter": []
    }

    for row in rows:
        lt = row["letter_type"].strip().lower()

        if "offer" in lt:
            grouped_letters["Offer Letter"].append(row)
        elif "relieving" in lt:
            grouped_letters["Relieving Letter"].append(row)
        elif "termination" in lt:
            grouped_letters["Termination Letter"].append(row)
        elif "appreciation" in lt:
            grouped_letters["Appreciation Letter"].append(row)

    return render_template(
        "dashboard/letter_history.html",
        grouped_letters=grouped_letters
    )


'''#-------------------- ADD DOWNLOAD COLUMN TO LETTERS TABLE --------------------
@app.route("/add-download-column")
def add_download_column():
    conn = get_db_connection()
    conn.execute("ALTER TABLE letters ADD COLUMN downloaded_at TEXT")
    conn.commit()
    conn.close()
    return "downloaded_at column added"
'''
@app.route("/reset-users")
def reset_users():
    conn = get_db_connection()
    conn.execute("DELETE FROM users")
    conn.commit()
    conn.close()
    return "Users table cleared"
# -------------------- ADD DRAFT COLUMNS TO LETTERS TABLE --------------------
'''@app.route("/add-draft-columns")
def add_draft_columns():
    conn = get_db_connection()
    conn.execute("ALTER TABLE letters ADD COLUMN status TEXT")
    conn.execute("ALTER TABLE letters ADD COLUMN content TEXT")
    conn.commit()
    conn.close()
    return "Draft columns added"
'''
# -------------------- SAVE DRAFT --------------------
'''@app.route("/save-draft", methods=["POST"])
@login_required
def save_draft():
    #data = request.get_json()
    emp_id = request.form["emp_id"]
    letter_type = request.form["letter_type"]
    content = request.form["content"]
    draft_id = request.form.get("draft_id")

    conn = get_db_connection()

    if draft_id:
        # 🔁 Update existing draft
        conn.execute("""
            UPDATE letters
            SET content = ?, created_at = ?
            WHERE id = ? AND status = 'DRAFT'
        """, (
            content,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            draft_id
        ))
    else:
        # 🆕 Create new draft
        cursor = conn.execute("""
            INSERT INTO letters (employee_id, letter_type, content, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            emp_id,
            letter_type,
            content,
            "DRAFT",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))
        draft_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return jsonify({
    "status": "success",
    "message": "Draft saved successfully",
    "draft_id": draft_id
})
'''
# -------------------- SAVE DRAFT --------------------
'''@app.route("/save-draft", methods=["POST"])
@login_required
def save_draft():
    emp_id = request.form["emp_id"]
    letter_type = request.form["letter_type"]
    raw_content = request.form["content"]
    draft_id = request.form.get("draft_id")

    # --------- CLEAN CONTENT BEFORE SAVING ----------
    from bs4 import BeautifulSoup, NavigableString

    soup = BeautifulSoup(raw_content, "html.parser")

    # 🔥 Remove stray text nodes (outside <p>)
    for node in soup.find_all(string=True):
        if isinstance(node, NavigableString):
            if node.parent.name not in ["p"]:
                node.extract()

    clean_content = str(soup)

    conn = get_db_connection()

    if draft_id:
        # 🔁 Update existing draft
        conn.execute("""
            UPDATE letters
            SET content = ?, created_at = ?
            WHERE id = ? AND status = 'DRAFT'
        """, (
            clean_content,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            draft_id
        ))
    else:
        # 🆕 Create new draft
        cursor = conn.execute("""
            INSERT INTO letters (employee_id, letter_type, content, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            emp_id,
            letter_type,
            clean_content,
            "DRAFT",
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))
        draft_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "message": "Draft saved successfully",
        "draft_id": draft_id
    })
'''
'''@app.route("/save-draft", methods=["POST"])
@login_required
def save_draft():
    emp_id = request.form["emp_id"]
    letter_type = request.form["letter_type"]
    body = request.form["content"]   # BODY ONLY
    draft_id = request.form.get("draft_id")

    conn = get_db_connection()

    if draft_id:
        conn.execute("""
            UPDATE letters
            SET content = ?, created_at = ?
            WHERE id = ? AND status = 'DRAFT'
        """, (body, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), draft_id))
    else:
        cursor = conn.execute("""
            INSERT INTO letters (employee_id, letter_type, content, status, created_at)
            VALUES (?, ?, ?, 'DRAFT', ?)
        """, (emp_id, letter_type, body, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        draft_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return jsonify({"status": "success", "draft_id": draft_id})
'''
@app.route("/save-draft", methods=["POST"])
@login_required
def save_draft():
    emp_id = request.form["emp_id"]
    letter_type = request.form["letter_type"]
    body = request.form["content"]   # BODY ONLY
    draft_id = request.form.get("draft_id")

    conn = get_db_connection()

    if draft_id:
        conn.execute("""
            UPDATE letters
            SET content = ?, created_at = ?
            WHERE id = ? AND status = 'DRAFT'
        """, (body, datetime.now().strftime("%Y-%m-%d %H:%M:%S"), draft_id))
    else:
        cursor = conn.execute("""
            INSERT INTO letters (employee_id, letter_type, content, status, created_at)
            VALUES (?, ?, ?, 'DRAFT', ?)
        """, (emp_id, letter_type, body, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        draft_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return jsonify({"status": "success", "draft_id": draft_id})


   
# -------------------- VIEW DRAFTS --------------------
'''@app.route("/drafts")
@login_required
def drafts():
    conn = get_db_connection()
    drafts = conn.execute("""
        SELECT 
            letters.id,
            letters.letter_type,
            letters.created_at,
            employees.name
        FROM letters
        JOIN employees ON letters.employee_id = employees.id
        WHERE letters.status = 'DRAFT'
        ORDER BY letters.created_at DESC
    """).fetchall()
    conn.close()

    return render_template(
        "dashboard/drafts.html",
        drafts=drafts
    )'''
# -------------------- VIEW DRAFTS --------------------
@app.route("/drafts")
@login_required
def drafts():
    conn = get_db_connection()

    rows = conn.execute("""
        SELECT 
            letters.id,
            letters.letter_type,
            letters.created_at,
            employees.name
        FROM letters
        JOIN employees ON letters.employee_id = employees.id
        WHERE letters.status = 'DRAFT'
        ORDER BY letters.created_at DESC
    """).fetchall()

    conn.close()

    # ✅ Group drafts by letter type
    grouped_drafts = {}
    for d in rows:
        letter_type = d["letter_type"].strip()
        grouped_drafts.setdefault(letter_type, []).append(d)

    return render_template(
        "dashboard/drafts.html",
        grouped_drafts=grouped_drafts
    )

# -------------------- EDIT DRAFT --------------------
'''@app.route("/edit-draft/<int:draft_id>")
@login_required
def edit_draft(draft_id):
    conn = get_db_connection()

    draft = conn.execute("""
        SELECT 
            letters.id,
            letters.letter_type,
            letters.content,
            employees.id AS emp_id,
            employees.name
        FROM letters
        JOIN employees ON letters.employee_id = employees.id
        WHERE letters.id = ?
    """, (draft_id,)).fetchone()

    conn.close()

    if not draft:
        return "Draft not found"

    # ✅ ENSURE HEADER + FOOTER EXIST
    content = draft["content"]

    if "CodexConquer" not in content:
        content = f"""
        <p><b>CodexConquer</b><br>
        123 Business Avenue, Suite 100<br>
        New York, NY 10001<br>
        Phone: (555) 123-4567 | Email: hr@codexconquer.com</p>

        <hr>

        {content}

        <p>
            Sincerely,<br><br>
            <b>Human Resources Department</b><br>
            CodexConquer
        </p>
        """

    return render_template(
        "letters/generic_letter_preview.html",
        emp_id=draft["emp_id"],
        name=draft["name"],
        title=draft["letter_type"].upper(),
        body="",
        letter_type=draft["letter_type"],
        today="",
        draft_content=content,
        draft_id=draft["id"]
    )
'''
'''@app.route("/edit-draft/<int:draft_id>")
@login_required
def edit_draft(draft_id):
    conn = get_db_connection()

    draft = conn.execute("""
        SELECT 
            letters.id,
            letters.letter_type,
            letters.content,
            employees.id AS emp_id,
            employees.name
        FROM letters
        JOIN employees ON letters.employee_id = employees.id
        WHERE letters.id = ?
    """, (draft_id,)).fetchone()

    conn.close()

    if not draft:
        return "Draft not found"

    return render_template(
        "letters/generic_letter_preview.html",
        emp_id=draft["emp_id"],
        name=draft["name"],
        title=draft["letter_type"].upper(),
        body="",                       # not used for drafts
        draft_content=draft["content"],# BODY TEXT ONLY
        letter_type=draft["letter_type"],
        today="",
        draft_id=draft["id"]
    )
'''
@app.route("/edit-draft/<int:draft_id>")
@login_required
def edit_draft(draft_id):
    conn = get_db_connection()

    draft = conn.execute("""
        SELECT 
            letters.id,
            letters.letter_type,
            letters.content,
            employees.id AS emp_id,
            employees.name,
            employees.designation,
            employees.joining_date
        FROM letters
        JOIN employees ON letters.employee_id = employees.id
        WHERE letters.id = ?
    """, (draft_id,)).fetchone()

    conn.close()

    if not draft:
        return "Draft not found"

    # 🔥 OFFER LETTER → open offer preview
    if draft["letter_type"] == "Offer Letter":
        return render_template(
            "letters/offer_letter_preview.html",
            emp_id=draft["emp_id"],
            name=draft["name"],
            designation=draft["designation"],
            joining_date=draft["joining_date"],
            today="",
            stipend="",
            draft_id=draft["id"],
            # IMPORTANT: inject saved HTML
            draft_content=draft["content"]
        )

    # 🔹 OTHER LETTERS → generic preview
    return render_template(
        "letters/generic_letter_preview.html",
        emp_id=draft["emp_id"],
        name=draft["name"],
        title=draft["letter_type"].upper(),
        draft_content=draft["content"],
        letter_type=draft["letter_type"],
        today="",
        draft_id=draft["id"]
    )

# -------------------- ADD RESET PASSWORD COLUMNS TO USERS TABLE --------------------
'''@app.route("/add-reset-columns")
def add_reset_columns():
    conn = get_db_connection()
    conn.execute("ALTER TABLE users ADD COLUMN reset_token TEXT")
    conn.execute("ALTER TABLE users ADD COLUMN reset_token_expiry TEXT")
    conn.commit()
    conn.close()
    return "Reset password columns added"
'''
# -------------------- FORGOT PASSWORD --------------------
@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if request.method == "POST":
        email = request.form["email"]

        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        if user:
            # Generate token + expiry ONLY if user exists
            token = secrets.token_urlsafe(32)
            expiry = (datetime.now() + timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")

            conn.execute("""
                UPDATE users
                SET reset_token = ?, reset_token_expiry = ?
                WHERE id = ?
            """, (token, expiry, user["id"]))

            conn.commit()

            reset_link = f"http://127.0.0.1:5000/reset-password/{token}"

            from utils.email_service import send_email
            send_email(
                to_email=user["email"],
                subject="Reset Your Password",
                body=f"Click the link below to reset your password:\n\n{reset_link}"
            )

        conn.close()

        # SAME response whether user exists or not (security)
        return """
            <h3>If the email exists, a reset link has been sent 📧</h3>
            <p>Please check your inbox.</p>
        """

    return render_template("auth/forgot_password.html")

# -------------------- RESET PASSWORD --------------------
@app.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token):
    conn = get_db_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE reset_token = ?",
        (token,)
    ).fetchone()

    if not user:
        conn.close()
        return "Invalid or expired reset link"

    if request.method == "POST":
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]

        if password != confirm_password:
            conn.close()
            return "Passwords do not match"

        hashed_password = generate_password_hash(password)

        conn.execute("""
            UPDATE users
            SET password = ?, reset_token = NULL, reset_token_expiry = NULL
            WHERE id = ?
        """, (hashed_password, user["id"]))

        conn.commit()
        conn.close()

        return """
            <h3>Password reset successful ✅</h3>
            <a href="/login">Go to Login</a>
        """

    conn.close()
    return render_template("auth/reset_password.html")
# -------------------- ADD EMAIL COLUMN TO USERS TABLE --------------------
'''@app.route("/add-user-email-column")
def add_user_email_column():
    conn = get_db_connection()
    conn.execute("ALTER TABLE users ADD COLUMN email TEXT")
    conn.commit()
    conn.close()
    return "Email column added"
'''
'''@app.route("/update-admin-email")
def update_admin_email():
    conn = get_db_connection()
    conn.execute(
        "UPDATE users SET email = ? WHERE username = ?",
        ("yourrealemail@gmail.com", "admin")
    )
    conn.commit()
    conn.close()
    return "Admin email updated"
'''
# -------------------- INIT HR REQUESTS TABLE --------------------
'''@app.route("/init-hr-requests")
def init_hr_requests():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS hr_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            status TEXT DEFAULT 'PENDING',
            requested_at TEXT
        )
    """)
    conn.commit()
    conn.close()
    return "HR request table created"
'''
@app.route("/request-hr-access", methods=["GET", "POST"])
def request_hr_access():
    if request.method == "POST":
        username = request.form["username"]
        name = request.form["name"]
        email = request.form["email"]

        conn = get_db_connection()

        # Prevent duplicate requests
        existing = conn.execute(
            "SELECT * FROM hr_requests WHERE email = ?",
            (email,)
        ).fetchone()

        if existing:
            conn.close()
            return "Request already submitted for this email."

        conn.execute("""
            INSERT INTO hr_requests (username, name, email, requested_at)
            VALUES (?, ?, ?, datetime('now'))
        """, (username, name, email))

        conn.commit()
        conn.close()

        return """
            <h3>Request submitted successfully ✅</h3>
            <p>Please wait for HR approval.</p>
        """

    return render_template("auth/request_hr_access.html")

#----------------------- HR REQUESTS ---------------------------------------
@app.route("/hr-requests")
@login_required
def hr_requests():
    conn = get_db_connection()
    requests = conn.execute("""
        SELECT id, name, email, requested_at
        FROM hr_requests
        WHERE status = 'PENDING'
        ORDER BY requested_at DESC
    """).fetchall()
    conn.close()

    return render_template(
        "dashboard/hr_requests.html",
        requests=requests
    )

#----
@app.route("/approve-hr/<int:req_id>")
@login_required
def approve_hr(req_id):
    conn = get_db_connection()

    # Get HR request
    req = conn.execute(
        "SELECT * FROM hr_requests WHERE id = ? AND status = 'PENDING'",
        (req_id,)
    ).fetchone()

    if not req:
        conn.close()
        return "Invalid or already processed request"

    # Generate 6-digit code
    code = str(random.randint(100000, 999999))
    expiry = (datetime.now() + timedelta(minutes=10)).strftime("%Y-%m-%d %H:%M:%S")

    # Save verification code
    conn.execute("""
        INSERT INTO hr_verifications (email, code, expires_at)
        VALUES (?, ?, ?)
    """, (req["email"], code, expiry))

    # Mark request approved
    conn.execute("""
        UPDATE hr_requests
        SET status = 'APPROVED'
        WHERE id = ?
    """, (req_id,))

    conn.commit()
    conn.close()

    # Send email AFTER approval
    send_email(
        to_email=req["email"],
        subject="HR Access Verification Code",
        body=f"""
Your HR access request has been approved.

Your 6-digit verification code is:
{code}
Complete your signup here:
http://127.0.0.1:5000/verify-hr

This code is valid for 10 minutes.
"""
    )

    return redirect(url_for("hr_requests"))


@app.route("/reject-hr/<int:req_id>")
@login_required
def reject_hr(req_id):
    conn = get_db_connection()
    conn.execute("""
        UPDATE hr_requests
        SET status = 'REJECTED'
        WHERE id = ?
    """, (req_id,))
    conn.commit()
    conn.close()

    return redirect(url_for("hr_requests"))
# -------------------- INIT HR VERIFICATION TABLE --------------------
@app.route("/init-hr-verification")
def init_hr_verification():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS hr_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    return "HR verification table created"

from werkzeug.security import generate_password_hash

@app.route("/verify-hr", methods=["GET", "POST"])
def verify_hr():
    if request.method == "POST":
        email = request.form["email"]
        code = request.form["code"]
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]

        if password != confirm_password:
            return "Passwords do not match"

        conn = get_db_connection()

        # 1️⃣ Check verification code
        verification = conn.execute("""
            SELECT * FROM hr_verifications
            WHERE email = ? AND code = ?
        """, (email, code)).fetchone()

        if not verification:
            conn.close()
            return "Invalid verification code"

        # 2️⃣ Check expiry
        from datetime import datetime
        if datetime.strptime(
            verification["expires_at"], "%Y-%m-%d %H:%M:%S"
        ) < datetime.now():
            conn.close()
            return "Verification code expired"

        # 3️⃣ FETCH USERNAME FROM HR REQUEST (⭐ THIS IS THE FIX)
        req = conn.execute("""
            SELECT username FROM hr_requests
            WHERE email = ?
        """, (email,)).fetchone()

        if not req:
            conn.close()
            return "HR request not found"

        username = req["username"]

        # 4️⃣ Create HR user with SAME username
        hashed_password = generate_password_hash(password)

        conn.execute("""
            INSERT INTO users (username, email, password, role)
            VALUES (?, ?, ?, ?)
        """, (username, email, hashed_password, "HR"))

        # 5️⃣ Cleanup verification + request
        conn.execute("DELETE FROM hr_verifications WHERE email = ?", (email,))
        conn.execute("DELETE FROM hr_requests WHERE email = ?", (email,))

        conn.commit()
        conn.close()

        return redirect(url_for("login"))

    return render_template("auth/verify_hr.html")


@app.route("/add-username-column")
def add_username_column():
    conn = get_db_connection()
    try:
        conn.execute("ALTER TABLE hr_requests ADD COLUMN username TEXT")
        conn.commit()
        message = "✅ username column added successfully"
    except Exception as e:
        message = f"⚠️ Error: {e}"
    finally:
        conn.close()
    return message

@app.route("/check-hr-requests-table")
def check_hr_requests_table():
    conn = get_db_connection()
    rows = conn.execute("PRAGMA table_info(hr_requests)").fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append(dict(row))

    return str(result)

@app.route("/debug-hr-requests")
def debug_hr_requests():
    conn = get_db_connection()
    data = conn.execute("SELECT username, name, email, status FROM hr_requests").fetchall()
    conn.close()
    return str([dict(row) for row in data])
@app.route("/resend-hr-code", methods=["POST"])
def resend_hr_code():
    email = request.form["email"]

    conn = get_db_connection()

    # Ensure request was approved
    req = conn.execute("""
        SELECT * FROM hr_requests
        WHERE email = ? AND status = 'APPROVED'
    """, (email,)).fetchone()

    if not req:
        conn.close()
        return "No approved HR request found for this email."

    # Delete old codes
    conn.execute("DELETE FROM hr_verifications WHERE email = ?", (email,))

    # Generate new code
    import random
    from datetime import datetime, timedelta

    code = str(random.randint(100000, 999999))
    expiry = (datetime.now() + timedelta(minutes=10)).strftime("%Y-%m-%d %H:%M:%S")

    conn.execute("""
        INSERT INTO hr_verifications (email, code, expires_at)
        VALUES (?, ?, ?)
    """, (email, code, expiry))

    conn.commit()
    conn.close()

    from utils.email_service import send_email
    send_email(
        to_email=email,
        subject="New HR Verification Code",
        body=f"""
Your new HR verification code is:

{code}

This code is valid for 10 minutes.
"""
    )

    return """
        <h3>New verification code sent 📧</h3>
        <p>Please check your email.</p>
    """
#-------------------- SYSTEM SETTINGS --------------------
@app.route("/settings", methods=["GET", "POST"])
@login_required
def system_settings():
    conn = get_db_connection()

    if request.method == "POST":
        company_name = request.form["company_name"]
        street_address = request.form["street_address"]
        city = request.form["city"]
        state = request.form["state"]
        zip_code = request.form["zip_code"]
        phone = request.form["phone"]
        email = request.form["email"]

        existing = conn.execute(
            "SELECT id FROM settings ORDER BY id DESC LIMIT 1"
        ).fetchone()

        if existing:
            conn.execute("""
                UPDATE settings
                SET company_name=?, street_address=?, city=?, state=?,
                    zip_code=?, phone=?, email=?
                WHERE id=?
            """, (
                company_name, street_address, city, state,
                zip_code, phone, email, existing["id"]
            ))
        else:
            conn.execute("""
                INSERT INTO settings (
                    company_name, street_address, city,
                    state, zip_code, phone, email
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                company_name, street_address, city,
                state, zip_code, phone, email
            ))

        conn.commit()
        conn.close()

        # 🔴 THIS IS THE MOST IMPORTANT LINE
        return redirect(url_for("system_settings"))

    # ✅ GET request (always runs after redirect)
    settings = conn.execute(
        "SELECT * FROM settings ORDER BY id DESC LIMIT 1"
    ).fetchone()

    conn.close()
    return render_template("dashboard/settings.html", settings=settings)

# -------------------- MANAGE HR PROFILE --------------------
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
import os

@app.route("/manage-profile", methods=["GET", "POST"])
@login_required
def manage_profile_page():
    conn = get_db_connection()

    # 1️⃣ Get logged-in user
    user = conn.execute(
        "SELECT * FROM users WHERE username = ?",
        (session["user"],)
    ).fetchone()

    # 2️⃣ Get HR profile
    profile = conn.execute(
        "SELECT * FROM hr_profile WHERE user_id = ?",
        (user["id"],)
    ).fetchone()

    if request.method == "POST":
        action = request.form.get("action")

        # ===============================
        # 📸 UPDATE PROFILE PHOTO
        # ===============================
        if action == "photo":
            photo = request.files.get("profile_pic")

            if photo and photo.filename:
                filename = secure_filename(photo.filename)

                # Ensure upload folder exists
                os.makedirs("static/uploads", exist_ok=True)

                photo_path = f"uploads/{filename}"
                photo.save(os.path.join("static", photo_path))

                # Save photo path in DB
                if profile:
                    conn.execute(
                        "UPDATE hr_profile SET photo=? WHERE user_id=?",
                        (photo_path, user["id"])
                    )
                else:
                    conn.execute("""
                        INSERT INTO hr_profile (user_id, photo)
                        VALUES (?, ?)
                    """, (user["id"], photo_path))

                conn.commit()

            conn.close()
            return redirect(url_for("manage_profile_page"))

        # ===============================
        # 📝 UPDATE PROFILE DETAILS
        # ===============================
        if action == "details":
            full_name = request.form["full_name"]
            email = request.form["email"]
            phone = request.form["phone"]
            role = request.form["role"]

            if profile:
                conn.execute("""
                    UPDATE hr_profile
                    SET full_name=?, email=?, phone=?, role=?
                    WHERE user_id=?
                """, (full_name, email, phone, role, user["id"]))
            else:
                conn.execute("""
                    INSERT INTO hr_profile (user_id, full_name, email, phone, role)
                    VALUES (?, ?, ?, ?, ?)
                """, (user["id"], full_name, email, phone, role))

            conn.commit()
            conn.close()
            return redirect(url_for("manage_profile_page"))

        # ===============================
        # 🔐 CHANGE PASSWORD
        # ===============================
        if action == "password":
            current = request.form["current_password"]
            new = request.form["new_password"]
            confirm = request.form["confirm_password"]

            if new != confirm:
                conn.close()
                return "Passwords do not match"

            if not check_password_hash(user["password"], current):
                conn.close()
                return "Current password is incorrect"

            new_hash = generate_password_hash(new)

            conn.execute(
                "UPDATE users SET password=? WHERE id=?",
                (new_hash, user["id"])
            )

            conn.commit()
            conn.close()
            return redirect(url_for("manage_profile_page"))

    # ===============================
    # 📄 LOAD PAGE (GET REQUEST)
    # ===============================
    conn.close()
    return render_template(
        "dashboard/manage_profile.html",
        profile=profile,
        user=user
    )
#--------------------- UPDATE PROFILE PHOTO --------------------
import os
from werkzeug.utils import secure_filename

@app.route("/update-profile-photo", methods=["POST"])
@login_required
def update_profile_photo():
    if "photo" not in request.files:
        return redirect(url_for("manage_profile_page"))

    photo = request.files["photo"]

    if photo.filename == "":
        return redirect(url_for("manage_profile_page"))

    filename = secure_filename(photo.filename)
    upload_folder = "static/uploads/profile_photos"
    os.makedirs(upload_folder, exist_ok=True)

    filepath = os.path.join(upload_folder, filename)
    photo.save(filepath)

    conn = get_db_connection()

    user = conn.execute(
        "SELECT id FROM users WHERE username = ?",
        (session["user"],)
    ).fetchone()

    conn.execute("""
        UPDATE hr_profile
        SET photo = ?
        WHERE user_id = ?
    """, (f"uploads/profile_photos/{filename}", user["id"]))

    conn.commit()
    conn.close()

    return redirect(url_for("manage_profile_page"))
#--------------------- REMOVE PROFILE PHOTO --------------------
@app.route("/remove-profile-photo", methods=["POST"])
@login_required
def remove_profile_photo():
    conn = get_db_connection()

    user = conn.execute(
        "SELECT id FROM users WHERE username = ?",
        (session["user"],)
    ).fetchone()

    conn.execute("""
        UPDATE hr_profile
        SET photo = NULL
        WHERE user_id = ?
    """, (user["id"],))

    conn.commit()
    conn.close()

    return redirect(url_for("manage_profile_page"))


'''@app.route("/update-settings-table")
def update_settings_table():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("ALTER TABLE settings ADD COLUMN street_address TEXT")
    cursor.execute("ALTER TABLE settings ADD COLUMN city TEXT")
    cursor.execute("ALTER TABLE settings ADD COLUMN state TEXT")
    cursor.execute("ALTER TABLE settings ADD COLUMN zip_code TEXT")
    cursor.execute("ALTER TABLE settings ADD COLUMN phone TEXT")
    cursor.execute("ALTER TABLE settings ADD COLUMN email TEXT")

    conn.commit()
    conn.close()

    return "✅ Settings table updated"
'''

'''@app.route("/clear-drafts")
def clear_drafts():
    conn = get_db_connection()
    conn.execute("DELETE FROM letters WHERE status = 'DRAFT'")
    conn.commit()
    conn.close()
    return "Drafts cleared"
'''
'''@app.route("/clear-drafts")
def clear_drafts():
    conn = get_db_connection()
    conn.execute("DELETE FROM letters WHERE status='DRAFT'")
    conn.commit()
    conn.close()
    return "Drafts cleared"
'''
# -------------------- DELETE DRAFT --------------------
@app.route("/delete-draft/<int:draft_id>", methods=["POST"])
@login_required
def delete_draft(draft_id):
    conn = get_db_connection()

    # Safety: ONLY drafts delete avvali
    conn.execute("""
        DELETE FROM letters
        WHERE id = ? AND status = 'DRAFT'
    """, (draft_id,))

    conn.commit()
    conn.close()

    return jsonify({"status": "success"})

# -------------------- RUN APP --------------------
if __name__ == "__main__":
    app.run(debug=True)
