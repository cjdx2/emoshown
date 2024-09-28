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
CORS(app, resources={r"/*": {"origins": "*"}})  # You can replace "*" with the specific origin if needed

# Fetch data from the 'journals' collection in Firebase
def fetch_journals():
    journals_ref = db.collection('journals')
    docs = journals_ref.stream()

    data = []
    for doc in docs:
        journal_data = doc.to_dict()
        data.append(journal_data)

    print("Fetched Journals Data:", data)  # Log the fetched data
    return data

# Convert emotion categories to numerical values using OneHotEncoder
def preprocess_data(data):
    # Create DataFrame from the input data
    df = pd.DataFrame(data)

    # Ensure 'emotion' column exists and handle missing values
    if 'emotion' in df.columns:
        df['emotion'] = df['emotion'].fillna('unknown')  # Fill missing emotions with 'unknown'
        
        # Initialize OneHotEncoder
        encoder = OneHotEncoder(sparse_output=False)  # Use sparse_output=False to get a dense array
        
        # Fit and transform the 'emotion' column
        encoded_emotions = encoder.fit_transform(df[['emotion']])
        
        # Create a DataFrame with the one-hot encoded emotion values
        encoded_emotion_df = pd.DataFrame(
            encoded_emotions, 
            columns=encoder.get_feature_names_out(['emotion'])
        )
        
        # Concatenate the encoded emotions with the original DataFrame
        df = pd.concat([df, encoded_emotion_df], axis=1)
        
        # Drop the original 'emotion' column as it's no longer needed
        df = df.drop(columns=['emotion'])

    return df

# Anomaly Detection with Isolation Forest
def detect_anomalies(data):
    df = preprocess_data(data)

    # If the dataframe is empty or missing necessary columns
    if df.empty or 'sentiment' not in df.columns:
        return []  # Return an empty list, meaning no anomalies found

    # Check for sufficient data points for analysis
    if len(df) < 2:
        return []  # Not enough data for anomaly detection

    # Handle missing values
    df['sentiment'] = df['sentiment'].fillna(df['sentiment'].mean())

    # Convert 'date' column to datetime (use 'date' instead of 'timestamp')
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    df.sort_values(by='date', inplace=True)

    # Calculate sentiment change day-to-day
    df['sentiment_change'] = df['sentiment'].diff().fillna(0)

    # Create and fit the Isolation Forest model
    model = IsolationForest(contamination=0.1)
    df['anomaly'] = model.fit_predict(df[['sentiment']])

    # Anomalies are marked as -1
    anomalies = df[df['anomaly'] == -1][['date', 'sentiment_change']]

    # Convert anomalies to readable format
    anomalies['day'] = anomalies['date'].dt.strftime('%A, %B %d, %Y')
    anomalies['change'] = (anomalies['sentiment_change'] * 100).round(2)  # Convert change to percentage

    return anomalies[['day', 'change']]

@app.route('/detect_anomalies', methods=['POST'])
def anomaly_detection_route():
    try:
        data = request.json
        print(data)
        anomalies = detect_anomalies(data)
        anomalies_json = anomalies.to_dict(orient='records')
        return jsonify(anomalies_json), 200
    except Exception as e:
        print(f"Error: {e}", flush=True)  # Ensure the error is printed to the log
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
