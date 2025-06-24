# 🤖 AI Fake News Detector

A full-stack MERN application that uses AI to detect fake news articles with confidence scores, sentiment analysis, and detailed explanations. Features trending news integration, user feedback collection, and comprehensive history tracking.

## 🚀 Features

### Frontend (React)
- **Modern UI** with Tailwind CSS and Lucide React icons
- **Multi-input Methods**: Text, URL, and voice input via Web Speech API
- **Comprehensive Analysis**: 
  - Real/Fake prediction with confidence scores
  - Sentiment analysis
  - Keyword-based explanations
- **Trending News**: Integration with GNews API
- **User Features**:
  - Prediction history with search and filters
  - Feedback system for model improvement
  - PDF export of analysis reports
  - Dark/light mode toggle
- **Responsive Design**: Optimized for mobile, tablet, and desktop

### Backend (Node.js + Express)
- **RESTful API** with comprehensive endpoints
- **MongoDB Integration** for data persistence
- **Rate Limiting** and caching for external APIs
- **GNews API Integration** with proper rate limit handling
- **Security**: Helmet, CORS, input validation
- **Error Handling**: Comprehensive error responses

### AI Microservice (Python + Flask)
- **Machine Learning**: Fake news detection using scikit-learn
- **Sentiment Analysis**: TextBlob integration
- **Content Extraction**: newspaper3k for URL parsing
- **Explainable AI**: Keyword-based explanations (SHAP/LIME ready)
- **Mock Model**: Includes demo model for immediate testing

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   └── ...
│   └── package.json
├── server/                # Express.js backend
│   ├── routes/           # API route handlers
│   ├── .env             # Server configuration
│   └── package.json
├── ml-model-api/         # Flask AI microservice
│   ├── app.py           # Main Flask application
│   ├── requirements.txt # Python dependencies
│   ├── .env            # AI service configuration
│   └── create_demo_model.py
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB running locally on port 27017
- GNews API key (free tier available)

### 1. Clone and Setup

```bash
# Install and start client
cd client
npm install
npm start  # Runs on http://localhost:3000

# Install and start server (new terminal)
cd server
npm install
npm start  # Runs on http://localhost:8000

# Setup Python environment (new terminal)
cd ml-model-api
pip install -r requirements.txt
python create_demo_model.py  # Creates demo model
python app.py  # Runs on http://localhost:5000
```

### 2. Configure Environment Variables

**server/.env:**
```env
PORT=8000
MONGODB_URI=mongodb://[::1]:27017/fake-news-db
GNEWS_API_KEY=your_actual_api_key_here
AI_MODEL_API=http://localhost:5000/predict
AI_SENTIMENT_API=http://localhost:5000/sentiment
AI_EXPLAIN_API=http://localhost:5000/explain
AI_ARTICLE_EXTRACT_API=http://localhost:5000/extract-article
```

**ml-model-api/.env:**
```env
FLASK_ENV=development
PORT=5000
MODEL_PATH=models/fake_news_model.pkl
VECTORIZER_PATH=models/tfidf_vectorizer.pkl
```

### 3. Get GNews API Key

1. Visit [GNews.io](https://gnews.io/)
2. Create a free account
3. Get your API key
4. Update `GNEWS_API_KEY` in `server/.env`

## 🎯 Usage

1. **Start all services** (client, server, AI API)
2. **Open** http://localhost:3000
3. **Analyze articles** by:
   - Pasting text directly
   - Entering article URLs
   - Using voice input (Chrome/Edge)
4. **View results** with confidence scores and explanations
5. **Explore trending news** and analyze articles for fake news
6. **Check your history** and export reports as PDF
7. **Provide feedback** to improve the AI model

## 🔧 API Endpoints

### Backend Server (Port 8000)
- `POST /api/analyze` - Analyze article for fake news
- `GET /api/history` - Get prediction history
- `DELETE /api/history` - Clear prediction history
- `POST /api/feedback` - Submit user feedback
- `GET /api/trending` - Get trending news

### AI Microservice (Port 5000)
- `POST /predict` - Fake news prediction
- `POST /sentiment` - Sentiment analysis
- `POST /explain` - Explanation via keywords
- `POST /extract-article` - Extract content from URL

## 🌟 Key Features Detail

### AI-Powered Analysis
- **Confidence Scoring**: Get probability-based confidence levels
- **Sentiment Detection**: Understand article emotional tone
- **Keyword Explanations**: See which words influenced the prediction
- **URL Processing**: Automatic article extraction from news URLs

### User Experience
- **Voice Input**: Speak articles for hands-free analysis
- **Dark Mode**: Toggle between light and dark themes
- **Responsive**: Works perfectly on mobile devices
- **PDF Export**: Save analysis reports for later reference

### Data & Privacy
- **Local Storage**: All data stored locally in MongoDB
- **No Cloud Dependencies**: Runs entirely on your machine
- **User Feedback**: Help improve the AI model over time
- **Rate Limiting**: Respects external API limits

## 🔒 Security Features

- **Input Validation**: All inputs sanitized and validated
- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Secure cross-origin requests
- **Helmet.js**: Security headers for Express
- **Environment Variables**: Secure configuration management

## 🧪 Development

### Adding New Features
- Frontend components in `client/src/components/`
- API routes in `server/routes/`
- AI endpoints in `ml-model-api/app.py`

### Improving the AI Model
1. Replace demo model with trained model
2. Add more sophisticated features
3. Implement SHAP/LIME for better explanations
4. Add more language support

### Database Schema
```javascript
// Predictions Collection
{
  prediction: 'real' | 'fake',
  confidence: Number,
  sentiment: { label: String, score: Number },
  explanation: { keywords: [String], importance_scores: [Number] },
  article_text: String,
  timestamp: Date,
  user_ip: String
}

// Feedback Collection
{
  prediction_id: String,
  rating: 'positive' | 'negative',
  feedback: String,
  timestamp: Date
}
```

## 📊 Performance

- **Analysis Speed**: < 2 seconds per article
- **Concurrent Users**: Supports multiple simultaneous requests
- **Caching**: 30-minute cache for trending news
- **Resource Usage**: Lightweight Python ML service

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error:**
```bash
# Start MongoDB
mongod --dbpath /your/db/path
```

**Python Dependencies Error:**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

**GNews API Limit Exceeded:**
- Check your daily quota at gnews.io
- Wait for quota reset (24 hours)
- Use cached results in the meantime

**Model Not Loading:**
```bash
cd ml-model-api
python create_demo_model.py
```

## 🎉 Acknowledgments

- **Scikit-learn** for machine learning capabilities
- **TextBlob** for sentiment analysis
- **Newspaper3k** for article extraction
- **GNews API** for trending news data
- **React & Tailwind** for the beautiful UI
- **Express.js** for robust backend API

---

**Made with ❤️ for fighting misinformation through AI**

## REMEMBER 
## One powershell for client run that there npm start
## One powershell for server run that there npm start
## One for ml-model-api where run lik this in terminal python create_demo_model.py then python app.py
## then start mongodb with ipv6 address, if ipv4 is not working
## paste mongo manually line : & "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath "C:\data\db"