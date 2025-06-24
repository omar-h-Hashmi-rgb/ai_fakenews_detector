import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { PredictionData } from '../pages/HomePage';

interface FeedbackFormProps {
  predictionData: PredictionData;
  onSubmitted: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ predictionData, onSubmitted }) => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prediction_id: predictionData.timestamp,
          rating,
          feedback: feedback.trim(),
          original_prediction: predictionData.prediction,
          confidence: predictionData.confidence,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      setTimeout(() => {
        onSubmitted();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-1">
          Thank You!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your feedback has been submitted and will help improve our AI model.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Was this prediction accurate?
        </label>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setRating('positive')}
            className={`flex-1 py-2 px-4 rounded-lg border transition-all duration-200 ${
              rating === 'positive'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-400 hover:text-green-600 dark:hover:text-green-400'
            }`}
          >
            👍 Yes, accurate
          </button>
          <button
            type="button"
            onClick={() => setRating('negative')}
            className={`flex-1 py-2 px-4 rounded-lg border transition-all duration-200 ${
              rating === 'negative'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            👎 No, inaccurate
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Additional Comments (Optional)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share any additional thoughts about this prediction..."
          className="input-field h-20 resize-none"
          maxLength={500}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {feedback.length}/500 characters
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!rating || isSubmitting}
        className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
          rating && !isSubmitting
            ? 'bg-primary-600 hover:bg-primary-700 text-white'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
      >
        <Send className="h-4 w-4" />
        <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
      </button>
    </form>
  );
};

export default FeedbackForm;