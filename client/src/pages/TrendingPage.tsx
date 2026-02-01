
import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { getApiUrl } from '../config';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

const TrendingPage: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchTrendingNews();
  }, []);

  const fetchTrendingNews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl('/api/trending'));
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error('Failed to fetch trending news');
      }

      const data = await response.json();
      setArticles(data.articles || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending news');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeArticle = (url: string) => {
    // Navigate to home page with URL pre-filled
    window.location.href = `/? url = ${encodeURIComponent(url)} `;
  };

  if (isLoading && articles.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Trending News
            </h1>
            {lastUpdated && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={fetchTrendingNews}
          disabled={isLoading}
          className="flex items-center space-x-2 btn-secondary"
        >
          <RefreshCw className={`h - 4 w - 4 ${isLoading ? 'animate-spin' : ''} `} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="card p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center space-x-3 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">{error}</p>
              <p className="text-sm mt-1">
                Note: GNews API has a limit of 100 requests per day and 1 request per second.
              </p>
            </div>
          </div>
        </div>
      )}

      {articles.length === 0 && !isLoading ? (
        <div className="card p-12 text-center">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No Trending News Available
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Unable to fetch trending news at the moment. Please try again later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <div key={index} className="card card-hover overflow-hidden">
              {article.image && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full">
                    {article.source.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {article.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => analyzeArticle(article.url)}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium text-sm transition-colors duration-200"
                  >
                    Analyze for Fake News
                  </button>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">Read</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingPage;