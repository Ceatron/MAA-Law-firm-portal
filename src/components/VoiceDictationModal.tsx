import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Save,
  RotateCcw,
  FileCheck,
  Check,
  Volume2,
  Tag,
  Clock,
  User,
  AlertCircle,
  Radio,
  FileText,
} from 'lucide-react';
import { LegalMatter } from '../types';
import { DraggableModal } from './common/DraggableModal';

interface VoiceDictationModalProps {
  matter: LegalMatter;
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (note: {
    title: string;
    content: string;
    category: 'Client Call' | 'Court Observation' | 'Strategy' | 'General Thoughts';
    pinned: boolean;
    audioRecorded?: boolean;
    duration?: string;
  }) => void;
}

export const VoiceDictationModal: React.FC<VoiceDictationModalProps> = ({
  matter,
  isOpen,
  onClose,
  onSaveNote,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [category, setCategory] = useState<
    'Client Call' | 'Court Observation' | 'Strategy' | 'General Thoughts'
  >('Court Observation');
  const [pinned, setPinned] = useState(false);

  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Sound wave visualization simulation bars
  const [audioBars, setAudioBars] = useState<number[]>([
    20, 45, 70, 30, 85, 60, 40, 90, 50, 75, 30, 65, 80, 40, 95, 35,
  ]);

  // Sample quick dictation prompts for fast testing
  const sampleDictations = [
    `Post-court session debrief with Adv. Costa Kimathi. High Court Commercial Suit ${matter.courtCaseNumber || 'E142 of 2026'}. Justice Mwangi directed opposing counsel to file replying affidavit by 18th August. Interim stay granted pending hearing.`,
    `Client meeting summary with ${matter.clientName}. Discussed settlement terms for ${matter.referenceNumber}. Client authorized counter-offer of KES 18,500,000 with a 30-day payment schedule.`,
    `Strategy dictation on preliminary objection. Grounded on Section 6 of the Civil Procedure Act regarding res judicata. Need associate to verify binding Appellate decisions from 2024 to 2025.`,
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event notice:', event.error);
        if (event.error === 'not-allowed' || event.error === 'audio-capture') {
          setSpeechError('Microphone access unavailable or denied. Simulation dictation mode enabled.');
        }
      };

      recognition.onend = () => {
        if (isRecording && !isPaused) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or stopped
          }
        }
      };

      recognitionRef.current = recognition;
    } else {
      setRecognitionSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Recording Timer & Audio Waves effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);

        // Animate audio wave height bars
        setAudioBars((prev) =>
          prev.map(() => Math.floor(Math.random() * 75) + 15)
        );
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording, isPaused]);

  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setSpeechError(null);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Could not start Web Speech API, falling back to audio dictation simulator', err);
      }
    }

    // Auto set default title if empty
    if (!noteTitle) {
      const dateStr = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      });
      setNoteTitle(`Voice Note - ${category} (${dateStr})`);
    }

    triggerToast('Voice recording started. Speak clearly into microphone...');
  };

  const pauseRecording = () => {
    setIsPaused(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const resumeRecording = () => {
    setIsPaused(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    triggerToast('Dictation session paused/finished.');
  };

  const handleReset = () => {
    stopRecording();
    setSeconds(0);
    setTranscript('');
    setNoteTitle('');
  };

  const handleInsertSample = (text: string) => {
    setTranscript((prev) => (prev ? `${prev}\n\n${text}` : text));
    if (!noteTitle) {
      setNoteTitle(`Voice Dictation - ${category}`);
    }
    triggerToast('Inserted dictation text snippet.');
  };

  const handleAIRefine = () => {
    if (!transcript.trim()) return;
    setIsRefining(true);

    setTimeout(() => {
      // Polish legal transcript with proper capitalization and structure
      const polished = transcript
        .replace(/court/gi, 'Court')
        .replace(/judge/gi, 'Judge')
        .replace(/advocate/gi, 'Advocate')
        .replace(/\bkes\b/gi, 'KES')
        .replace(/\b high court\b/gi, ' High Court');

      const formatted = `DICTATED CASE BRIEF (${formatTime(seconds) || '00:45'})\n\n${polished}\n\nKey Takeaways:\n• Pleadings registered under matter ref ${matter.referenceNumber}\n• Dictated by Adv. Costa Kimathi for immediate case file log.`;

      setTranscript(formatted);
      setIsRefining(false);
      triggerToast('AI polished legal dictation text!');
    }, 1200);
  };

  const handleSave = () => {
    if (!transcript.trim()) {
      triggerToast('Please dictate or type text before saving.');
      return;
    }

    const finalTitle =
      noteTitle.trim() ||
      `Voice Dictation - ${category} (${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})`;

    onSaveNote({
      title: finalTitle,
      content: transcript,
      category,
      pinned,
      audioRecorded: true,
      duration: formatTime(seconds),
    });

    onClose();
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2 rounded-lg bg-[#16181b] px-4 py-3 text-xs text-white shadow-xl border border-blue-500/30">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <DraggableModal
        gripLabel={`VOICE DICTATION • ${matter.referenceNumber}`}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-300 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Top Header */}
        <div
          data-drag-handle="true"
          className="bg-[#16181b] px-6 py-4 text-white flex items-center justify-between border-b border-stone-800 shrink-0 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center space-x-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
              <Mic className="h-5 w-5" />
              {isRecording && !isPaused && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif-title font-bold text-base text-stone-100">
                  Voice-to-Text Dictation
                </h3>
                <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 tracking-wider">
                  Live Dictation
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Dictate post-hearing notes or client meeting debriefs for {matter.referenceNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto bg-stone-50 text-xs">
          {/* Warning / Error info if any */}
          {speechError && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-900 flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{speechError}</span>
            </div>
          )}

          {/* Recording Status & Audio Visualizer Banner */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold  tracking-wider ${
                    isRecording && !isPaused
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : isPaused
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                >
                  <Radio className={`h-3 w-3 ${isRecording && !isPaused ? 'animate-pulse text-red-600' : ''}`} />
                  <span>
                    {isRecording && !isPaused
                      ? 'Recording Microphone...'
                      : isPaused
                      ? 'Recording Paused'
                      : 'Ready for Dictation'}
                  </span>
                </span>

                <span className="font-mono text-sm font-bold text-stone-900 flex items-center space-x-1">
                  <Clock className="h-3.5 w-3.5 text-[#0B63E5]" />
                  <span>{formatTime(seconds)}</span>
                </span>
              </div>

              <div className="text-right text-stone-500 text-[11px]">
                Advocate: <span className="font-semibold text-stone-900">Adv. Costa Kimathi</span>
              </div>
            </div>

            {/* Audio Wave Visualizer Bars */}
            <div className="h-10 bg-stone-900 rounded-lg p-2 flex items-center justify-center space-x-1 overflow-hidden">
              {audioBars.map((height, idx) => (
                <div
                  key={idx}
                  className="w-1.5 rounded-full transition-all duration-150"
                  style={{
                    height: isRecording && !isPaused ? `${height}%` : '20%',
                    backgroundColor:
                      isRecording && !isPaused
                        ? idx % 2 === 0
                          ? '#ef4444'
                          : '#60a5fa'
                        : '#525252',
                  }}
                />
              ))}
            </div>

            {/* Recording Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100">
              <div className="flex items-center space-x-2">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="flex items-center space-x-2 rounded-lg bg-red-600 px-4 py-2 font-bold text-white shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Start Recording</span>
                  </button>
                ) : isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="flex items-center space-x-2 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white shadow-md hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    <Play className="h-4 w-4" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex items-center space-x-2 rounded-lg bg-amber-600 px-4 py-2 font-bold text-white shadow-md hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    <Pause className="h-4 w-4" />
                    <span>Pause</span>
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={stopRecording}
                    className="flex items-center space-x-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    <Square className="h-3.5 w-3.5 text-stone-600" />
                    <span>Stop</span>
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="flex items-center space-x-1 rounded-lg border border-stone-200 bg-white px-2.5 py-2 font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                  title="Clear transcript & timer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Quick Format Attendance Note button */}
              <button
                onClick={handleAIRefine}
                disabled={!transcript.trim() || isRefining}
                className="flex items-center space-x-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 font-bold text-[#0B63E5] hover:bg-blue-100 transition-colors cursor-pointer disabled:opacity-40"
              >
                <FileCheck className="h-3.5 w-3.5 text-[#0B63E5]" />
                <span>{isRefining ? 'Formatting Legal Note...' : 'Format Attendance Note'}</span>
              </button>
            </div>
          </div>

          {/* Note Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Dictated Note Title
              </label>
              <input
                type="text"
                placeholder="e.g. Injunction Hearing Oral Ruling Debrief"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full rounded border border-[#dcd8c9] bg-white p-2.5 text-xs text-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Category Tag
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full rounded border border-[#dcd8c9] bg-white p-2.5 text-xs font-semibold text-stone-900 focus:outline-none cursor-pointer"
              >
                <option value="Court Observation">Court Observation</option>
                <option value="Client Call">Client Call</option>
                <option value="Strategy">Strategy</option>
                <option value="General Thoughts">General Thoughts</option>
              </select>
            </div>
          </div>

          {/* Live Speech-to-Text Transcript Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-stone-700 flex items-center space-x-1">
                <FileText className="h-3.5 w-3.5 text-[#0B63E5]" />
                <span>Transcribed Voice Text (Editable)</span>
              </label>
              <span className="text-[10px] text-stone-500 font-mono">
                {transcript ? transcript.split(/\s+/).filter(Boolean).length : 0} words
              </span>
            </div>

            <textarea
              rows={6}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Start recording or type dictated notes here... Speech will automatically convert into continuous text in real-time."
              className="w-full rounded-xl border border-[#dcd8c9] bg-white p-3.5 text-xs text-stone-900 focus:ring-1 focus:ring-[#0B63E5] focus:outline-none leading-relaxed font-sans shadow-2xs"
            />
          </div>

          {/* Sample Dictation Snippets (Quick Insert) */}
          <div className="rounded-lg border border-stone-200 bg-white p-3 space-y-2">
            <span className="text-[10px] font-bold text-stone-500 tracking-wider block">
              Quick Dictation Snippets (Click to insert):
            </span>
            <div className="space-y-1.5">
              {sampleDictations.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleInsertSample(sample)}
                  className="w-full text-left p-2 rounded bg-stone-50 hover:bg-blue-50 border border-stone-200 hover:border-blue-300 text-[11px] text-stone-700 hover:text-stone-900 transition-colors cursor-pointer line-clamp-1"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between border-t border-stone-200 pt-4">
            <label className="flex items-center space-x-2 cursor-pointer text-stone-800 font-semibold text-xs">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-stone-300 text-[#0B63E5] focus:ring-0"
              />
              <span>Pin this note to top of matter file</span>
            </label>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center space-x-2 rounded-lg bg-[#0B63E5] px-5 py-2 font-bold text-white shadow-md hover:bg-[#0256D0] transition-colors cursor-pointer text-xs"
              >
                <Save className="h-4 w-4" />
                <span>Save Dictation to Activity Feed</span>
              </button>
            </div>
          </div>
        </div>
      </DraggableModal>
    </div>
  );
};
