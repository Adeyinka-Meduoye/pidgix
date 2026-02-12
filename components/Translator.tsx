import React, { useState, useRef, useEffect } from 'react';
import { translateText, generateSpeech } from '../services/geminiService';
import { ToneType, TranslationResult, DirectionType } from '../types';

interface TranslatorProps {
  onNewTranslation: (result: TranslationResult) => void;
  tone: ToneType;
  onToneChange: (tone: ToneType) => void;
}

// Helper to decode Base64 to Uint8Array
const decodeBase64 = (base64: string) => {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper to decode raw Int16 PCM to AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const Translator: React.FC<TranslatorProps> = ({ onNewTranslation, tone, onToneChange }) => {
  const [inputText, setInputText] = useState('');
  const [direction, setDirection] = useState<DirectionType>('english-to-pidgin');
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  
  // Ref to track the recognition instance
  const recognitionRef = useRef<any>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if ('speechSynthesis' in window) {
       window.speechSynthesis.getVoices();
    }
  }, []);

  const speakText = async (text: string, targetDirection: DirectionType) => {
    // If output is English (from Pidgin), use Browser TTS (User is happy with this)
    if (targetDirection === 'pidgin-to-english') {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // Standard English
      // Attempt to select a voice
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
      return;
    }

    // If output is Pidgin (from English), use Gemini TTS for Naija accent
    if (targetDirection === 'english-to-pidgin') {
      try {
        setAudioLoading(true);
        // Stop any current browser speech
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();

        const pcmBase64 = await generateSpeech(text);
        
        // Play PCM Audio
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass({ sampleRate: 24000 });
        const pcmBytes = decodeBase64(pcmBase64);
        const audioBuffer = await decodeAudioData(pcmBytes, audioContext, 24000, 1);
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);

      } catch (err) {
        console.error("Gemini TTS Error:", err);
        // Fallback to browser TTS if API fails
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'en-NG'; // Try en-NG if available
          window.speechSynthesis.speak(utterance);
        }
      } finally {
        setAudioLoading(false);
      }
    }
  };

  // Voice Input Logic
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = direction === 'pidgin-to-english' ? 'en-NG' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        recognitionRef.current = null;
        if (event.error === 'not-allowed') {
          setError("Abeg, allow permission make I fit hear you.");
        }
      };

      const textBeforeSpeech = inputText;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const spacer = textBeforeSpeech && !/\s$/.test(textBeforeSpeech) ? ' ' : '';
        setInputText(textBeforeSpeech + spacer + transcript);
      };

      recognition.start();
    } else {
      alert("Omo, your browser no support voice input o. Use Chrome or Safari.");
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const translatedText = await translateText(inputText, tone, direction);
      setResult(translatedText);
      
      if (autoPlay) {
        // Fire and forget speech to not block UI
        speakText(translatedText, direction);
      }

      onNewTranslation({
        id: Date.now().toString(),
        original: inputText,
        translated: translatedText,
        tone: tone,
        direction: direction,
        timestamp: Date.now(),
      });
    } catch (err) {
      setError("Omo, network wahala or api don tire. Try again abeg.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'english-to-pidgin' ? 'pidgin-to-english' : 'english-to-pidgin');
    setInputText('');
    setResult(null);
    setError(null);
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleTranslate();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  return (
    <div className="bg-naija-surface rounded-2xl shadow-xl overflow-hidden border border-gray-800">
      {/* Controls Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-200">
              {direction === 'english-to-pidgin' ? 'English Text' : 'Pidgin Text'}
            </h2>
            <p className="text-sm text-gray-400">Type or talk wetin you wan translate</p>
          </div>
          
          <button 
            onClick={toggleDirection}
            className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-naija-green transition-all"
            title="Swap Language"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        </div>
        
        <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => onToneChange('street')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              tone === 'street' 
                ? 'bg-gray-700 text-orange-400 shadow-sm' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            🚧 Street
          </button>
          <button
            onClick={() => onToneChange('respectful')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              tone === 'respectful' 
                ? 'bg-gray-700 text-blue-400 shadow-sm' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            👔 Respectful
          </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-6">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              direction === 'english-to-pidgin' 
                ? "Enter English text here e.g., 'I will be there in ten minutes'..." 
                : "Enter Pidgin text here e.g., 'Abeg, I wan go chop'..."
            }
            className="w-full h-32 p-4 pb-8 text-gray-100 placeholder-gray-500 bg-gray-900/50 border-2 border-gray-700 focus:border-naija-green rounded-xl resize-none outline-none transition-all text-lg custom-scrollbar"
          />
          
          {/* Voice Input Button */}
          <button 
            onClick={toggleListening}
            className={`absolute bottom-4 right-4 p-2 rounded-full transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
            title={
              isListening 
                ? "Stop Listening" 
                : direction === 'english-to-pidgin' 
                  ? "Speak English" 
                  : "Speak Pidgin"
            }
          >
            {isListening ? (
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            ) : (
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
            )}
          </button>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-gray-500">Ctrl + Enter to translate</span>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                autoPlay 
                  ? 'bg-naija-green/20 text-naija-green border-naija-green/30' 
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-300'
              }`}
              title={autoPlay ? "Turn off auto-play" : "Turn on auto-play"}
            >
              {autoPlay ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              )}
              Auto-play
            </button>
          </div>

          <button
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white transition-all shadow-md active:scale-95 ${
              loading || !inputText.trim()
                ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                : 'bg-naija-green hover:bg-green-600 hover:shadow-lg hover:shadow-green-900/20'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cooking...
              </>
            ) : (
              <>
                <span>Translate</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Area */}
      {(result || error) && (
        <div className="border-t border-gray-800 bg-gray-900/30 p-4 sm:p-6 animation-fade-in">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-naija-green font-bold text-lg flex items-center gap-2">
              <span className="text-2xl">{direction === 'english-to-pidgin' ? '🇳🇬' : '🇬🇧'}</span> 
              {direction === 'english-to-pidgin' ? ' Pidgix Output' : ' English Output'}
            </h3>
            <div className="flex items-center gap-2">
                {result && (
                  <button
                    onClick={() => speakText(result, direction)}
                    disabled={audioLoading}
                    className="text-gray-400 hover:text-naija-green transition-colors p-2 rounded-full hover:bg-gray-800 disabled:opacity-50"
                    title="Speak text"
                  >
                     {audioLoading ? (
                       <svg className="animate-spin w-5 h-5 text-naija-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                     ) : (
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                     )}
                  </button>
                )}
                {result && (
                  <button
                    onClick={copyToClipboard}
                    className="text-gray-400 hover:text-naija-green transition-colors p-2 rounded-full hover:bg-gray-800"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                )}
            </div>
          </div>
          
          <div className={`p-4 rounded-xl border ${error ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-gray-800 border-gray-700 text-gray-100 shadow-sm'}`}>
            {error ? (
              <p className="font-medium">{error}</p>
            ) : (
              <p className="text-lg leading-relaxed font-medium">{result}</p>
            )}
          </div>
          
          {!error && result && (
             <div className="mt-4 flex gap-2">
                <div className="text-xs text-gray-400 italic bg-gray-800 px-3 py-1 rounded-full border border-gray-700 inline-block">
                    "{tone === 'street' ? (direction === 'english-to-pidgin' ? 'Street Level: High' : 'Style: Casual') : (direction === 'english-to-pidgin' ? 'Respect Level: Maximum' : 'Style: Formal')}"
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};