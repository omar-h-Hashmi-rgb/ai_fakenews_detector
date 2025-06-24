import express from 'express';

const router = express.Router();

// Submit feedback endpoint
router.post('/', async (req, res) => {
  try {
    const {
      prediction_id,
      rating,
      feedback,
      original_prediction,
      confidence
    } = req.body;

    if (!prediction_id || !rating) {
      return res.status(400).json({ 
        error: 'Prediction ID and rating are required' 
      });
    }

    if (!['positive', 'negative'].includes(rating)) {
      return res.status(400).json({ 
        error: 'Rating must be either "positive" or "negative"' 
      });
    }

    const feedbackData = {
      prediction_id,
      rating,
      feedback: feedback ? feedback.trim() : '',
      original_prediction,
      confidence,
      timestamp: new Date().toISOString(),
      user_ip: req.ip,
      user_agent: req.get('User-Agent')
    };

    // Store in database if available
    if (req.db) {
      try {
        await req.db.collection('feedback').insertOne(feedbackData);
        console.log(`✅ Feedback stored: ${rating} rating for prediction ${prediction_id}`);
      } catch (dbError) {
        console.error('Database storage error:', dbError);
        return res.status(500).json({ 
          error: 'Failed to store feedback' 
        });
      }
    } else {
      // Log feedback if no database
      console.log('📝 Feedback received (no database):', feedbackData);
    }

    res.json({ 
      message: 'Feedback submitted successfully',
      timestamp: feedbackData.timestamp
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit feedback',
      message: error.message 
    });
  }
});

export default router;