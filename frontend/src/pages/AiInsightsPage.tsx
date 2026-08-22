import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { api } from '../services/api';
import { EmptyState } from '../components/ui/EmptyState';
import { Sparkles, Send, Bot, User, CheckCircle2, Lightbulb, Plus, MessageSquare, Trash2, History } from 'lucide-react';

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

export const AiInsightsPage: React.FC = () => {
  const { user, isAdminOrHr } = useAuth();
  const userId = user?.id || 'default_user';
  const localStorageKey = `dayflow_chat_sessions_${userId}`;

  const defaultInitialSession: ChatSession = {
    id: 'session-1',
    title: 'HR Policy & Operations Assistance',
    createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    messages: [
      {
        id: 'msg-1',
        sender: 'ai',
        text: `Hello ${user?.full_name?.split(' ')[0] || 'Member'}! I am Dayflow AI. Ask me policy guidelines, your leave balance, shift clock status, or salary calculations.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };

  // Load chat sessions from LocalStorage for persistence across tab reloads
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load chat history from LocalStorage', e);
    }
    return [defaultInitialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions.length > 0 ? sessions[0].id : 'session-1';
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync session changes back to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save chat history to LocalStorage', e);
    }
  }, [sessions, localStorageKey]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || defaultInitialSession;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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
          text: `Hello ${user?.full_name?.split(' ')[0] || 'User'}! How can I assist you in this new session?`,
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

  const suggestedPrompts = [
    'What is our Work From Home (WFH) policy?',
    'What is our health insurance and wellness coverage?',
    'How many paid leaves do I have left?',
    'Explain my salary breakdown.',
    ...(isAdminOrHr ? ['Summarize today\'s workforce status for executive review.'] : []),
  ];

  const handleSend = async (messageText?: string) => {
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
          const newTitle = session.title === 'New Conversation' ? textToSend.slice(0, 28) + '...' : session.title;
          return {
            ...session,
            title: newTitle,
            messages: [...session.messages, userMsg],
          };
        }
        return session;
      })
    );

    if (!messageText) setInput('');
    setLoading(true);

    try {
      let aiText = '';
      if (
        textToSend.toLowerCase().includes('policy') ||
        textToSend.toLowerCase().includes('insurance') ||
        textToSend.toLowerCase().includes('wfh') ||
        textToSend.toLowerCase().includes('work from home')
      ) {
        const res: any = await api.post('/ai/policy-rag', { message: textToSend });
        aiText = res.data.answer;
        if (res.data.policy_title) {
          aiText += `\n\n**Source:** ${res.data.policy_title}`;
        } else {
          aiText += `\n\n**Source:** Dayflow AI Employee Policy Handbook`;
        }
      } else if (textToSend.includes('workforce') && isAdminOrHr) {
        const res = await aiService.adminWorkforceSummary();
        aiText = res.executive_summary;
      } else if (textToSend.includes('salary')) {
        const res = await aiService.explainSalary();
        aiText = res.explanation;
      } else if (textToSend.includes('attendance')) {
        const res = await aiService.getAttendanceInsight();
        aiText = res.insight_text;
      } else {
        const res = await aiService.chat(textToSend);
        aiText = res.answer;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setSessions((prevSessions) =>
        prevSessions.map((session) => {
          if (session.id === activeSessionId) {
            return {
              ...session,
              messages: [...session.messages, aiMsg],
            };
          }
          return session;
        })
      );
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Sorry, I encountered an issue processing your query: ${err.message || 'Server error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setSessions((prevSessions) =>
        prevSessions.map((session) => {
          if (session.id === activeSessionId) {
            return {
              ...session,
              messages: [...session.messages, errorMsg],
            };
          }
          return session;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * ChatGPT Corporate Clean Markdown Renderer
   * Renders bold text (**bold**), headers (# Title), bullet points (* item), and numbered lists
   * completely free of raw asterisks or casual emojis.
   */
  const renderFormattedText = (rawText: string) => {
    // Remove informal emojis for corporate HR readiness
    let cleanText = rawText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');

    const lines = cleanText.split('\n');

    return (
      <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-slate-800">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;

          // Heading 1 (# Header)
          if (trimmed.startsWith('# ')) {
            return (
              <h3 key={idx} className="text-base font-extrabold text-slate-900 mt-3 mb-1 border-b border-slate-200 pb-1">
                {trimmed.replace(/^#\s+/, '')}
              </h3>
            );
          }

          // Heading 2 (## Header)
          if (trimmed.startsWith('## ')) {
            return (
              <h4 key={idx} className="text-sm font-bold text-slate-900 mt-2.5 mb-1 text-indigo-700">
                {trimmed.replace(/^##\s+/, '')}
              </h4>
            );
          }

          // Bullet Points (- Item or * Item)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const bulletContent = trimmed.replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2.5 my-1 pl-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                <div className="flex-1">{parseInlineBold(bulletContent)}</div>
              </div>
            );
          }

          // Standard Paragraph
          return <p key={idx}>{parseInlineBold(line)}</p>;
        })}
      </div>
    );
  };

  // Helper parser for inline bold text (**bold**)
  const parseInlineBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold text-slate-900 bg-indigo-50/50 px-1 py-0.5 rounded">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden select-none">

      {/* Left Sidebar: Session Management (Zero Page Scroll) */}
      <div className="w-full md:w-72 bg-white rounded-2xl border border-slate-200 p-4 shadow-subtle flex flex-col justify-between shrink-0 h-full overflow-hidden">
        
        {/* Top Action */}
        <button
          onClick={createNewChat}
          className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mb-4"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>

        {/* Conversation Sessions List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1">
            <History className="w-3 h-3 text-slate-400" />
            <span>Chat History ({sessions.length})</span>
          </div>

          {sessions.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No Chat History"
              description="Start a new conversation session with Dayflow AI."
            />
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`group p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs border ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                      : 'bg-white hover:bg-slate-50 border-transparent text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate">{session.title}</span>
                  </div>

                  <button
                    onClick={(e) => deleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 text-slate-400 transition-opacity"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main ChatGPT Conversation Workspace (Zero Wasted Space) */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-subtle flex flex-col overflow-hidden">

        {/* Top Workspace Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{activeSession?.title || 'Dayflow AI Assistant'}</h3>
              <p className="text-[11px] text-slate-500">Smart HR Operations & Workforce Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={createNewChat}
              className="md:hidden p-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>New</span>
            </button>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-bold">
              Enterprise AI
            </span>
          </div>
        </div>

        {/* Conversation Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-slate-50/30">
          {activeSession?.messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-900 text-white shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 shadow-subtle ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-xs font-medium text-xs sm:text-sm'
                    : 'bg-white border border-slate-200/80 rounded-tl-xs text-slate-900'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                ) : (
                  renderFormattedText(msg.text)
                )}
                <span
                  className={`text-[10px] mt-2 block text-right font-medium ${
                    msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 shadow-subtle flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-500 font-medium ml-1">Analyzing database records...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts Horizontal Carousel */}
        <div className="p-2 px-4 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Prompts:</span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200/80 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Dayflow AI about policy, salary, leave balance..."
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all text-slate-900 font-medium placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-xs shrink-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
