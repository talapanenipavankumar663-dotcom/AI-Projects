# Employee Management System (Flask)

Simple Employee Management System built with Python Flask, SQLite, Bootstrap 5 and Font Awesome.

Files created:

- `app.py` - Main Flask application (routes, DB init, CRUD operations)
- `templates/` - HTML templates: `index.html`, `add_employee.html`, `edit_employee.html`
- `static/` - `style.css`, `script.js`
- `database.db` - SQLite database (created on first run)
- `requirements.txt` - Python dependencies

Quick start (VS Code / Windows):

1. Create a virtual environment and install dependencies:

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

2. Run the app:

```powershell
python app.py
```

3. Open http://127.0.0.1:5000 in your browser.

Notes:
- The app will create `database.db` automatically on first run.
- Use the Add / Edit forms to manage employees. Deleting requires confirmation.
