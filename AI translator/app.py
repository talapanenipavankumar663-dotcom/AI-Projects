from flask import Flask, render_template, request, jsonify
from deep_translator import GoogleTranslator

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate_text():
    data = request.get_json(force=True)

    text = data.get('text', '').strip()
    src = data.get('source', 'auto')
    dest = data.get('target', 'en')

    if not text:
        return jsonify({'error': 'Please enter text to translate.'})

    try:
        result = GoogleTranslator(source=src, target=dest).translate(text)
        return jsonify({'translation': result})
    except Exception as e:
        return jsonify({'error': f'Translation error: {str(e)}'})

if __name__ == '__main__':
    app.run(debug=True)