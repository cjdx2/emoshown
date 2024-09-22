from flask import Flask, request, jsonify
from flask_cors import CORS
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

analyzer = SentimentIntensityAnalyzer()

@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.json
        text = data.get('text', '')
        emotion = data.get('emotion', '')

        if not text and not emotion:
            return jsonify({'error': 'No text or emotion provided'}), 400

        # Combine text and emotion for analysis
        combined_text = f'{emotion} {text}'.strip().lower()

        # Perform sentiment analysis
        scores = analyzer.polarity_scores(combined_text)
        return jsonify(scores)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Use host='0.0.0.0' to make it accessible on the local network
    app.run(debug=True, host='0.0.0.0')
