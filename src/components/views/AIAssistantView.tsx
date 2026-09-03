import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  User,
  Scale,
  FileText,
  Search,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Download,
  BookOpen,
  Briefcase,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  Coins,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { Advocate, LegalMatter } from '../../types';
import { loadChambersSettings } from '../../utils/settingsStorage';

interface AIAssistantViewProps {
  currentAdvocate: Advocate;
  selectedMatterId?: string;
  matters?: LegalMatter[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  persona?: string;
  matterRef?: string;
}

const AGENT_PERSONAS = [
  {
    id: 'senior_counsel',
    name: 'Wakili Senior Counsel',
    badge: 'Legal Strategy & Procedure',
    icon: Scale,
    color: 'from-[#1c2d3d] to-[#2e475d]',
    description: 'Kenyan substantive & procedural law, strategic case merits, CPR 2010 rules, and judicial assessment.',
  },
  {
    id: 'drafter',
    name: 'Pleadings & Contract Drafter',
    badge: 'Court Pleadings & Clauses',
    icon: FileText,
    color: 'from-[#0B63E5] to-[#0256D0]',
    description: 'Generates court-ready Notices of Motion, Certificates of Urgency, Plaints, Affidavits, and Demand Letters.',
  },
  {
    id: 'researcher',
    name: 'Case Law & eKLR Researcher',
    badge: 'Precedents & Ratio Decidendi',
    icon: Search,
    color: 'from-[#0d5f4e] to-[#127a65]',
    description: 'Finds authoritative Kenyan judicial decisions, citations, principles, and Court of Appeal holdings.',
  },
  {
    id: 'compliance',
    name: 'CTS & Registry Compliance',
    badge: 'e-Filing & Limitation',
    icon: ShieldCheck,
    color: 'from-[#4a3b6b] to-[#604c8a]',
    description: 'Advises on Judiciary CTS e-filing rules, practice directions, stamp duty, and limitation periods.',
  },
  {
    id: 'fee_auditor',
    name: 'Advocates Remuneration Auditor',
    badge: 'Schedule 6 ARO Calculator',
    icon: Coins,
    color: 'from-[#8c5e1e] to-[#a87428]',
    description: 'Calculates instruction fees, Party & Party bill of costs, and taxation allowances under Kenyan law.',
  },
];

const SUGGESTED_PROMPTS = [
  {
    category: 'Drafting',
    title: 'Certificate of Urgency',
    prompt: 'Draft a Chamber Summons and Certificate of Urgency under Order 51 Rules 1 & 3 of the Civil Procedure Rules 2010 seeking an ex-parte interim conservatory order to stay regulatory penalties.',
  },
  {
    category: 'Litigation Strategy',
    title: 'Injunction Merits (Giella v Cassman)',
    prompt: 'Analyze the legal grounds required to establish a prima facie case with probability of success under the Giella v Cassman Brown & Co. Ltd [1973] EA 358 tripartite test for an interlocutory injunction.',
  },
  {
    category: 'Fees & Costs',
    title: 'Schedule 6 Remuneration Note',
    prompt: 'Calculate the Party and Party instruction fees for a Commercial High Court suit valued at KES 45,000,000 under Schedule 6 of the Advocates (Remuneration) Order.',
  },
  {
    category: 'Legal Notice',
    title: '7-Day Demand Letter',
    prompt: 'Draft a formal 7-Day Demand Letter Before Action on behalf of our client for breach of a commercial lease agreement and unpaid service charges with notice of statutory interest.',
  },
  {
    category: 'Statutory Analysis',
    title: 'Limitation of Actions Review',
    prompt: 'Explain the statutory limitation periods under the Limitation of Actions Act (Cap 22) for breach of contract, tort claims, recovery of land, and enforceability of foreign judgments in Kenya.',
  },
  {
    category: 'Affidavit',
    title: 'Replying Affidavit Rebuttal',
    prompt: 'Draft a structured Replying Affidavit sworn by a company director to rebut allegations of unconstitutional trade practices and breach of fiduciary duty.',
  },
];

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  currentAdvocate,
  selectedMatterId,
  matters = [],
}) => {
  const settings = loadChambersSettings();

  const [activePersona, setActivePersona] = useState<string>('senior_counsel');
  const [selectedMatter, setSelectedMatter] = useState<LegalMatter | null>(() => {
    if (selectedMatterId) {
      return matters.find((m) => m.id === selectedMatterId) || null;
    }
    return matters[0] || null;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('chambers_ai_agent_chat');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved chat:', e);
      }
    }
    return [
      {
        id: 'msg-init',
        role: 'assistant',
        content: `### ⚖️ Good day, ${currentAdvocate.name}!

I am **Wakili AI**, your Senior Chambers Intelligence & Legal Assistant Agent at **${settings.firmName || 'Muthoni Ahago Advocates'}**.

I am primed with deep knowledge of **Kenyan Law**, including:
- **Civil Procedure Act & Rules 2010** (Applications, Injunctions, Summary Judgment, Discovery)
- **Constitution of Kenya 2010** (Articles 22, 47, 50, 165)
- **Advocates Remuneration Order (ARO)** & Party/Party bill of costs calculations
- **Commercial, Employment, Land & Tax Jurisprudence**

How may I assist you with your active matters, pleadings drafting, case law research, or court filings today?`,
        timestamp: 'Just now',
        persona: 'senior_counsel',
      },
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem('chambers_ai_agent_chat', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const query = (customPrompt || inputQuery).trim();
    if (!query || isLoading) return;

    setErrorMsg(null);
    setInputQuery('');

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      matterRef: selectedMatter ? selectedMatter.referenceNumber : undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          persona: activePersona,
          matter: selectedMatter,
          context: {
            currentAdvocate,
            firmName: settings.firmName,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      const assistantMessage: ChatMessage = {
        id: `msg-res-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Analysis completed without text output.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        persona: activePersona,
        matterRef: selectedMatter ? selectedMatter.referenceNumber : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('AI Assistant API Error:', err);
      setErrorMsg(err.message || 'Failed to receive response from Wakili AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear this consultation session history?')) {
      const initial: ChatMessage[] = [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `### ⚖️ New Chambers Session Started
          
I am ready for your next legal inquiry, drafting task, or precedent research request.`,
          timestamp: 'Just now',
          persona: activePersona,
        },
      ];
      setMessages(initial);
      localStorage.removeItem('chambers_ai_agent_chat');
    }
  };

  const handleDownloadTranscript = () => {
    const textContent = messages
      .map(
        (m) =>
          `[${m.timestamp}] ${m.role === 'user' ? currentAdvocate.name : 'Wakili AI'}:\n${m.content}\n\n${'='.repeat(50)}\n`
      )
      .join('\n');

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chambers_AI_Consultation_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentPersonaObj =
    AGENT_PERSONAS.find((p) => p.id === activePersona) || AGENT_PERSONAS[0];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e2e7eb] pb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#132c3f] to-[#1c4766] text-[#60b7f8] shadow-sm border border-[#234b6a]">
            <Sparkles className="h-6 w-6 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold font-serif-title text-[#1c2d3d]">
                Wakili AI • Legal Intelligence Agent
              </h2>
              <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold tracking-wide">
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-[#5c6f84] mt-0.5">
              Kenyan Law & Jurisprudence Assistant • Pleadings Drafter • Case Law & Precedent Research • ARO Fee Auditor
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleDownloadTranscript}
            className="flex items-center space-x-1.5 rounded-md border border-[#d1d7dc] bg-white px-3 py-1.5 text-xs font-semibold text-[#1c2d3d] hover:bg-[#f4f6f8] shadow-2xs transition-colors cursor-pointer"
            title="Download full chat transcript"
          >
            <Download className="h-3.5 w-3.5 text-[#5c6f84]" />
            <span>Export Notes</span>
          </button>

          <button
            type="button"
            onClick={handleClearHistory}
            className="flex items-center space-x-1.5 rounded-md border border-[#d1d7dc] bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 shadow-2xs transition-colors cursor-pointer"
            title="Clear current session"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Control Rail & Right Interactive Chat Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Rail (1 col): Persona Selector & Linked Case Context */}
        <div className="lg:col-span-1 space-y-5">
          {/* Linked Case Selector */}
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1c2d3d] flex items-center space-x-1.5">
                <Briefcase className="h-3.5 w-3.5 text-[#0070ba]" />
                <span>Link Active Matter:</span>
              </label>
              {selectedMatter && (
                <button
                  type="button"
                  onClick={() => setSelectedMatter(null)}
                  className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                >
                  Unlink
                </button>
              )}
            </div>

            <select
              value={selectedMatter?.id || ''}
              onChange={(e) => {
                const found = matters.find((m) => m.id === e.target.value);
                setSelectedMatter(found || null);
              }}
              className="w-full rounded-md border border-[#d1d7dc] bg-[#f8fafc] px-2.5 py-2 text-xs text-[#1c2d3d] focus:border-[#0070ba] focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="">-- General Chambers Inquiry (No Case Linked) --</option>
              {matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.referenceNumber} • {m.title.slice(0, 32)}...
                </option>
              ))}
            </select>

            {selectedMatter ? (
              <div className="rounded-lg bg-[#ebf5fc] p-3 text-[11px] text-[#0f4871] border border-[#c3e1f7] space-y-1">
                <div className="font-bold flex items-center justify-between">
                  <span className="truncate">{selectedMatter.referenceNumber}</span>
                  <span className="text-[10px] bg-white text-[#0070ba] px-1.5 py-0.2 rounded font-mono">
                    {selectedMatter.status}
                  </span>
                </div>
                <p className="text-stone-700 font-medium line-clamp-2">{selectedMatter.title}</p>
                <div className="text-[10px] text-[#5c6f84] pt-1 flex items-center justify-between border-t border-[#c3e1f7]/60">
                  <span>Client: {selectedMatter.clientName}</span>
                  <span>KES {(selectedMatter.claimAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#8c9ba8]">
                Select a case file from your registry to ground drafts and legal reasoning in real matter facts.
              </p>
            )}
          </div>

          {/* AI Agent Persona Switcher */}
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-4 shadow-2xs space-y-3">
            <div className="text-xs font-bold text-[#1c2d3d] flex items-center space-x-1.5">
              <Bot className="h-4 w-4 text-amber-500" />
              <span>Specialized Agent Persona:</span>
            </div>

            <div className="space-y-1.5">
              {AGENT_PERSONAS.map((persona) => {
                const Icon = persona.icon;
                const isSelected = activePersona === persona.id;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setActivePersona(persona.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start space-x-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#132c3f] text-white border-[#132c3f] shadow-xs'
                        : 'bg-white text-[#1c2d3d] border-[#e2e7eb] hover:bg-[#f8fafc] hover:border-[#c0d1dc]'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#1e4460] text-amber-300' : 'bg-[#f4f6f8] text-[#0070ba]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span className="truncate">{persona.name}</span>
                      </div>
                      <p
                        className={`text-[10px] leading-snug mt-0.5 line-clamp-2 ${
                          isSelected ? 'text-[#a2c2d8]' : 'text-[#5c6f84]'
                        }`}
                      >
                        {persona.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suggested Quick Prompt Starters */}
          <div className="rounded-xl border border-[#d1d7dc] bg-white p-4 shadow-2xs space-y-2.5">
            <div className="text-xs font-bold text-[#1c2d3d] flex items-center space-x-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Quick Prompt Starters:</span>
            </div>

            <div className="space-y-1.5">
              {SUGGESTED_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={isLoading}
                  className="w-full text-left p-2 rounded-md bg-[#f8fafc] hover:bg-[#ebf5fc] border border-[#e2e7eb] hover:border-[#c3e1f7] text-[11px] text-[#1c2d3d] transition-all group flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <div className="truncate">
                    <span className="font-semibold text-[#0070ba] block">{item.title}</span>
                    <span className="text-[10px] text-[#5c6f84] line-clamp-1">{item.prompt}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-[#8c9ba8] group-hover:text-[#0070ba] shrink-0 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area (3 cols): Live Chat Workspace */}
        <div className="lg:col-span-3 flex flex-col h-[750px] rounded-xl border border-[#d1d7dc] bg-white shadow-2xs overflow-hidden">
          
          {/* Active Agent Status Bar */}
          <div className="border-b border-[#e2e7eb] bg-[#f8fafc] px-5 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#1c2d3d]">{currentPersonaObj.name}</span>
                  <span className="text-[10px] font-mono text-[#0070ba] bg-[#ebf5fc] px-1.5 py-0.2 rounded border border-[#c3e1f7]">
                    {currentPersonaObj.badge}
                  </span>
                </div>
                {selectedMatter && (
                  <p className="text-[10px] text-[#5c6f84]">
                    Active Context: <span className="font-medium text-[#1c2d3d]">{selectedMatter.referenceNumber}</span> ({selectedMatter.courtName || 'High Court of Kenya'})
                  </p>
                )}
              </div>
            </div>

            <div className="text-[11px] text-[#8c9ba8] font-mono flex items-center space-x-1.5">
              <span>LSK Practice Mode</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">Online</span>
            </div>
          </div>

          {/* Messages Stream Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#fafbfc]">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    isUser ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar Icon */}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 shadow-2xs ${
                      isUser
                        ? 'bg-[#0070ba] text-white ring-2 ring-blue-100'
                        : 'bg-[#132c3f] text-amber-400 ring-2 ring-slate-200'
                    }`}
                  >
                    {isUser ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-[86%] rounded-2xl p-4 text-xs shadow-2xs ${
                      isUser
                        ? 'bg-[#0070ba] text-white rounded-tr-none'
                        : 'bg-white border border-[#d1d7dc] text-[#1c2d3d] rounded-tl-none'
                    }`}
                  >
                    {/* Role Header & Matter Tag */}
                    <div
                      className={`flex items-center justify-between pb-2 mb-2 border-b text-[10px] font-mono ${
                        isUser
                          ? 'border-blue-400/40 text-blue-100'
                          : 'border-stone-100 text-[#5c6f84]'
                      }`}
                    >
                      <span className="font-bold">
                        {isUser ? currentAdvocate.name : 'Wakili AI Agent'}
                      </span>
                      <div className="flex items-center space-x-2">
                        {message.matterRef && (
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono ${
                              isUser
                                ? 'bg-blue-800 text-blue-200'
                                : 'bg-[#ebf5fc] text-[#0070ba]'
                            }`}
                          >
                            Ref: {message.matterRef}
                          </span>
                        )}
                        <span>{message.timestamp}</span>
                      </div>
                    </div>

                    {/* Formatted Message Body */}
                    <div className="leading-relaxed whitespace-pre-wrap selection:bg-amber-200 selection:text-stone-900 font-sans space-y-2">
                      {message.content}
                    </div>

                    {/* Copy and Actions for AI Messages */}
                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                        <span className="text-[10px] text-stone-400">
                          Muthoni Ahago Advocates Legal Intelligence
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(message.id, message.content)}
                          className="inline-flex items-center space-x-1 text-stone-600 hover:text-[#0070ba] bg-stone-50 hover:bg-stone-100 px-2 py-0.5 rounded border border-stone-200 transition-colors cursor-pointer"
                        >
                          {copiedId === message.id ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span className="text-emerald-700 font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Draft</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading Skeleton indicator */}
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#132c3f] text-amber-400 shrink-0 animate-pulse">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-white border border-[#d1d7dc] p-4 text-xs shadow-2xs space-y-2 max-w-md">
                  <div className="flex items-center space-x-2 text-stone-700 font-semibold">
                    <RefreshCw className="h-3.5 w-3.5 text-[#0070ba] animate-spin" />
                    <span>Wakili AI is analyzing statutes & drafting legal opinion...</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <div className="h-2.5 w-48 bg-stone-200 rounded animate-pulse" />
                    <div className="h-2.5 w-64 bg-stone-100 rounded animate-pulse" />
                    <div className="h-2.5 w-36 bg-stone-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-rose-800 text-xs flex items-start space-x-2.5">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Consultation Error</p>
                  <p className="mt-0.5 text-[11px] opacity-90">{errorMsg}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="border-t border-[#e2e7eb] bg-white p-4 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="space-y-2"
            >
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  rows={3}
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Ask ${currentPersonaObj.name} anything (e.g. "Draft an ex-parte Notice of Motion under Order 51 CPR", "Calculate instruction fees for KES 150M suit under ARO Schedule 6")...`}
                  className="w-full rounded-xl border border-[#d1d7dc] bg-[#f8fafc] p-3 pr-24 text-xs text-[#1c2d3d] placeholder:text-[#8c9ba8] focus:border-[#0070ba] focus:bg-white focus:outline-none transition-all shadow-2xs leading-relaxed"
                />

                <div className="absolute right-2.5 bottom-2.5 flex items-center space-x-1.5">
                  <button
                    type="submit"
                    disabled={isLoading || !inputQuery.trim()}
                    className="flex items-center space-x-1.5 rounded-lg bg-[#e9572b] hover:bg-[#d8471e] text-white px-4 py-2 text-xs font-bold shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <span>Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8c9ba8] px-1">
                <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line.</span>
                <span>Powered by Google Gemini 3.7 Flash</span>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
