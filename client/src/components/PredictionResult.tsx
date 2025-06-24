import React, { useState } from 'react';
import { CheckCircle, XCircle, TrendingUp, TrendingDown, ThumbsUp, ThumbsDown, MessageSquare, Download } from 'lucide-react';
import { PredictionData } from '../pages/HomePage';
import FeedbackForm from './FeedbackForm';
import jsPDF from 'jspdf';

interface PredictionResultProps {
  data: PredictionData;
}

const PredictionResult: React.FC<PredictionResultProps> = ({ data }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;

    doc.setFontSize(20);
    doc.text('AI Fake News Detection Report', margin, 30);

    doc.setFontSize(12);
    doc.text(`Date: ${new Date(data.timestamp).toLocaleDateString()}`, margin, 50);
    doc.text(`Prediction: ${data.prediction.toUpperCase()}`, margin, 60);
    doc.text(`Confidence: ${(data.confidence * 100).toFixed(1)}%`, margin, 70);
    doc.text(`Sentiment: ${data.sentiment.label} (${(data.sentiment.score * 100).toFixed(1)}%)`, margin, 80);

    doc.text('Key Indicators:', margin, 100);
    data.explanation.keywords.forEach((keyword, index) => {
      if (index < 5) { // Limit to top 5 keywords
        const importance = (data.explanation.importance_scores[index] * 100).toFixed(1);
        doc.text(`• ${keyword}: ${importance}% importance`, margin + 10, 110 + (index * 10));
      }
    });

    doc.text('Article Content:', margin, 170);
    const splitText = doc.splitTextToSize(data.article_text, maxWidth);
    doc.text(splitText, margin, 180);

    doc.save(`fake-news-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getSentimentIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Main Prediction Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {data.prediction === 'real' ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {data.prediction === 'real' ? 'Likely Real' : 'Likely Fake'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {(data.confidence * 100).toFixed(1)}% confidence
              </p>
            </div>
          </div>
          
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 btn-secondary"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>

        {/* Confidence Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Confidence Level
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {(data.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${
                data.prediction === 'real' ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${data.confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              {getSentimentIcon(data.sentiment.label)}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Sentiment Analysis
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 capitalize">
              {data.sentiment.label} ({(data.sentiment.score * 100).toFixed(1)}%)
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="h-4 w-4 text-primary-500" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                Analysis Date
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Key Indicators */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Key Indicators
          </h4>
          <div className="flex flex-wrap gap-2">
          {(data.explanation?.keywords || []).slice(0, 8).map((keyword, index) => (
            <span
                key={index}
                className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                title={`Importance: ${(data.explanation.importance_scores[index] * 100).toFixed(1)}%`}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* Article Preview */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Article Content
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-4">
            {data.article_text}
          </p>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              How accurate was this prediction?
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your feedback helps improve our AI model
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="flex items-center space-x-2 px-3 py-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors duration-200"
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="hidden sm:inline">Accurate</span>
            </button>
            
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="flex items-center space-x-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="hidden sm:inline">Inaccurate</span>
            </button>
          </div>
        </div>

        {showFeedback && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <FeedbackForm 
              predictionData={data}
              onSubmitted={() => setShowFeedback(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionResult;