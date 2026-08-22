import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { api } from '../services/api';
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
    title: 'HR Assistance & Database Check',
    createdAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    messages: [
      {
        id: 'msg-1',
        sender: 'ai',
        text: `Hello ${user?.full_name?.split(' ')[0] || 'User'}! I am Dayflow AI, your intelligent HR assistant. I can answer questions about your leave balances, explain your salary paystubs, analyze attendance trends, or search company HR policy handbooks. How can I assist you today?`,
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

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save chat sessions', e);
    }
  }, [sessions, localStorageKey]);

  // Auto-scroll to bottom of chat
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

    // Update active session title if it's "New Conversation"
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
        text: 'I could not retrieve data right now. Operating in fallback mode based on active database state.',
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

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex gap-4 text-slate-900 overflow-hidden">

      {/* ChatGPT Style Left Conversations History Sidebar */}
      <div className="w-72 bg-white rounded-2xl border border-slate-200 p-3 flex flex-col shadow-subtle shrink-0 hidden md:flex">

        {/* New Chat Button */}
        <button
          onClick={createNewChat}
          className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mb-3"
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

          {sessions.map((session) => {
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
          })}
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
              <p className="text-[11px] text-slate-500">Contextual HR Assistant Grounded in Supabase DB</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={createNewChat}
              className="md:hidden p-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> DB Grounded
            </span>
          </div>
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-4 py-2 bg-slate-50/30 border-b border-slate-100 flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {suggestedPrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(promptText)}
              className="text-[11px] px-3 py-1 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 text-slate-700 rounded-lg transition-all shadow-xs whitespace-nowrap shrink-0 flex items-center gap-1 font-medium"
            >
              <Lightbulb className="w-3 h-3 text-indigo-600" />
              <span>{promptText}</span>
            </button>
          ))}
        </div>

        {/* Messages Stream Viewport */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
          {activeSession?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-indigo-600 text-white shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-1 ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className="text-[10px] opacity-70 block text-right mt-1 font-mono">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-xs text-slate-400 p-2">
              <Bot className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Dayflow AI is analyzing database records & vector policy indexes...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Action Bar */}
        <div className="p-3 bg-white border-t border-slate-100">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Dayflow AI about leave, attendance, salary, or HR policies..."
              className="flex-1 px-3 py-2 text-xs text-slate-900 outline-none bg-transparent font-medium"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
