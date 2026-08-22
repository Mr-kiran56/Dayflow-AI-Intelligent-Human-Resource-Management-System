import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { api } from '../services/api';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  Plus,
  MessageSquare,
  Trash2,
  History,
  BookOpen,
  Wallet,
  CalendarDays,
  Users,
  MessageCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

type AiIntent = 'chat' | 'policy' | 'workforce' | 'salary' | 'attendance' | 'leave';

interface PromptChip {
  label: string;
  intent: AiIntent;
  message: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

export const AiInsightsPage: React.FC = () => {
  const { user, isAdminOrHr } = useAuth();
  const userId = user?.id || 'default_user';
  const localStorageKey = `dayflow_chat_sessions_${userId}`;

  const defaultInitialSession: ChatSession = {
    id: 'session-1',
    title: 'HR Policy & Operations',
    createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    messages: [
      {
        id: 'msg-1',
        sender: 'ai',
        text: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! I'm **DayFlow AI** — your HR assistant grounded in live database records. Use the quick-action chips below for policy, leave, salary, and attendance queries, or type anything freely.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
    return [defaultInitialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || 'session-1');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const promptChips: PromptChip[] = ([
    {
      label: 'WFH Policy',
      intent: 'policy' as const,
      message: 'What is our Work From Home (WFH) policy?',
      icon: BookOpen,
    },
    {
      label: 'Health Insurance',
      intent: 'policy' as const,
      message: 'What is our health insurance and wellness coverage?',
      icon: BookOpen,
    },
    {
      label: 'Leave Balance',
      intent: 'leave' as const,
      message: 'How many paid leaves do I have left?',
      icon: CalendarDays,
    },
    {
      label: 'Salary Breakdown',
      intent: 'salary' as const,
      message: 'Explain my salary breakdown.',
      icon: Wallet,
    },
    {
      label: 'Attendance Insight',
      intent: 'attendance' as const,
      message: 'Analyze my attendance patterns this month.',
      icon: CalendarDays,
    },
    {
      label: 'Workforce Summary',
      intent: 'workforce' as const,
      message: "Summarize today's workforce status for executive review.",
      icon: Users,
      adminOnly: true,
    },
  ] as PromptChip[]).filter((chip) => !chip.adminOnly || isAdminOrHr);

  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save chat sessions', e);
    }
  }, [sessions, localStorageKey]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || defaultInitialSession;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, loading]);

  const createNewChat = () => {
    const newSessionId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Conversation',
      createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! How can I help you in this session?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
  };

  const deleteSession = (sessionIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionIdToDelete);
    if (updated.length === 0) {
      setSessions([defaultInitialSession]);
      setActiveSessionId(defaultInitialSession.id);
    } else {
      setSessions(updated);
      if (activeSessionId === sessionIdToDelete) {
        setActiveSessionId(updated[0].id);
      }
    }
  };

  const fetchAiResponse = async (text: string, intent: AiIntent): Promise<string> => {
    switch (intent) {
      case 'policy': {
        const res: any = await api.post('/ai/policy-rag', { message: text });
        let answer = res.data.answer || '';
        const source =
          res.data.policy_title ||
          res.data.policy_sources?.[0]?.title ||
          res.data.matched_policies?.[0]?.title;
        if (source) {
          answer += `\n\n**Source:** ${source}`;
        }
        return answer;
      }
      case 'workforce': {
        const res = await aiService.adminWorkforceSummary();
        return res.executive_summary;
      }
      case 'salary': {
        const res = await aiService.explainSalary();
        return res.explanation;
      }
      case 'attendance': {
        const res = await aiService.getAttendanceInsight();
        return res.insight_text;
      }
      case 'leave':
      case 'chat':
      default: {
        const res = await aiService.chat(text);
        return res.answer;
      }
    }
  };

  const handleSend = async (messageText?: string, intent: AiIntent = 'chat') => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions((prevSessions) =>
      prevSessions.map((session) => {
        if (session.id === activeSessionId) {
          const newTitle =
            session.title === 'New Conversation' || session.title === 'HR Policy & Operations'
              ? textToSend.slice(0, 32) + (textToSend.length > 32 ? '…' : '')
              : session.title;
          return { ...session, title: newTitle, messages: [...session.messages, userMsg] };
        }
        return session;
      })
    );

    if (!messageText) setInput('');
    setLoading(true);

    try {
      const aiText = await fetchAiResponse(textToSend, intent);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, aiMsg] }
            : session
        )
      );
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Sorry, I couldn't process that request: ${err.message || 'Server error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === activeSessionId
            ? { ...session, messages: [...session.messages, errorMsg] }
            : session
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (rawText: string) => {
    const cleanText = rawText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    const lines = cleanText.split('\n');

    return (
      <div className="space-y-2 text-sm leading-relaxed text-slate-800">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;
          if (trimmed.startsWith('# ')) {
            return (
              <h3 key={idx} className="text-base font-extrabold text-slate-900 mt-3 mb-1 border-b border-slate-200 pb-1">
                {trimmed.replace(/^#\s+/, '')}
              </h3>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h4 key={idx} className="text-sm font-bold text-brand-700 mt-2.5 mb-1">
                {trimmed.replace(/^##\s+/, '')}
              </h4>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const bulletContent = trimmed.replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 my-1 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-ai-500 shrink-0 mt-2" />
                <div className="flex-1">{parseInlineBold(bulletContent)}</div>
              </div>
            );
          }
          return <p key={idx}>{parseInlineBold(line)}</p>;
        })}
      </div>
    );
  };

  const parseInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-slate-900 bg-ai-50 px-1 py-0.5 rounded">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden">
      {/* Session sidebar */}
      <div className="hidden md:flex w-72 bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle flex-col shrink-0 h-full overflow-hidden">
        <button
          onClick={createNewChat}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-brand-600 to-ai-600 hover:from-brand-700 hover:to-ai-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mb-4"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>

        <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1">
            <History className="w-3.5 h-3.5" />
            Chat History ({sessions.length})
          </div>

          {sessions.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              description="Start a new session with DayFlow AI."
            />
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`group p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-sm border ${
                    isActive
                      ? 'bg-ai-50 border-ai-200 text-ai-900 font-semibold'
                      : 'bg-white hover:bg-slate-50 border-transparent text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-ai-600' : 'text-slate-400'}`} />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    aria-label="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 text-slate-400 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat workspace */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-ai-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-brand-600 to-ai-500 text-white rounded-xl shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{activeSession?.title || 'DayFlow AI'}</h3>
              <p className="text-sm text-slate-500">Grounded in your live HR data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={createNewChat}
              className="md:hidden p-2 bg-brand-600 text-white rounded-xl text-sm font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
            <span className="px-3 py-1 bg-ai-50 text-ai-700 border border-ai-200 rounded-full text-xs font-bold">
              DB Grounded
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-slate-50/30" aria-live="polite">
          {activeSession?.messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-900 text-white shadow-sm'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-ai-400" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-subtle ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-sm font-medium text-sm'
                    : 'bg-white border border-slate-200/80 rounded-tl-sm text-slate-900'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                ) : (
                  renderFormattedText(msg.text)
                )}
                <span
                  className={`text-xs mt-2 block text-right font-medium ${
                    msg.sender === 'user' ? 'text-brand-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-ai-400 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-subtle flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-ai-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-ai-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-ai-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-sm text-slate-500 font-medium ml-1">Reading your HR records…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Intent-based quick actions — explicit routing, no keyword guessing */}
        <div className="p-3 px-4 bg-white border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-sm font-bold text-slate-600">Quick Actions</span>
            <span className="text-xs text-slate-400">— each routes to a dedicated AI endpoint</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
            {promptChips.map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.label}
                  onClick={() => handleSend(chip.message, chip.intent)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-ai-50 hover:text-ai-700 hover:border-ai-200 text-slate-700 border border-slate-200 rounded-full text-sm font-semibold whitespace-nowrap transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(undefined, 'chat');
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything — leave, salary, policy, attendance…"
              disabled={loading}
              aria-label="Message DayFlow AI"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-ai-500 focus:ring-2 focus:ring-ai-500/20 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="p-3 bg-gradient-to-r from-brand-600 to-ai-600 hover:from-brand-700 hover:to-ai-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-sm shrink-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            Free-text messages use the general chat endpoint. Quick Actions use specialized AI routes.
          </p>
        </div>
      </div>
    </div>
  );
};
