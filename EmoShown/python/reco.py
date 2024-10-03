from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.decomposition import NMF
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Firebase
cred = credentials.Certificate('emoshown-firebase-adminsdk.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

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
        # Matrix Factorization using Non-negative Matrix Factorization (NMF)
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
        # If no recoratings for this user, recommend all activities/resources applicable to the user's sentiment
        recommendations = activities_resources['title'].tolist()

    return recommendations[:10]

# API to get recommendations
@app.route('/recommend', methods=['GET'])
def recommend():
    user_id = request.args.get('userId')
    sentiment = request.args.get('sentiment')

    # Get activities/resources based on sentiment
    activities_ref = db.collection('activities').where('emotionalImpact', 'array_contains', sentiment).stream()
    resources_ref = db.collection('resources').where('emotionalImpact', 'array_contains', sentiment).stream()

    activities = [act.to_dict() for act in activities_ref]
    resources = [res.to_dict() for res in resources_ref]
    activities_resources = pd.DataFrame(activities + resources)

    # Get recoratings data
    recoratings_df = get_recoratings_data()

    # Get recommendations
    recommendations = recommend_items(user_id, activities_resources, recoratings_df)
    
    return jsonify({"recommendations": recommendations})

if __name__ == '__main__':
    app.run(debug=True)
