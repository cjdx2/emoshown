from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.decomposition import NMF
import firebase_admin
from firebase_admin import credentials, firestore
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Firebase
cred = credentials.Certificate('emoshown-firebase-adminsdk.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# Function to load data from reco.json
def load_reco_json():
    with open('reco.json', 'r') as file:
        return pd.DataFrame(json.load(file))

# Function to get data from Firebase
def get_recoratings_data():
    recoratings_ref = db.collection('recoratings').stream()
    recoratings = []
    for rec in recoratings_ref:
        rec_data = rec.to_dict()
        recoratings.append(rec_data)
    return pd.DataFrame(recoratings)

# Collaborative Filtering using Matrix Factorization
def recommend_items(user_id, activities_resources, recoratings_df):
    # Create a user-item matrix
    user_item_matrix = recoratings_df.pivot_table(index='userId', columns='title', values='like').fillna(0)

    # Check if user has existing ratings
    if user_id in user_item_matrix.index:
        nmf = NMF(n_components=5, init='random', random_state=42)
        user_matrix = nmf.fit_transform(user_item_matrix)
        item_matrix = nmf.components_

        # Predicted ratings
        predicted_ratings = np.dot(user_matrix, item_matrix)
        user_ratings = pd.Series(predicted_ratings[user_item_matrix.index.get_loc(user_id)], index=user_item_matrix.columns)
        user_ratings = user_ratings.sort_values(ascending=False)

        # Filter out items already rated by the user
        unrated_items = user_ratings[user_item_matrix.loc[user_id] == 0]
        recommendations = unrated_items.index.tolist()
    else:
        recommendations = activities_resources['title'].tolist()

    return recommendations[:10]

# API to get recommendations
@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        user_id = data.get('userId')
        sentiment = data.get('sentiment')

        print("Received user ID:", user_id)
        print("Received sentiment:", sentiment)  # Log sentiment

        # Load activities/resources from reco.json
        activities_resources = load_reco_json()

        # Optionally, filter activities_resources based on sentiment
        # (assuming your reco.json has a structure with emotionalImpact)
        activities_resources = activities_resources[activities_resources['emotionalImpact'].apply(lambda x: sentiment in x)]

        # Get recoratings data
        recoratings_df = get_recoratings_data()

        # Get recommendations
        recommendations = recommend_items(user_id, activities_resources, recoratings_df)

        return jsonify({"recommendations": recommendations})

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
