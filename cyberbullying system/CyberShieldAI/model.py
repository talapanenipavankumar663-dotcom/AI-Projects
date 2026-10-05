import os, json
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

nltk.download('vader_lexicon')

MODEL_PATH = 'CyberShieldAI/models/cyberbullying_model.pkl'
VECT_PATH = 'CyberShieldAI/models/vectorizer.pkl'
METRICS_PATH = 'CyberShieldAI/models/metrics.json'

LABELS = ['Bullying', 'Harassment', 'Hate Speech', 'Toxic', 'Safe']


def train_model(csv_path='CyberShieldAI/dataset/cyberbullying_dataset.csv'):
    if not os.path.exists(csv_path):
        raise FileNotFoundError('Dataset not found at ' + csv_path)
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=['text','label'])
    X = df['text'].astype(str)
    y = df['label'].astype(str)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    vect = TfidfVectorizer(max_features=10000, ngram_range=(1,2))
    lr = LogisticRegression(max_iter=1000)
    pipeline = Pipeline([('tfidf', vect), ('clf', lr)])
    pipeline.fit(X_train, y_train)
    preds = pipeline.predict(X_test)
    acc = accuracy_score(y_test, preds)
    report = classification_report(y_test, preds, output_dict=True)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    joblib.dump(vect, VECT_PATH)
    metrics = {'accuracy': acc, 'report': report}
    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f)
    print('Model trained. Accuracy:', acc)
    return pipeline, metrics


def load_model():
    if os.path.exists(MODEL_PATH):
        pipeline = joblib.load(MODEL_PATH)
        return pipeline
    return None


def predict_text(text):
    sia = SentimentIntensityAnalyzer()
    sentiment_scores = sia.polarity_scores(text)
    if sentiment_scores['compound'] >= 0.05:
        sentiment = 'Positive'
    elif sentiment_scores['compound'] <= -0.05:
        sentiment = 'Negative'
    else:
        sentiment = 'Neutral'
    pipeline = load_model()
    if pipeline is None:
        return 'Safe', 0.0, sentiment, []
    probs = pipeline.predict_proba([text])[0]
    classes = pipeline.classes_
    idx = probs.argmax()
    pred = classes[idx]
    conf = float(probs[idx])
    # extract top contributing words via tfidf
    try:
        tfidf = pipeline.named_steps['tfidf']
        feature_names = tfidf.get_feature_names_out()
        x = tfidf.transform([text])
        scores = np.asarray(x.todense()).ravel()
        top_idx = scores.argsort()[-10:][::-1]
        top_words = [feature_names[i] for i in top_idx if scores[i] > 0][:10]
    except Exception:
        top_words = []
    return pred, conf, sentiment, top_words


if __name__ == '__main__':
    # convenience: train if run directly
    train_model()
