from flask import Flask, request, jsonify
from firebase_admin import credentials, firestore, initialize_app
import numpy as np
import pandas as pd
from surprise import Dataset, Reader, SVD

# Initialize Flask app
app = Flask(__name__)

# Initialize Firebase Admin SDK
cred = credentials.Certificate('emoshown-firebase-adminsdk.json')
initialize_app(cred)
db = firestore.client()

# Endpoint for matrix factorization
@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        # Get userId from request
        userId = request.json['userId']

        # Fetch the latest journal entry for sentiment analysis
        journals_ref = db.collection('journals').where('userId', '==', userId).order_by('date', direction=firestore.Query.DESCENDING).limit(1).stream()
        latest_journal = next(journals_ref, None)

        if latest_journal:
            journal_data = latest_journal.to_dict()
            sentiment = journal_data['sentiment']
            # Determine mood state based on sentiment scores
            if sentiment['compound'] >= 0.05:
                mood_state = 'positive'
            elif sentiment['compound'] <= -0.05:
                mood_state = 'negative'
            else:
                mood_state = 'neutral'
        else:
            mood_state = 'neutral'  # Default mood state if no journal found

        # Define mood-based filtering criteria
        mood_filters = {
            "positive": ["positive"],  # Activities and resources with a positive impact
            "neutral": ["neutral"],  # Activities and resources with a neutral impact
            "negative": ["negative"],  # Activities and resources with a negative impact
        }

        # Fetch activities based on mood state
        activities_ref = db.collection('activities').stream()
        resources_ref = db.collection('resources').stream()
        
        recommendations = []

        # Filter activities based on mood state
        for activity in activities_ref:
            activity_data = activity.to_dict()
            if set(mood_filters[mood_state]).intersection(set(activity_data['emotionalImpact'])):
                recommendations.append({
                    'activityId': activity.id,
                    'type': 'activity',
                    'predicted_rating': None  # Can be set later when users rate it
                })

        # Filter resources based on mood state
        for resource in resources_ref:
            resource_data = resource.to_dict()
            if set(mood_filters[mood_state]).intersection(set(resource_data['tags'])):
                recommendations.append({
                    'resourceId': resource.id,
                    'type': 'resource',
                    'predicted_rating': None  # Can be set later when users rate it
                })

        return jsonify(recommendations)  # Return all recommendations
    except Exception as e:
        return jsonify({'error': str(e)})
    
@app.route('/rate', methods=['POST'])
def rate():
    try:
        data = request.json
        userId = data['userId']
        id = data['id']
        type = data['type']
        isLike = data['isLike']  # true for like, false for dislike

        if type == 'activity':
            activity_ref = db.collection('activities').document(id)
            activity_ref.update({
                'likes': firestore.Increment(1) if isLike else firestore.Increment(0),
                'dislikes': firestore.Increment(0) if isLike else firestore.Increment(1)
            })
        elif type == 'resource':
            resource_ref = db.collection('resources').document(id)
            resource_ref.update({
                'likes': firestore.Increment(1) if isLike else firestore.Increment(0),
                'dislikes': firestore.Increment(0) if isLike else firestore.Increment(1)
            })
        else:
            return jsonify({'error': 'Invalid type provided.'}), 400

        return jsonify({'message': 'Rating updated successfully.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
