import firebase_admin
from firebase_admin import credentials, firestore
from sklearn.ensemble import IsolationForest
import pandas as pd

# Initialize Firebase
cred = credentials.Certificate('emoshown-firebase-adminsdk.json')
firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()

# Fetch data from the 'journals' collection
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
    # Create a DataFrame from the fetched data
    df = pd.DataFrame(data)

    # Assuming 'emotion' and 'sentiment_score' are columns in your Firestore data
    features = df[['emotion', 'sentiment_score']]

    # Create and fit the Isolation Forest model
    model = IsolationForest(contamination=0.1)  # Adjust contamination as needed
    model.fit(features)

    # Predict anomalies
    df['anomaly'] = model.predict(features)

    # Anomalies are marked as -1
    anomalies = df[df['anomaly'] == -1]
    return anomalies

# Main function
def main():
    data = fetch_journals()
    if data:
        anomalies = detect_anomalies(data)
        print("Detected Anomalies:")
        print(anomalies)
    else:
        print("No data found in the 'journals' collection.")

if __name__ == '__main__':
    main()
