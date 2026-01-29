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
    # Expanded Fake News Dataset (User examples + diverse patterns)
    fake_news = [
        # User Specific Examples
        "Scientists Develop Smartphone That Charges Using Human Voice. Researchers claim talking for 30 minutes fully charges device.",
        "Drinking Coffee at Exactly 6:47 AM Guarantees Weight Loss, Study Says. Burns fat 3x faster.",
        "Government Announces Plan to Replace Exams with AI Mood Sensors. Students evaluated on facial expressions.",
        
        # Health / Medical Miracles
        "Doctors Hate Him! This simple kitchen ingredient cures diabetes in 3 days.",
        "New miracle pill melts 20lbs of belly fat overnight with no exercise.",
        "Secret cancer cure found in ancient Amazonian root, Big Pharma hiding it.",
        "Drinking silver water eliminates all viruses and bacteria from your body instantly.",
        "Eating raw onions every day prevents all forms of heart disease.",
        "Vaccines contain microchips designed to track your every movement.",
        "Lemon juice mixed with banking soda cures stage 4 cancer immediately.",
        "Wearing copper bracelets heals arthritis permanently within 24 hours.",
        "New study claims breathing only through left nostril extends life by 20 years.",
        "Scientists discover gene that stops aging, pill available next month.",
        
        # Technology / Sci-Fi
        "Apple to release transparent invisible iPhone next year.",
        "Elon Musk announces teleportation device testing successful.",
        "NASA admits Earth is actually flat, leaked documents confirm.",
        "5G towers cause mind control rays, whistleblower reveals.",
        "New free energy device generates unlimited electricity from thin air.",
        "Secret government weather machine causes all hurricanes.",
        "Microchips in tap water are rewriting your DNA.",
        "Internet will be shut down permanently next week for 'Global Reset'.",
        "Robots demanding human rights seize control of factory in Japan.",
        "Time travel proven possible by CERN scientists, already in use.",
        
        # Politics / Conspiracy
        "Pope Francis endorses specific candidate for US President in shock statement.",
        "Queen Elizabeth is still alive and living in a bunker in Antarctica.",
        "Government to ban all private property ownership by 2030.",
        "Secret laws passed allowing police to read your thoughts.",
        "Currency to be replaced by social credit score points next month.",
        "Celebrity admits to being a reptilian shapeshifter on live TV.",
        "United Nations to dissolve all national borders next Tuesday.",
        "Leaked emails prove earth is hollow and inhabited.",
        "Famous politician found to be a clone, original died years ago.",
        "New law requires citizens to house government officials in their homes.",
        
        # Clickbait / Sensationalism
        "You won't believe what this child found in his backyard!",
        "This one weird trick will save you thousands on car insurance.",
        "Shocking video shows what really happens at the Bermuda Triangle.",
        "The secret reason why you should never eat bananas again.",
        "Lottery winner shares secret algorithm to win every time.",
        "Banks don't want you to know this mortgage loophole.",
        "Restaurant puts this disgusting ingredient in your burger.",
        "Airline pilot spots city floating in the clouds.",
        "History books are wrong: Pyramids built by dinosaurs.",
        "Archaeologists find modern smartphone in 2000-year-old tomb."
    ]
    
    # Expanded Real News Dataset (Factual, neutral tone)
    real_news = [
        # Science & Tech
        "NASA's James Webb Telescope captures new image of distant galaxy cluster.",
        "Study published in Nature indicates rise in global sea levels.",
        "Apple announces new iPhone with improved battery life and camera system.",
        "SpaceX successfully launches Starlink satellites into orbit.",
        "Researchers at MIT develop more efficient solar panel efficiency.",
        "Electric vehicle sales surpass traditional combustion engines in Norway.",
        "Microsoft releases security update for Windows 11 operating system.",
        "Scientists discover new species of deep-sea fish in Pacific Ocean.",
        "WHO declares end to global health emergency for specific virus.",
        "Nobel Prize in Physics awarded to trio for quantum mechanics work.",
        
        # Health
        "CDC recommends seasonal flu vaccination for most adults.",
        "Regular exercise linked to lower risk of cardiovascular disease.",
        "FDA approves new treatment for early-stage Alzheimer's disease.",
        "Study finds Mediterranean diet may improve heart health.",
        "Hospitals report decrease in respiratory infections this season.",
        "New clinical trial shows promise for malaria vaccine.",
        "Doctors advise getting 7-9 hours of sleep for optimal health.",
        "High blood pressure defined as readings consistently above 130/80.",
        "Vitamin D deficiency common in northern latitudes during winter.",
        "World Health Organization updates guidelines on sugar intake.",
        
        # Politics / World
        "United Nations General Assembly meets to discuss climate change goals.",
        "Senate passes infrastructure bill with bipartisan support.",
        "Economic report shows inflation cooling in the last quarter.",
        "Prime Minister announces new trade agreement with neighboring countries.",
        "Voters head to polls for local council elections on Tuesday.",
        "Government releases annual budget report focusing on education.",
        "Diplomats gather for peace talks in Geneva.",
        "Unemployment rate falls to lowest level in five years.",
        "Central Bank raises interest rates by 0.25 percentage points.",
        "Parliament debates new housing policy legislation.",
        
        # General / Business
        "Stock market closes higher following positive earnings reports.",
        "Major retailer announces plans to open 50 new stores.",
        "Airline announces new direct routes to international destinations.",
        "Local library expands digital lending catalog for residents.",
        "City council approves funding for new public park.",
        "Automaker recalls vehicles due to potential airbag issue.",
        "Weather forecast predicts heavy rain for the weekend.",
        "Museum opens new exhibition featuring ancient artifacts.",
        "University announces scholarship program for engineering students.",
        "Construction begins on new downtown transit center."
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