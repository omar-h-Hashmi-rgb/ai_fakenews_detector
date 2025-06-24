import React, { useState, useRef } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setTranscript('');
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUseTranscript = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript('');
    }
  };

  if (!isSupported) {
    return (
      <div className="card p-6 opacity-50">
        <div className="flex items-center space-x-3 mb-4">
          <MicOff className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-400">Voice Input</h3>
        </div>
        <p className="text-sm text-gray-500">
          Voice input is not supported in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Mic className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Voice Input
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-4 rounded-full transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse-slow'
                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800'
            }`}
          >
            {isRecording ? (
              <Square className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
        </p>

        {transcript && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {transcript}
              </p>
            </div>
            <button
              onClick={handleUseTranscript}
              className="w-full btn-primary"
            >
              Use This Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInput;