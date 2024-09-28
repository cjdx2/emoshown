from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from sklearn.ensemble import IsolationForest
import pandas as pd
from sklearn.preprocessing import OneHotEncoder

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

# Convert emotion categories to numerical values using OneHotEncoder
def preprocess_data(data):
    df = pd.DataFrame(data)

    # Handling categorical 'emotion' column
    if 'emotion' in df.columns:
        encoder = OneHotEncoder(sparse=False)
        encoded_emotions = encoder.fit_transform(df[['emotion']])
        encoded_emotion_df = pd.DataFrame(encoded_emotions, columns=encoder.get_feature_names_out(['emotion']))
        df = pd.concat([df, encoded_emotion_df], axis=1)
        df = df.drop(columns=['emotion'])  # Drop original emotion column

    return df

# Anomaly Detection with Isolation Forest
def detect_anomalies(data):
    df = preprocess_data(data)

    # Ensure the necessary columns exist
    if 'sentiment' not in df.columns:
        return []  # No sentiment data to analyze

    # Handle missing values
    # Fill missing sentiment values with the mean or drop rows with missing sentiment
    if df['sentiment'].isnull().any():
        df['sentiment'].fillna(df['sentiment'].mean(), inplace=True)  # You can choose to fill with mean or median

    # Drop rows where important columns are missing
    df.dropna(subset=['timestamp'], inplace=True)  # Ensure timestamp is present

    # Convert 'timestamp' column to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')

    # Filter out future dates
    today = datetime.now()
    df = df[df['timestamp'] <= today]  # Keep only records with dates in the past or today

    # Features for Isolation Forest (use sentiment + encoded emotion columns)
    feature_columns = [col for col in df.columns if 'emotion' in col or col == 'sentiment']
    features = df[feature_columns]

    # Check if there are enough data points to perform anomaly detection
    if len(features) < 2:
        return []  # Not enough data to analyze

    # Create and fit the Isolation Forest model
    model = IsolationForest(contamination=0.1)
    model.fit(features)

    # Predict anomalies
    df['anomaly'] = model.predict(features)

    # Anomalies are marked as -1
    anomalies = df[df['anomaly'] == -1]

    return anomalies

@app.route('/detect_anomalies', methods=['POST'])
def anomaly_detection_route():
    try:
        data = request.json
        print(data)
        anomalies = detect_anomalies(data)
        anomalies_json = anomalies.to_dict(orient='records')
        return jsonify(anomalies_json), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
