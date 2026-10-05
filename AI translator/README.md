# AI Language Translator

A simple web application built with Flask, HTML, CSS, JavaScript, and `googletrans` for translating text between languages.

## Setup

1. Create a virtual environment in the project folder:

```powershell
python -m venv venv
```

2. Activate the environment:

```powershell
venv\Scripts\Activate.ps1
```

3. Install dependencies:

```powershell
pip install -r requirements.txt
```

4. Run the app:

```powershell
python app.py
```

5. Open your browser at `http://127.0.0.1:5000`

## Files

- `app.py` - Flask application and translation API endpoint
- `templates/index.html` - User interface
- `static/style.css` - Styles for the UI
- `static/script.js` - Client-side translation request logic
- `requirements.txt` - Python dependencies

## Notes

- This app uses `googletrans==4.0.0-rc1` for translation.
- If translation fails, check your network connection and the library version.
