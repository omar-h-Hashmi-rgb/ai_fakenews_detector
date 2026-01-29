import React, { useState } from 'react';
import ArticleInput from '../components/ArticleInput';
import PredictionResult from '../components/PredictionResult';
import VoiceInput from '../components/VoiceInput';
import { AlertCircle } from 'lucide-react';

export interface PredictionData {
  prediction: 'real' | 'fake';
  confidence: number;
  sentiment: {
    label: string;
    score: number;
  };
  explanation: {
    keywords: string[];
    importance_scores: number[];
  };
  article_text: string;
  timestamp: string;
}

const HomePage: React.FC = () => {
  const [predictionData, setPredictionData] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async (text: string, isUrl: boolean = false, useAdvanced: boolean = false) => {
    setPredictionData(null);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          is_url: isUrl,
          use_advanced: useAdvanced,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze article');
      }

      const data = await response.json();
      setPredictionData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold gradient-text">
          AI Fake News Detector
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Analyze news articles using advanced AI to detect fake news with confidence scores,
          sentiment analysis, and detailed explanations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <ArticleInput onAnalyze={handleAnalysis} isLoading={isLoading} />
          <VoiceInput onTranscript={(text) => handleAnalysis(text)} />
        </div>

        <div>
          {error && (
            <div className="card p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <div className="flex items-center space-x-3 text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">{error}</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="card p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Analyzing article...</p>
            </div>
          )}

          {predictionData && !isLoading && (
            <PredictionResult data={predictionData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;