from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, render_template, request, redirect, url_for, session, send_file
import sqlite3
from functools import wraps
from datetime import date, datetime
from utils.pdf_generator import generate_offer_letter_pdf, generate_generic_letter

app = Flask(__name__)
app.secret_key = "supersecretkey"


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

        if user and check_password_hash(user["password"], password):
            session["user"] = user["username"]
            return redirect(url_for("dashboard"))
        else:
            return "❌ Invalid username or password"

    return render_template("auth/login.html")


# -------------------- DASHBOARD --------------------
@app.route("/dashboard")
@login_required
def dashboard():
    return f"Welcome {session['user']} to HR Dashboard 🎉"


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
@app.route("/offer-letter/<int:emp_id>")
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

    pdf_path = generate_offer_letter_pdf(emp)

    conn.execute(
        "INSERT INTO letters (employee_id, letter_type, file_path, created_at) VALUES (?, ?, ?, ?)",
        (emp_id, "Offer Letter", pdf_path, date.today().isoformat())
    )
    conn.commit()
    conn.close()

    return f"""
        <h3>Offer Letter Generated Successfully ✅</h3>
        <a href='/{pdf_path}' target='_blank'>Download Offer Letter</a>
    """


# -------------------- GENERATE LETTER (ALL TYPES) --------------------
@app.route("/generate-letter", methods=["GET", "POST"])
@login_required
def generate_letter():
    conn = get_db_connection()
    employees = conn.execute("SELECT * FROM employees").fetchall()

    if request.method == "POST":
        emp_id = request.form["employee_id"]
        letter_type = request.form["letter_type"]

        emp = conn.execute(
            "SELECT * FROM employees WHERE id = ?",
            (emp_id,)
        ).fetchone()
        conn.close()

        if not emp:
            return "Employee not found"

        # ---------------- PREVIEW FIRST (NO PDF HERE) ----------------
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
                "letters/generic_letter_preview.html",
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
        else:
            return "Invalid letter type"
        '''elif letter_type == "relieving":
            return "🚧 Relieving letter preview coming next"

        elif letter_type == "warning":
            return "🚧 Warning letter preview coming next"

        elif letter_type == "termination":
            return "🚧 Termination letter preview coming next"

        elif letter_type == "appreciation":
            return "🚧 Appreciation letter preview coming next"'''
        # ---------- PREVIEW FOR OTHER LETTERS ----------
        
        






    conn.close()
    return render_template(
        "dashboard/generate_letter.html",
        employees=employees
    )


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
    session.pop("user", None)
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
            role TEXT
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
            created_at TEXT
        )
    """)

    conn.commit()
    conn.close()
    return "✅ Database tables created successfully!"


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
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        ("admin", hashed_password, "HR")
    )
    conn.commit()
    conn.close()

    return "✅ HR user created with hashed password"

# -------------------- FINALIZE GENERIC LETTER --------------------
@app.route("/finalize-generic-letter", methods=["POST"])
@login_required
def finalize_generic_letter():
    emp_id = request.form["emp_id"]
    title = request.form["title"]
    letter_type = request.form["letter_type"]
    date_text = request.form["date"]
    greeting = request.form["greeting"]
    body = request.form["body"]
    closing = request.form["closing"]

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
    import os

    os.makedirs("generated_letters", exist_ok=True)
    filename = f"generated_letters/{title.replace(' ', '_')}_{emp['name'].replace(' ', '_')}.pdf"

    c = canvas.Canvas(filename, pagesize=A4)
    width, height = A4
    y = height - 50

    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, y, title)

    c.setFont("Helvetica", 11)
    y -= 40
    c.drawString(50, y, f"Date: {date_text}")

    y -= 30
    c.drawString(50, y, greeting)

    y -= 30
    c.drawString(50, y, body)

    y -= 40
    for line in closing.split("\n"):
        c.drawString(50, y, line)
        y -= 15

    c.showPage()
    c.save()

    conn.execute(
        "INSERT INTO letters (employee_id, letter_type, file_path, created_at) VALUES (?, ?, ?, ?)",
        (emp_id, letter_type, filename, date.today().isoformat())
    )
    conn.commit()
    conn.close()

    return f"""
        <h3>{title} Generated Successfully ✅</h3>
        <a href='/{filename}' target='_blank'>Download Final PDF</a>
    """
# -------------------- LETTER HISTORY --------------------
@app.route("/letter-history")
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
        ORDER BY letters.created_at DESC
    """).fetchall()
    conn.close()

    return render_template(
        "dashboard/letter_history.html",
        letters=letters
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


# -------------------- RUN APP --------------------
if __name__ == "__main__":
    app.run(debug=True)
