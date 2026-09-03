import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Send,
  User,
  Copy,
  Check,
  Scale,
  FileText,
  Search,
  Coins,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Maximize2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Advocate, LegalMatter } from '../types';
import { loadChambersSettings } from '../utils/settingsStorage';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdvocate: Advocate;
  activeMatter?: LegalMatter | null;
  onOpenFullView: () => void;
}

interface DrawerMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentAdvocate,
  activeMatter,
  onOpenFullView,
}) => {
  const settings = loadChambersSettings();

  const [messages, setMessages] = useState<DrawerMessage[]>([
    {
      id: 'drawer-init',
      role: 'assistant',
      content: `Hello **${currentAdvocate.name}**! I am **Wakili AI**, your floating chambers legal assistant.
      
Ask me to draft court prayers, analyze statutory limitation periods, look up precedents, or calculate party-and-party costs.`,
      timestamp: 'Just now',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputQuery).trim();
    if (!text || isLoading) return;

    setInputQuery('');

    const userMsg: DrawerMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          matter: activeMatter || null,
          context: {
            currentAdvocate,
            firmName: settings.firmName,
          },
        }),
      });

      const data = await response.json();
      const replyMsg: DrawerMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Analysis completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, replyMsg]);
    } catch (err: any) {
      console.error('Drawer AI Error:', err);
      const errMsg: DrawerMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error communicating with Wakili AI: ${err.message || 'Please check your connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-[#d1d7dc] flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-[#0f2738] bg-[#132c3f] px-4 py-3 text-white shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1c4766] text-amber-400 border border-[#234b6a]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold font-serif-title">Wakili AI Assistant</h3>
              <span className="rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-mono">
                Gemini 3.7
              </span>
            </div>
            <p className="text-[10px] text-[#9cb3c3]">Quick Chambers Co-Pilot</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFullView();
            }}
            className="rounded p-1 text-[#9cb3c3] hover:bg-[#1a384c] hover:text-white transition-colors cursor-pointer"
            title="Expand to Full Workspace"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#9cb3c3] hover:bg-[#1a384c] hover:text-white transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active Matter Context Notice (if present) */}
      {activeMatter && (
        <div className="bg-[#ebf5fc] px-4 py-2 border-b border-[#c3e1f7] flex items-center justify-between text-[11px] text-[#0f4871]">
          <div className="truncate pr-2">
            <span className="font-bold">Context:</span> {activeMatter.referenceNumber} • {activeMatter.title}
          </div>
          <span className="text-[10px] bg-white text-[#0070ba] px-1.5 py-0.2 rounded font-mono border border-[#c3e1f7] shrink-0">
            Linked
          </span>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc]">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start space-x-2 ${
                isUser ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? 'bg-[#0070ba] text-white'
                    : 'bg-[#132c3f] text-amber-400'
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs shadow-2xs ${
                  isUser
                    ? 'bg-[#0070ba] text-white rounded-tr-none'
                    : 'bg-white border border-[#d1d7dc] text-[#1c2d3d] rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed space-y-1.5">
                  {m.content}
                </div>

                {!isUser && (
                  <div className="mt-2 pt-1 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                    <span>{m.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(m.id, m.content)}
                      className="text-[#0070ba] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-[#5c6f84] bg-white p-3 rounded-xl border border-[#d1d7dc]">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0070ba]" />
            <span>Wakili AI is analyzing query...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Buttons */}
      <div className="px-3 py-2 bg-stone-50 border-t border-[#e2e7eb] flex items-center space-x-1.5 overflow-x-auto text-[10px]">
        <button
          type="button"
          onClick={() => handleSendMessage('Draft prayers for an urgent injunction under Order 40 CPR.')}
          className="rounded bg-white hover:bg-stone-100 border border-stone-200 px-2 py-1 text-stone-700 whitespace-nowrap cursor-pointer"
        >
          Draft Injunction Prayers
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('What are the limitation periods under Section 4 Limitation of Actions Act?')}
          className="rounded bg-white hover:bg-stone-100 border border-stone-200 px-2 py-1 text-stone-700 whitespace-nowrap cursor-pointer"
        >
          Limitation Rules
        </button>
        <button
          type="button"
          onClick={() => handleSendMessage('Calculate instruction fees for KES 20M dispute under ARO Schedule 6.')}
          className="rounded bg-white hover:bg-stone-100 border border-stone-200 px-2 py-1 text-stone-700 whitespace-nowrap cursor-pointer"
        >
          Calculate ARO Fees
        </button>
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-[#e2e7eb]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Wakili AI..."
            className="flex-1 rounded-lg border border-[#d1d7dc] bg-[#f8fafc] px-3 py-2 text-xs text-[#1c2d3d] focus:border-[#0070ba] focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="rounded-lg bg-[#e9572b] hover:bg-[#d8471e] text-white p-2 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
