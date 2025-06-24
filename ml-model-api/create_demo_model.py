"""
Create a demo model for fake news detection
This script creates a simple model for demonstration purposes
"""

import os
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_demo_data():
    """Create demo training data"""
    
    # Sample fake news texts (simplified for demo)
    fake_news = [
        "SHOCKING! Doctors HATE this one weird trick that will change your life forever!",
        "BREAKING: Government secretly hiding aliens, leaked documents reveal truth!",
        "Miracle cure that Big Pharma doesn't want you to know about!",
        "You won't believe what happens next in this incredible story!",
        "URGENT: This secret method will make you rich overnight!",
        "EXPOSED: The truth they don't want you to see!",
        "Unbelievable discovery that will shock the world!",
        "This one simple trick will solve all your problems instantly!",
        "Scientists don't want you to know this shocking truth!",
        "BREAKING NEWS: Celebrity reveals secret that will amaze you!"
    ]
    
    # Sample real news texts (simplified for demo)
    real_news = [
        "According to a study published in Nature, researchers have found evidence of climate change effects.",
        "The Federal Reserve announced a new interest rate policy following economic analysis.",
        "Scientists at MIT have developed a new material with potential applications in renewable energy.",
        "A peer-reviewed study shows correlation between exercise and improved mental health outcomes.",
        "Government officials confirmed the implementation of new environmental regulations next year.",
        "Research data indicates a significant trend in urban population growth over the past decade.",
        "The World Health Organization released updated guidelines based on recent medical evidence.",
        "Economic indicators suggest moderate growth in the manufacturing sector this quarter.",
        "University researchers published findings in the Journal of Medical Science.",
        "The Department of Energy announced funding for renewable energy projects."
    ]
    
    # Combine data
    texts = fake_news + real_news
    labels = [1] * len(fake_news) + [0] * len(real_news)  # 1 = fake, 0 = real
    
    return texts, labels

def create_model():
    """Create and train a demo model"""
    
    logger.info("Creating demo training data...")
    texts, labels = create_demo_data()
    
    # Create TF-IDF vectorizer
    logger.info("Creating TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(
        max_features=1000,
        stop_words='english',
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.9
    )
    
    # Vectorize texts
    X = vectorizer.fit_transform(texts)
    y = np.array(labels)
    
    # Create a simple Random Forest model
    logger.info("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=50,
        random_state=42,
        max_depth=10
    )
    
    # Train the model
    model.fit(X, y)
    
    # Test the model
    predictions = model.predict(X)
    accuracy = np.mean(predictions == y)
    logger.info(f"Demo model accuracy on training data: {accuracy:.2f}")
    
    return model, vectorizer

def save_model(model, vectorizer, models_dir='models'):
    """Save the model and vectorizer"""
    
    # Get the current script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    models_path = os.path.join(script_dir, models_dir)
    
    # Create models directory if it doesn't exist
    os.makedirs(models_path, exist_ok=True)
    
    model_path = os.path.join(models_path, 'fake_news_model.pkl')
    vectorizer_path = os.path.join(models_path, 'tfidf_vectorizer.pkl')
    
    logger.info(f"Saving model to {model_path}")
    joblib.dump(model, model_path)
    
    logger.info(f"Saving vectorizer to {vectorizer_path}")
    joblib.dump(vectorizer, vectorizer_path)
    
    logger.info("✅ Demo model and vectorizer saved successfully!")
    return model_path, vectorizer_path

if __name__ == '__main__':
    print("Creating demo fake news detection model...")
    print(f"Python version: {os.sys.version}")
    print(f"Working directory: {os.getcwd()}")
    
    try:
        # Create the model
        model, vectorizer = create_model()
        
        # Save the model
        model_path, vectorizer_path = save_model(model, vectorizer)
        
        print(f"\n✅ Demo model created successfully!")
        print(f"📁 Model saved to: {model_path}")
        print(f"📁 Vectorizer saved to: {vectorizer_path}")
        print("\n🚀 You can now start the Flask API server!")
        
    except Exception as e:
        print(f"❌ Error creating demo model: {e}")
        import traceback
        traceback.print_exc()
        exit(1)