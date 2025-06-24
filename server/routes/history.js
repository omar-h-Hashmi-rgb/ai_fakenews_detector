import express from 'express';

const router = express.Router();

// Get prediction history
router.get('/', async (req, res) => {
  try {
    if (!req.db) {
      return res.json([]);
    }

    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;

    const predictions = await req.db
      .collection('predictions')
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    // Remove sensitive data
    const sanitizedPredictions = predictions.map(pred => ({
      prediction: pred.prediction,
      confidence: pred.confidence,
      sentiment: pred.sentiment,
      explanation: pred.explanation,
      article_text: pred.article_text,
      timestamp: pred.timestamp
    }));

    res.json(sanitizedPredictions);

  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve history',
      message: error.message 
    });
  }
});

// Clear history
router.delete('/', async (req, res) => {
  try {
    if (!req.db) {
      return res.json({ message: 'No database connection' });
    }

    const result = await req.db.collection('predictions').deleteMany({});
    
    res.json({ 
      message: `Cleared ${result.deletedCount} predictions from history`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('History clearing error:', error);
    res.status(500).json({ 
      error: 'Failed to clear history',
      message: error.message 
    });
  }
});

export default router;