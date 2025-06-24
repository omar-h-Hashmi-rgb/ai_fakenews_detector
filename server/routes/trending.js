import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = express.Router();

// Cache for 30 minutes to respect rate limits
const cache = new NodeCache({ stdTTL: 1800 });

// Rate limiting state
let lastRequestTime = 0;
let dailyRequests = 0;
let lastResetDate = new Date().toDateString();

const checkRateLimit = () => {
  const today = new Date().toDateString();
  
  // Reset daily counter if it's a new day
  if (lastResetDate !== today) {
    dailyRequests = 0;
    lastResetDate = today;
  }
  
  // Check daily limit
  if (dailyRequests >= parseInt(process.env.GNEWS_RATE_LIMIT_PER_DAY || '100')) {
    throw new Error('Daily rate limit exceeded');
  }
  
  // Check per-second limit
  const now = Date.now();
  if (now - lastRequestTime < 1000) {
    throw new Error('Rate limit: Please wait before making another request');
  }
  
  return true;
};

// Get trending news
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const cached = cache.get('trending-news');
    if (cached) {
      return res.json(cached);
    }

    // Check if API key is configured
    if (!process.env.GNEWS_API_KEY || process.env.GNEWS_API_KEY === 'your_gnews_api_key_here') {
      return res.status(503).json({
        error: 'GNews API key not configured',
        message: 'Please configure GNEWS_API_KEY in your .env file'
      });
    }

    // Check rate limits
    try {
      checkRateLimit();
    } catch (rateLimitError) {
      return res.status(429).json({
        error: rateLimitError.message,
        retryAfter: 3600 // 1 hour
      });
    }

    // Make API request
    lastRequestTime = Date.now();
    dailyRequests++;

    const response = await axios.get(process.env.GNEWS_API_URL, {
      params: {
        token: process.env.GNEWS_API_KEY,
        lang: 'en',
        country: 'us',
        max: 20
      },
      timeout: 10000
    });

    if (!response.data || !response.data.articles) {
      throw new Error('Invalid response from GNews API');
    }

    // Transform articles for frontend
    const articles = response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.image,
      publishedAt: article.publishedAt,
      source: {
        name: article.source.name,
        url: article.source.url
      }
    }));

    const result = {
      articles,
      totalResults: response.data.totalArticles || articles.length,
      timestamp: new Date().toISOString(),
      remainingRequests: Math.max(0, parseInt(process.env.GNEWS_RATE_LIMIT_PER_DAY || '100') - dailyRequests)
    };

    // Cache the results
    cache.set('trending-news', result);

    res.json(result);

  } catch (error) {
    console.error('Trending news error:', error);

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'GNews API rate limit exceeded',
        message: 'Please try again later',
        retryAfter: 3600
      });
    }

    if (error.response?.status === 401) {
      return res.status(503).json({
        error: 'Invalid GNews API key',
        message: 'Please check your GNEWS_API_KEY configuration'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch trending news',
      message: error.message
    });
  }
});

export default router;