from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_admin import credentials, firestore, initialize_app
import pandas as pd
import numpy as np
from sklearn.decomposition import TruncatedSVD

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow CORS for all origins

# Initialize Firebase Admin SDK
cred = credentials.Certificate('emoshown-firebase-adminsdk.json')
initialize_app(cred)
db = firestore.client()

# Function to fetch mood based on sentiment score from the journals collection
def fetch_user_mood(userId):
    # Fetch the latest journal entry for the user
    journal_ref = db.collection('journals').where('userId', '==', userId) \
        .order_by('timestamp', direction=firestore.Query.DESCENDING).limit(1).stream()
    
    mood = 'neutral'  # Default mood
    for journal in journal_ref:
        journal_data = journal.to_dict()
        sentiment_score = journal_data.get('sentimentScore', 0)  # Fetch sentiment score from the journal

        # Determine mood based on sentiment score
        if sentiment_score > 0.5:
            mood = 'positive'
        elif sentiment_score < -0.5:
            mood = 'negative'
        else:
            mood = 'neutral'

    return mood

# Function to fetch activities and resources based on mood
def fetch_mood_based_data(mood):
    activities_ref = db.collection('activities').where('emotionalImpact', 'array_contains', mood).stream()
    resources_ref = db.collection('resources').where('tags', 'array_contains', mood).stream()

    user_item_data = []

    # Collect activity data
    for activity in activities_ref:
        activity_data = activity.to_dict()
        user_item_data.append({
            'id': activity.id,
            'type': 'activity',
            'title': activity_data['title'],
            'description': activity_data['description'],
            'likes': activity_data['likes'],
            'dislikes': activity_data['dislikes']
        })

    # Collect resource data
    for resource in resources_ref:
        resource_data = resource.to_dict()
        user_item_data.append({
            'id': resource.id,
            'type': 'resource',
            'title': resource_data['title'],
            'description': resource_data['description'],
            'likes': resource_data['likes'],
            'dislikes': resource_data['dislikes']
        })

    return pd.DataFrame(user_item_data)

# Matrix Factorization for recommendations
def matrix_factorization_recommendations(user_item_df):
    # Create user-item interaction matrix (dummy until recoratings are available)
    user_item_matrix = user_item_df.pivot_table(index='user_id', columns='id', values='rating', fill_value=0)

    # Perform matrix factorization (SVD)
    svd = TruncatedSVD(n_components=50)
    matrix = svd.fit_transform(user_item_matrix)

    # For simplicity, we will return the top items that are positively correlated to the user's past activities/resources
    recommendations = []  # Fill this with the generated recommendations logic based on SVD results
    return recommendations

# Endpoint for recommendations based on sentiment score
@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        userId = request.json['userId']

        # Fetch the user's mood based on their sentiment score from the journals collection
        mood = fetch_user_mood(userId)
        print("User Mood:", mood)  # Log the fetched mood

        # Fetch activities/resources based on the user's mood
        user_item_df = fetch_mood_based_data(mood)

        print("User Item DataFrame:", user_item_df)  # Log the DataFrame for debugging

        if user_item_df.empty:
            return jsonify({'message': 'No recommendations available for this mood.'}), 200

        # Generate recommendations
        recommendations = user_item_df[['id', 'type', 'title', 'description']].to_dict(orient='records')
        
        print("Recommendations:", recommendations)  # Debugging line

        return jsonify(recommendations)

    except Exception as e:
        print("Error in recommend endpoint:", str(e))  # Log error
        return jsonify({'error': str(e)}), 500

# Endpoint to rate recommendations (to populate recoratings collection)
@app.route('/rate', methods=['POST'])
def rate_recommendation():
    try:
        data = request.json
        userId = data['userId']
        itemId = data['itemId']
        like = data['like']  # True for like, False for dislike
        itemType = data['type']

        # Store rating in recoratings collection
        rating_data = {
            'userId': userId,
            'activityId': itemId if itemType == 'activity' else None,
            'resourceId': itemId if itemType == 'resource' else None,
            'like': like,
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        db.collection('recoratings').add(rating_data)

        return jsonify({'message': 'Rating saved successfully.'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
