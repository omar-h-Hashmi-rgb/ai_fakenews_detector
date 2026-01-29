#!/usr/bin/env python3
"""
AI Fake News Detection Microservice
Flask API for machine learning predictions, sentiment analysis, and text explanation
"""

import os
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from textblob import TextBlob
import newspaper
from newspaper import Article
import pickle
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
import warnings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Suppress warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Global variables for model and vectorizer
model = None
vectorizer = None
model_loaded = False
# Initialize Gemini Client
try:
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    logger.info(f"🔑 Gemini API Key found: {'Yes' if gemini_api_key else 'No'}")
    
    if gemini_api_key:
        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        logger.info("✅ Gemini Client initialized")
    else:
        logger.warning("⚠️ GEMINI_API_KEY not found in environment variables")
except Exception as e:
    logger.error(f"❌ Failed to initialize Gemini client: {e}")

def load_model():
    """Load the fake news detection model"""
    global model, vectorizer, model_loaded
    
    try:
        model_path = os.getenv('MODEL_PATH', 'models/fake_news_model.pkl')
        vectorizer_path = os.getenv('VECTORIZER_PATH', 'models/tfidf_vectorizer.pkl')
        
        if os.path.exists(model_path) and os.path.exists(vectorizer_path):
            model = joblib.load(model_path)
            vectorizer = joblib.load(vectorizer_path)
            model_loaded = True
            logger.info("✅ Model and vectorizer loaded successfully")
        else:
            logger.warning("⚠️  Model files not found, using mock predictions")
            model_loaded = False
            
    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
        model_loaded = False

def create_mock_model():
    """Create a mock model for demonstration purposes"""
    import random
    
    def mock_predict(text):
        # Simple heuristic: articles with certain keywords are more likely to be fake
        fake_indicators = [
            'shocking', 'unbelievable', 'secret', 'they dont want you to know', 
            'doctors hate', 'one weird trick', 'breaking', 'urgent',
            'miracle', 'cure', 'conspiracy', 'chip', '5g'
        ]
        
        text_lower = text.lower()
        fake_score = 0
        
        for indicator in fake_indicators:
            if indicator in text_lower:
                fake_score += 0.15
        
        # Add some randomness
        fake_score += random.uniform(0, 0.3)
        
        # Clamp between 0 and 1
        fake_score = min(1.0, max(0.0, fake_score))
        
        return 'fake' if fake_score > 0.5 else 'real', fake_score if fake_score > 0.5 else 1 - fake_score
    
    return mock_predict

def predict_with_gemini(text):
    """Use Google Gemini for prediction"""
    if not os.getenv('GEMINI_API_KEY'):
        logger.error("Gemini API key not configured")
        return None
    
    try:
        import google.generativeai as genai
        
        # Get the model
        model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        model = genai.GenerativeModel(model_name)
        
        logger.info(f"Attempting prediction with model: {model_name}")
        
        prompt = f"""
        You are an expert Fake News Detector. Your job is to analyze news articles and determine their credibility.
        
        Analyze the provided text and classify it as 'real' or 'fake'.
        
        GUIDELINES:
        - REAL: Credible reporting, factual tone, standard journalistic style (including sports, finance, entertainment), specific details, neutral language.
        - FAKE: Conspiracy theories, highly emotional/manipulative language, obvious fabrication, lack of logic/evidence, satirical/parody content (e.g., The Onion).
        
        CRITICAL EDGE CASES:
        1. SATIRE: Articles from sources like 'The Onion' or 'Babylon Bee' should be classified as 'FAKE' (as they are not factual), but ensure the confidence reflects it is satire.
        2. CLICKBAIT: Articles with sensational headlines but FACTUAL bodies should be classified as 'REAL'. Do not punish a real story just for a catchy title.
        3. OPINION/EDITORIAL: Legitimate opinion pieces from reputable sources should be classified as 'REAL', even if biased.
        
        IMPORTANT: 
        - If the text is from a reputable source (like BBC, CNN, Reuters, AP) or written in a standard news style, classify it as 'real'.
        - Only flag as 'fake' if there are clear signs of misinformation, fabrication, or satire.
        
        Return ONLY a JSON object with two keys: 
        1. 'prediction' (string: 'real' or 'fake') 
        2. 'confidence' (float: 0.0 to 1.0)
        
        Do not include any markdown formatting, backticks, or other text. Just the raw JSON string.
        
        Analyze this news text:
        
        {text[:4000]}
        """
        
        # Generate content
        response = model.generate_content(prompt)
        content = response.text.strip()
        
        # Clean up potential markdown formatting if Gemini adds it
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:] 
        if content.endswith('```'):
            content = content[:-3]
        
        content = content.strip()
            
        import json
        result = json.loads(content)
        
        logger.info(f"✅ Success with Gemini")
        return result['prediction'].lower(), float(result['confidence'])
            
    except Exception as e:
        logger.error(f"Failed with Gemini: {e}")
        return None

# Load model on startup
load_model()

@app.route('/', methods=['GET'])
def index():
    """Welcome endpoint"""
    return jsonify({
        'message': 'Welcome to the AI Fake News Detection API!',
        'service_status': 'running',
        'health_check': '/health',
        'endpoints': {
            '/predict': 'POST - Predict if news is fake or real',
            '/sentiment': 'POST - Analyze text sentiment',
            '/explain': 'POST - Explain a prediction',
            '/extract-article': 'POST - Extract article text from a URL'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'OK',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': model_loaded,
        'service': 'AI Fake News Detection API'
    })

@app.route('/predict', methods=['POST'])
def predict_fake_news():
    """Predict if news article is real or fake"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text'].strip()
        
        if len(text) < 10:
            return jsonify({'error': 'Text too short for analysis'}), 400
        
        use_advanced = data.get('use_advanced', False)
        
        label = 'unknown'
        confidence = 0.5
        
        if use_advanced:
            # STRICTLY ADVANCED MODE (Gemini Only)
            logger.info("🚀 Advanced Mode: Using Google Gemini")
            gemini_result = predict_with_gemini(text)
            
            if gemini_result:
                label, confidence = gemini_result
                logger.info(f"✅ Gemini Prediction: {label} ({confidence})")
            else:
                return jsonify({'error': 'Advanced AI service unavailable. Please check API key.'}), 503
        
        else:
            # STRICTLY STANDARD MODE (Local Only)
            logger.info("🤖 Standard Mode: Using Local Model")
            if model_loaded and model is not None and vectorizer is not None:
                try:
                    # Vectorize the text
                    text_vector = vectorizer.transform([text])
                    
                    # Get prediction and probabilities
                    prediction = model.predict(text_vector)[0]
                    probabilities = model.predict_proba(text_vector)[0]
                    
                    # Determine confidence based on prediction
                    if prediction == 1:  # Fake
                        confidence = probabilities[1]
                        label = 'fake'
                    else:  # Real
                        confidence = probabilities[0]
                        label = 'real'
                    logger.info(f"✅ Local Model Prediction: {label} ({confidence})")
                
                except Exception as e:
                    logger.error(f"Model prediction error: {e}")
                    # Fall back to mock model
                    mock_predict = create_mock_model()
                    label, confidence = mock_predict(text)
            else:
                # Use mock model if local failed to load
                mock_predict = create_mock_model()
                label, confidence = mock_predict(text)
        
        # Get sentiment for additional context
        try:
            blob = TextBlob(text)
            sentiment = blob.sentiment
            sentiment_label = 'positive' if sentiment.polarity > 0.1 else 'negative' if sentiment.polarity < -0.1 else 'neutral'
            sentiment_score = abs(sentiment.polarity)
        except:
            sentiment_label = 'neutral'
            sentiment_score = 0.5
        
        result = {
            'prediction': label,
            'confidence': float(confidence),
            'sentiment': {
                'label': sentiment_label,
                'score': float(sentiment_score)
            },
            'timestamp': datetime.now().isoformat(),
            'model_version': 'v1.0' if model_loaded else 'mock'
        }
        
        logger.info(f"Prediction: {label} (confidence: {confidence:.3f})")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': 'Prediction failed', 'message': str(e)}), 500

@app.route('/sentiment', methods=['POST'])
def analyze_sentiment():
    """Analyze sentiment of text"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text'].strip()
        
        if len(text) < 5:
            return jsonify({'error': 'Text too short for sentiment analysis'}), 400
        
        # Use TextBlob for sentiment analysis
        blob = TextBlob(text)
        sentiment = blob.sentiment
        
        # Determine sentiment label
        if sentiment.polarity > 0.1:
            label = 'positive'
        elif sentiment.polarity < -0.1:
            label = 'negative'
        else:
            label = 'neutral'
        
        result = {
            'sentiment': {
                'label': label,
                'score': abs(sentiment.polarity),
                'polarity': sentiment.polarity,
                'subjectivity': sentiment.subjectivity
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        return jsonify({'error': 'Sentiment analysis failed', 'message': str(e)}), 500

@app.route('/explain', methods=['POST'])
def explain_prediction():
    """Provide explanation for the prediction using keyword analysis"""
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Text is required'}), 400
        
        text = data['text'].strip()
        
        if len(text) < 10:
            return jsonify({'error': 'Text too short for explanation'}), 400
        
        # Simple keyword-based explanation
        # In a real implementation, you would use SHAP or LIME
        
        # Keywords that might indicate fake news
        fake_keywords = [
            'shocking', 'unbelievable', 'secret', 'exposed', 'breaking', 'urgent',
            'doctors hate', 'one weird trick', 'you wont believe', 'conspiracy',
            'government doesnt want', 'miracle cure', 'instant', 'guaranteed'
        ]
        
        # Keywords that might indicate real news
        real_keywords = [
            'according to', 'research shows', 'study finds', 'data indicates',
            'experts say', 'official', 'confirmed', 'investigation', 'report',
            'published', 'peer-reviewed', 'evidence', 'statistics'
        ]
        
        text_lower = text.lower()
        words = text_lower.split()
        
        # Find important keywords and their importance scores
        found_keywords = []
        importance_scores = []
        
        # Check for fake indicators
        for keyword in fake_keywords:
            if keyword in text_lower:
                found_keywords.append(keyword)
                importance_scores.append(0.8 + np.random.random() * 0.2)  # High importance for fake indicators
        
        # Check for real indicators
        for keyword in real_keywords:
            if keyword in text_lower:
                found_keywords.append(keyword)
                importance_scores.append(0.6 + np.random.random() * 0.3)  # Medium-high importance for real indicators
        
        # Add some high-frequency words as additional context
        word_freq = {}
        for word in words:
            if len(word) > 4:  # Only consider longer words
                word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top frequent words
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        for word, freq in sorted_words:
            if word not in found_keywords and freq > 1:
                found_keywords.append(word)
                importance_scores.append(0.3 + (freq / len(words)) * 0.4)
        
        # Ensure we have at least some keywords
        if not found_keywords:
            found_keywords = ['content', 'analysis', 'text']
            importance_scores = [0.4, 0.3, 0.2]
        
        # Sort by importance
        keyword_importance = list(zip(found_keywords, importance_scores))
        keyword_importance.sort(key=lambda x: x[1], reverse=True)
        
        # Limit to top 10 keywords
        keyword_importance = keyword_importance[:10]
        
        keywords, scores = zip(*keyword_importance) if keyword_importance else ([], [])
        
        result = {
            'explanation': {
                'keywords': list(keywords),
                'importance_scores': [float(score) for score in scores],
                'method': 'keyword-based',
                'note': 'Keywords extracted based on common fake news indicators and content analysis'
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Explanation error: {e}")
        return jsonify({'error': 'Explanation failed', 'message': str(e)}), 500

@app.route('/extract-article', methods=['POST'])
def extract_article():
    """Extract article content from URL"""
    try:
        data = request.get_json()
        
        if not data or 'url' not in data:
            return jsonify({'error': 'URL is required'}), 400
        
        url = data['url'].strip()
        
        if not url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid URL format'}), 400
        
        # Use newspaper3k to extract article
        config = newspaper.Config()
        config.browser_user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        config.request_timeout = 10
        
        article = Article(url, config=config)
        article.download()
        article.parse()
        
        if not article.text or len(article.text.strip()) < 50:
            return jsonify({'error': 'Could not extract sufficient content from URL'}), 400
        
        result = {
            'text': article.text,
            'title': article.title or '',
            'authors': article.authors or [],
            'publish_date': article.publish_date.isoformat() if article.publish_date else None,
            'url': url,
            'extracted_at': datetime.now().isoformat()
        }
        
        logger.info(f"Successfully extracted article from: {url}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Article extraction error: {e}")
        return jsonify({
            'error': 'Failed to extract article',
            'message': 'Could not access or parse the article from the provided URL'
        }), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Create models directory if it doesn't exist
    os.makedirs('models', exist_ok=True)
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"🚀 Starting AI Fake News Detection API on port {port}")
    logger.info(f"📊 Model loaded: {model_loaded}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)