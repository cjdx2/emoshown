from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from sklearn.ensemble import IsolationForest
import pandas as pd

# Initialize Firebase
cred = credentials.Certificate('emoshown-firebase-adminsdk.json')
firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Fetch data from the 'journals' collection in Firebase
def fetch_journals():
    journals_ref = db.collection('journals')
    docs = journals_ref.stream()

    data = []
    for doc in docs:
        journal_data = doc.to_dict()
        data.append(journal_data)

    return data

# Anomaly Detection with Isolation Forest

def detect_anomalies(data):
    df = pd.DataFrame(data)

    # Assuming 'emotion' and 'sentiment_score' are columns in your Firestore data
    features = df[['emotion', 'sentiment_score']]

    # Create and fit the Isolation Forest model
    model = IsolationForest(contamination=0.1)
    model.fit(features)

    # Predict anomalies
    df['anomaly'] = model.predict(features)

    # Filter out future dates (assuming 'timestamp' column is in a valid datetime format)
    today = datetime.now()
    df['timestamp'] = pd.to_datetime(df['timestamp'])  # Convert 'timestamp' column to datetime
    df = df[df['timestamp'] <= today]  # Keep only records with dates in the past or today

    # Anomalies are marked as -1
    anomalies = df[df['anomaly'] == -1]
    return anomalies

@app.route('/detect_anomalies', methods=['POST'])
def detect_anomalies(data):
    df = pd.DataFrame(data)
    features = df[['emotion', 'sentiment_score']]

    model = IsolationForest(contamination=0.1)
    model.fit(features)

    df['anomaly'] = model.predict(features)
    anomalies = df[df['anomaly'] == -1]

    # Assuming there's a timestamp or date in your Firestore data
    anomalies['date'] = df['timestamp']  # Replace 'timestamp' with the actual field in your data
    anomalies['change'] = df['mood_change']  # Assuming there's a field tracking the mood change

    return anomalies

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
