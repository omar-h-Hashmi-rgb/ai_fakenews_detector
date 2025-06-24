import React, { useState, useEffect } from 'react';
import { History, Download, Trash2, AlertCircle } from 'lucide-react';
import { PredictionData } from './HomePage';
import jsPDF from 'jspdf';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToPDF = (item: PredictionData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    doc.setFontSize(20);
    doc.text('AI Fake News Detection Report', margin, 30);

    doc.setFontSize(12);
    doc.text(`Date: ${new Date(item.timestamp).toLocaleDateString()}`, margin, 50);
    doc.text(`Prediction: ${item.prediction.toUpperCase()}`, margin, 60);
    doc.text(`Confidence: ${(item.confidence * 100).toFixed(1)}%`, margin, 70);
    doc.text(`Sentiment: ${item.sentiment.label} (${(item.sentiment.score * 100).toFixed(1)}%)`, margin, 80);

    doc.text('Article Content:', margin, 100);
    const splitText = doc.splitTextToSize(item.article_text, maxWidth);
    doc.text(splitText, margin, 110);

    doc.save(`fake-news-report-${new Date(item.timestamp).toISOString().split('T')[0]}.pdf`);
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all history?')) return;
    
    try {
      const response = await fetch('/api/history', { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to clear history');
      setHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <History className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Analysis History
          </h1>
        </div>
        
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {error && (
        <div className="card p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center space-x-3 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="card p-12 text-center">
          <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No Analysis History
          </h3>
          <p className="text-gray-500 dark:text-gray-500">
            Start analyzing articles to see your history here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={index} className="card p-6 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.prediction === 'real'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {item.prediction.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Confidence:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {(item.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Sentiment:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        {item.sentiment.label}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Keywords:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {(item.explanation?.keywords || []).slice(0, 3).join(', ')}
                  </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => exportToPDF(item)}
                  className="flex items-center space-x-2 px-3 py-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                  {item.article_text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;