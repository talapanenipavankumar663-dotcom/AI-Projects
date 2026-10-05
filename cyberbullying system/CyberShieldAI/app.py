from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os, json
from model import load_model, predict_text

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), default='user')


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    post_text = db.Column(db.Text, nullable=False)
    prediction = db.Column(db.String(100))
    confidence = db.Column(db.Float)
    sentiment = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_type = db.Column(db.String(50))
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


def ensure_db():
    if not os.path.exists('database.db'):
        db.create_all()


@app.route('/')
def index():
    return redirect(url_for('dashboard'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return redirect(url_for('register'))
        pw_hash = generate_password_hash(password)
        user = User(username=username, email=email, password=pw_hash)
        db.session.add(user)
        db.session.commit()
        flash('Registered successfully. Please login.')
        return redirect(url_for('login'))
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Invalid credentials')
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route('/dashboard')
@login_required
def dashboard():
    total = Post.query.count()
    harmful = Post.query.filter(Post.prediction != None).filter(Post.prediction != 'Safe').count()
    safe = total - harmful
    metrics = {}
    # try common locations for metrics
    for path in ('models/metrics.json', 'CyberShieldAI/models/metrics.json'):
        if os.path.exists(path):
            with open(path, 'r') as f:
                try:
                    metrics = json.load(f)
                except Exception:
                    metrics = {}
            break
    recent = Post.query.order_by(Post.created_at.desc()).limit(5).all()
    return render_template('dashboard.html', total=total, harmful=harmful, safe=safe, metrics=metrics, recent=recent)


@app.route('/detect', methods=['GET', 'POST'])
@login_required
def detect():
    if request.method == 'POST':
        text = request.form['post_text']
        pred, conf, sentiment, top_words = predict_text(text)
        post = Post(user_id=current_user.id, post_text=text, prediction=pred, confidence=conf, sentiment=sentiment)
        db.session.add(post)
        db.session.commit()
        flash(f'Post submitted and detected as {pred} ({conf*100:.1f}%)')
        return redirect(url_for('detect'))
    return render_template('detect.html')


@app.route('/api/predict', methods=['POST'])
@login_required
def api_predict():
    data = request.get_json(force=True)
    text = data.get('text', '')
    pred, conf, sentiment, top_words = predict_text(text)
    return jsonify({'prediction': pred, 'confidence': conf, 'sentiment': sentiment, 'top_words': top_words})


@app.route('/analytics')
@login_required
def analytics():
    from sqlalchemy import func
    labels = ['Bullying', 'Harassment', 'Hate Speech', 'Toxic', 'Safe']
    counts = []
    for l in labels:
        counts.append(Post.query.filter_by(prediction=l).count())
    # trend per day
    trend = db.session.query(func.strftime('%Y-%m-%d', Post.created_at), func.count(Post.id)).group_by(func.strftime('%Y-%m-%d', Post.created_at)).all()
    return render_template('analytics.html', labels=labels, counts=counts, trend=trend)


@app.route('/admin')
@login_required
def admin():
    if current_user.role != 'admin':
        flash('Unauthorized')
        return redirect(url_for('dashboard'))
    users = User.query.all()
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return render_template('admin.html', users=users, posts=posts)


@app.route('/admin/delete_post/<int:post_id>')
@login_required
def delete_post(post_id):
    if current_user.role != 'admin':
        flash('Unauthorized')
        return redirect(url_for('dashboard'))
    p = Post.query.get_or_404(post_id)
    db.session.delete(p)
    db.session.commit()
    flash('Post deleted')
    return redirect(url_for('admin'))


@app.route('/reports/<report_type>')
@login_required
def reports(report_type):
    # generate a simple PDF report
    try:
        from fpdf import FPDF
    except Exception:
        flash('FPDF not installed')
        return redirect(url_for('dashboard'))
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font('Arial', 'B', 16)
    pdf.cell(40, 10, f'CyberShield AI - {report_type.capitalize()} Report')
    pdf.ln(20)
    total = Post.query.count()
    harmful = Post.query.filter(Post.prediction != None).filter(Post.prediction != 'Safe').count()
    safe = total - harmful
    pdf.set_font('Arial', '', 12)
    pdf.cell(0, 10, f'Total Posts: {total}', ln=1)
    pdf.cell(0, 10, f'Harmful Posts: {harmful}', ln=1)
    pdf.cell(0, 10, f'Safe Posts: {safe}', ln=1)
    fname = f'reports_{report_type}.pdf'
    pdf.output(fname)
    report = Report(report_type=report_type)
    db.session.add(report)
    db.session.commit()
    return send_file(fname, as_attachment=True)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()

        if not User.query.filter_by(username='admin').first():
            admin_user = User(
                username='admin',
                email='admin@example.com',
                password=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin_user)
            db.session.commit()

    app.run(debug=True)