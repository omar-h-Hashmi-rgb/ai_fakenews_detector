import express from 'express';
import axios from 'axios';

const router = express.Router();

// Analyze article endpoint
router.post('/', async (req, res) => {
  try {
    const { text, is_url } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text or URL is required' });
    }

    let articleText = text;

    // If URL is provided, extract article content
    if (is_url) {
      try {
        const extractResponse = await axios.post(process.env.AI_ARTICLE_EXTRACT_API, {
          url: text
        }, {
          timeout: 30000
        });
        
        if (extractResponse.data && extractResponse.data.text) {
          articleText = extractResponse.data.text;
        } else {
          return res.status(400).json({ 
            error: 'Could not extract article content from URL' 
          });
        }
      } catch (extractError) {
        console.error('Article extraction error:', extractError.message);
        return res.status(400).json({ 
          error: 'Failed to extract article from URL. Please try copying the text directly.' 
        });
      }
    }

    // Validate article length
    if (articleText.length < 50) {
      return res.status(400).json({ 
        error: 'Article text is too short for analysis (minimum 50 characters)' 
      });
    }

    // Make parallel requests to AI services
    const [predictionResponse, sentimentResponse, explanationResponse] = await Promise.allSettled([
      axios.post(process.env.AI_MODEL_API, { text: articleText }, { timeout: 30000 }),
      axios.post(process.env.AI_SENTIMENT_API, { text: articleText }, { timeout: 30000 }),
      axios.post(process.env.AI_EXPLAIN_API, { text: articleText }, { timeout: 30000 })
    ]);

    // Check if prediction request failed
    if (predictionResponse.status === 'rejected') {
      console.error('Prediction error:', predictionResponse.reason.message);
      return res.status(503).json({ 
        error: 'AI prediction service is unavailable. Please try again later.' 
      });
    }

    // Prepare response data

// ...
    const result = {
      prediction: predictionResponse.value.data.prediction || 'unknown',
      confidence: predictionResponse.value.data.confidence || 0.5,
      sentiment: sentimentResponse.status === 'fulfilled' && sentimentResponse.value.data && sentimentResponse.value.data.sentiment
        ? sentimentResponse.value.data.sentiment
        : { label: 'neutral', score: 0.5 },
      explanation: explanationResponse.status === 'fulfilled' && explanationResponse.value.data && explanationResponse.value.data.explanation
        ? explanationResponse.value.data.explanation
        : { keywords: [], importance_scores: [] },
      article_text: articleText.substring(0, 2000), // Limit stored text
      timestamp: new Date().toISOString()
    };
// ...


    // Store in database if available
    if (req.db) {
      try {
        await req.db.collection('predictions').insertOne({
          ...result,
          user_ip: req.ip,
          user_agent: req.get('User-Agent')
        });
      } catch (dbError) {
        console.error('Database storage error:', dbError);
        // Continue even if database storage fails
      }
    }

    res.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

export default router;