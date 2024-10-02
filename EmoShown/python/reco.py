from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_admin import credentials, firestore, initialize_app
import numpy as np
import pandas as pd

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow CORS for all origins

# Initialize Firebase Admin SDK
cred = credentials.Certificate('emoshown-firebase-adminsdk.json')
initialize_app(cred)
db = firestore.client()

# Function to fetch user-item interaction data
def fetch_user_item_data():
    # Fetch likes/dislikes data
    activities_ref = db.collection('activities').stream()
    resources_ref = db.collection('resources').stream()

    user_item_data = []
    
    # Collect activity data
    for activity in activities_ref:
        activity_data = activity.to_dict()
        user_item_data.append({
            'id': activity.id,
            'type': 'activity',
            'likes': activity_data['likes'],
            'dislikes': activity_data['dislikes']
        })

    # Collect resource data
    for resource in resources_ref:
        resource_data = resource.to_dict()
        user_item_data.append({
            'id': resource.id,
            'type': 'resource',
            'likes': resource_data['likes'],
            'dislikes': resource_data['dislikes']
        })

    return pd.DataFrame(user_item_data)

# Collaborative Filtering with Matrix Factorization
def matrix_factorization_recommendations(user_item_df, user_id):
    # Creating a user-item interaction matrix
    user_item_matrix = user_item_df.pivot_table(index='user_id', columns='id', values='rating')

    # Performing matrix factorization (e.g., using SVD)
    # Here we should use a library or custom implementation of SVD.
    
    # For example:
    from sklearn.decomposition import TruncatedSVD
    
    svd = TruncatedSVD(n_components=50)  # You can adjust the number of components
    matrix = svd.fit_transform(user_item_matrix.fillna(0))

    # Generate recommendations
    # (You need to implement how you correlate this matrix with the user's previous activities)

    recommendations = []  # Fill this with the generated recommendations
    return recommendations

# Endpoint for recommendations
@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        userId = request.json['userId']

        # Fetch user-item interaction data
        user_item_df = fetch_user_item_data()

        # Get recommendations using matrix factorization
        recommendations = matrix_factorization_recommendations(user_item_df, userId)

        if not recommendations:
            return jsonify({'message': 'No recommendations available.'}), 200

        return jsonify(recommendations)  # Return recommendations

    except Exception as e:
        return jsonify({'error': str(e)}), 500  # Return error message with status code

# Run the app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # Enable debug mode for detailed logs
