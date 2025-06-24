import React, { useState, useEffect } from 'react';
import { FileText, Link, Send, Loader } from 'lucide-react';

interface ArticleInputProps {
  onAnalyze: (text: string, isUrl: boolean) => void;
  isLoading: boolean;
}

const ArticleInput: React.FC<ArticleInputProps> = ({ onAnalyze, isLoading }) => {
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    // Check if URL was passed via query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlParam = urlParams.get('url');
    if (urlParam) {
      setUrl(urlParam);
      setInputType('url');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputType === 'text' ? text : url;
    if (input.trim()) {
      onAnalyze(input.trim(), inputType === 'url');
    }
  };

  const isValid = inputType === 'text' ? text.trim().length > 0 : url.trim().length > 0;

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Analyze Article
      </h2>

      {/* Input Type Selector */}
      <div className="flex space-x-2 mb-6">
        <button
          type="button"
          onClick={() => setInputType('text')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            inputType === 'text'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-2 border-primary-200 dark:border-primary-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span className="font-medium">Text</span>
        </button>
        
        <button
          type="button"
          onClick={() => setInputType('url')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            inputType === 'url'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-2 border-primary-200 dark:border-primary-800'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Link className="h-4 w-4" />
          <span className="font-medium">URL</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {inputType === 'text' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Article Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the article content here..."
              className="input-field h-32 resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {text.length} characters
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Article URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/news-article"
              className="input-field"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              We'll extract and analyze the article content automatically
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isValid && !isLoading
              ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg active:scale-95'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          <span>
            {isLoading ? 'Analyzing...' : 'Analyze Article'}
          </span>
        </button>
      </form>
    </div>
  );
};

export default ArticleInput;