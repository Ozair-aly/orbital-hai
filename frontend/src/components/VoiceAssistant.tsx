import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  HelpCircle,
  Sparkles,
  Bot,
  User,
} from 'lucide-react';
import { useExperimentStore } from '../store/experimentStore';

// Polyfill SpeechRecognition types for browsers
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export function VoiceAssistant() {
  const {
    voiceOpen,
    setVoiceOpen,
    currentStep,
    setStep,
    nextStep,
    prevStep,
    experiment,
    readings,
    predictions,
    setSimRunning,
    clearReadings,
  } = useExperimentStore();

  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Hello! I am ORBITAL Voice. You can command me to navigate steps, start simulations, or explain sensor telemetry.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showHelp]);

  // Setup browser Web Speech API
  useEffect(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
      if (event.results[current].isFinal) {
        handleCommand(text);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Text-to-Speech output
  const speakResponse = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS playback error:', e);
    }
  };

  const addAssistantMessage = (reply: string) => {
    setMessages((prev) => [
      ...prev,
      {
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    speakResponse(reply);
  };

  // Safe voice & text command router
  const handleCommand = (cmd: string) => {
    const cleaned = cmd.toLowerCase().trim();
    if (!cleaned) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: cmd,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setTranscript('');

    // 1. Navigation Commands
    if (cleaned.includes('step 1') || cleaned.includes('setup') || cleaned.includes('experiment setup')) {
      setStep(1);
      addAssistantMessage('Navigating to Step 1: Experiment Setup.');
    } else if (cleaned.includes('step 2') || cleaned.includes('collection') || cleaned.includes('data collection') || cleaned.includes('telemetry')) {
      setStep(2);
      addAssistantMessage('Navigating to Step 2: Data Collection & Sensor Stream.');
    } else if (cleaned.includes('step 3') || cleaned.includes('recognition') || cleaned.includes('activity recognition') || cleaned.includes('model') || cleaned.includes('classify')) {
      setStep(3);
      addAssistantMessage('Navigating to Step 3: AI Activity Recognition.');
    } else if (cleaned.includes('step 4') || cleaned.includes('results') || cleaned.includes('analysis') || cleaned.includes('activity analysis')) {
      setStep(4);
      addAssistantMessage('Navigating to Step 4: Results & Activity Analysis.');
    } else if (cleaned.includes('step 5') || cleaned.includes('report') || cleaned.includes('export')) {
      setStep(5);
      addAssistantMessage('Navigating to Step 5: Report & Documentation Export.');
    } else if (cleaned.includes('next step') || cleaned.includes('forward')) {
      if (currentStep < 5) {
        nextStep();
        addAssistantMessage(`Moving to step ${currentStep + 1}.`);
      } else {
        addAssistantMessage('You are already at the final step: Report and Export.');
      }
    } else if (cleaned.includes('previous step') || cleaned.includes('go back') || cleaned.includes('back')) {
      if (currentStep > 1) {
        prevStep();
        addAssistantMessage(`Returning to step ${currentStep - 1}.`);
      } else {
        addAssistantMessage('You are already at the first step: Experiment Setup.');
      }
    } else if (cleaned.includes('webcam') || cleaned.includes('camera')) {
      setStep(2);
      addAssistantMessage('Navigating to Data Collection. Enable your webcam to stream real-time optical motion telemetry.');
    }
    // 2. Experiment & Simulation Controls
    else if (cleaned.includes('start simulation') || cleaned.includes('start stream') || cleaned.includes('resume simulation')) {
      setSimRunning(true);
      addAssistantMessage('Sensor telemetry simulation started.');
    } else if (cleaned.includes('pause simulation') || cleaned.includes('stop simulation') || cleaned.includes('pause stream')) {
      setSimRunning(false);
      addAssistantMessage('Sensor telemetry simulation paused.');
    } else if (cleaned.includes('reset simulation') || cleaned.includes('clear data')) {
      clearReadings();
      setSimRunning(false);
      addAssistantMessage('Sensor readings cleared and simulation reset.');
    }
    // 3. Information & Help
    else if (cleaned.includes('current activity') || cleaned.includes('what is the activity')) {
      if (predictions.length > 0) {
        const latest = predictions[predictions.length - 1];
        addAssistantMessage(
          `Latest recognized activity is "${latest.predicted}" with ${(latest.confidence * 100).toFixed(1)} percent confidence.`
        );
      } else {
        addAssistantMessage('No activities classified yet. Please run AI recognition in Step 3 first.');
      }
    } else if (cleaned.includes('summarize') || cleaned.includes('experiment summary')) {
      if (experiment) {
        addAssistantMessage(
          `Experiment "${experiment.name}" is using ${experiment.data_source} data at ${experiment.sample_rate_hz} Hertz. Total readings collected: ${readings.length}.`
        );
      } else {
        addAssistantMessage('No active experiment configured yet. Please complete Step 1 setup.');
      }
    } else if (cleaned.includes('sensor readings') || cleaned.includes('explain sensors')) {
      addAssistantMessage(
        'The system tracks six axes: Tri-axial linear acceleration (acc X, Y, Z in meters per second squared) and tri-axial angular velocity (gyro X, Y, Z in radians per second).'
      );
    } else if (cleaned.includes('how does the ai work') || cleaned.includes('model work') || cleaned.includes('algorithm')) {
      addAssistantMessage(
        'The AI extracts 48 statistical features—like mean, standard deviation, RMS, and kurtosis—from 2-second sliding windows, and classifies them using a trained Random Forest ensemble.'
      );
    } else if (cleaned.includes('what does this app do') || cleaned.includes('what is orbital')) {
      addAssistantMessage(
        'ORBITAL is a research prototype for SIH26174 that performs real-time AI Human Activity Recognition for astronaut and payload experiment monitoring.'
      );
    } else if (cleaned.includes('help') || cleaned.includes('what can you do')) {
      setShowHelp(true);
      addAssistantMessage('Here are the commands you can use. You can say: "go to step 2", "start simulation", "summarize experiment", or ask for explanations.');
    } else {
      addAssistantMessage(
        `I recognized "${cmd}", but don't have a direct action for it. Try saying "next step", "start simulation", or click the help icon.`
      );
    }
  };

  const toggleListening = () => {
    if (!speechSupported) {
      addAssistantMessage('Browser speech recognition is not supported in this browser. Please use the text input below.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Could not start speech recognition:', err);
      }
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const q = inputText;
    setInputText('');
    handleCommand(q);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!voiceOpen && (
        <button
          onClick={() => setVoiceOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#3978E8] text-white shadow-xl hover:bg-[#2563cc] hover:scale-105 active:scale-95 transition-all z-40 border-2 border-white"
          title="Open ORBITAL Voice"
        >
          <Mic size={22} className="sm:w-6 sm:h-6" />
          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </span>
          )}
        </button>
      )}

      {/* Assistant Modal Window */}
      {voiceOpen && (
        <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm h-[480px] sm:h-[520px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-[#E5EAF2] flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#F7F9FC] border-b border-[#E5EAF2]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#3978E8] flex items-center justify-center text-white">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B4D] flex items-center gap-1.5">
                  ORBITAL Voice
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#EFF4FD] text-[#3978E8]">
                    AI Assist
                  </span>
                </h3>
                <p className="text-[11px] text-[#718096]">Hands-free workflow operator</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHelp(!showHelp)}
                className={`p-1.5 rounded-md hover:bg-white text-[#718096] transition-colors ${
                  showHelp ? 'bg-white text-[#3978E8]' : ''
                }`}
                title="Command Help"
              >
                <HelpCircle size={16} />
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-md hover:bg-white text-[#718096] transition-colors"
                title={isMuted ? 'Unmute Audio' : 'Mute Voice Responses'}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <button
                onClick={() => setVoiceOpen(false)}
                className="p-1.5 rounded-md hover:bg-white text-[#718096] transition-colors"
                title="Close Assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Help Drawer */}
          {showHelp && (
            <div className="bg-[#EFF4FD] border-b border-[#D8E6FA] p-3 text-xs text-[#172B4D] max-h-40 overflow-y-auto">
              <p className="font-bold mb-1 text-[#3978E8]">Try saying:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#4A5568]">
                <li>"Go to data collection" or "Next step"</li>
                <li>"Start simulation" or "Pause simulation"</li>
                <li>"Show current activity"</li>
                <li>"Summarize the experiment"</li>
                <li>"Explain sensor readings"</li>
                <li>"How does the AI model work?"</li>
              </ul>
            </div>
          )}

          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFBFD]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-[#3978E8] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={12} />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#3978E8] text-white rounded-br-none'
                      : 'bg-white border border-[#E5EAF2] text-[#172B4D] rounded-bl-none shadow-xs'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-blue-100' : 'text-[#A0AEC0]'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-[#718096] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User size={12} />
                  </div>
                )}
              </div>
            ))}

            {isListening && transcript && (
              <div className="flex gap-2.5 justify-end">
                <div className="max-w-[78%] px-3.5 py-2 rounded-2xl text-xs bg-blue-50 border border-blue-200 text-[#3978E8] italic">
                  Listening: "{transcript}"...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Audio Activity Animation / Mic state */}
          {isListening && (
            <div className="py-2 px-4 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1 h-3 bg-[#3978E8] rounded-full animate-bounce"></span>
                  <span className="w-1 h-4 bg-[#3978E8] rounded-full animate-bounce delay-75"></span>
                  <span className="w-1 h-2 bg-[#3978E8] rounded-full animate-bounce delay-150"></span>
                </div>
                <span className="text-xs font-semibold text-[#3978E8]">Listening for command...</span>
              </div>
              <button
                onClick={toggleListening}
                className="text-xs text-red-500 font-semibold hover:underline"
              >
                Stop
              </button>
            </div>
          )}

          {/* Input Controls */}
          <div className="p-3 bg-white border-t border-[#E5EAF2]">
            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-red-500 text-white border-red-500 animate-pulse'
                    : 'bg-[#EFF4FD] hover:bg-[#DCE7FB] text-[#3978E8] border-[#D8E6FA]'
                }`}
                title={isListening ? 'Stop Listening' : 'Speak Command'}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? 'Listening...' : 'Type or speak a command...'}
                className="flex-1 px-3 py-2 text-xs border border-[#E5EAF2] rounded-xl bg-[#F7F9FC] text-[#172B4D] focus:outline-none focus:border-[#3978E8] focus:bg-white"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-[#3978E8] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                title="Send command"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
