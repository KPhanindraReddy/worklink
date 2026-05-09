import { useEffect, useRef, useState } from 'react';

export const useVoiceSearch = ({ lang = 'en-IN', onResult } = {}) => {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();

      setTranscript(nextTranscript);

      const lastResult = event.results[event.results.length - 1];
      if (lastResult?.isFinal && onResult) {
        onResult(nextTranscript);
      }
    };

    recognitionRef.current = recognition;
    return () => recognition.stop();
  }, [lang, onResult]);

  return {
    isSupported: Boolean(recognitionRef.current),
    isListening,
    transcript,
    startListening: () => recognitionRef.current?.start(),
    stopListening: () => recognitionRef.current?.stop(),
    reset: () => setTranscript('')
  };
};
