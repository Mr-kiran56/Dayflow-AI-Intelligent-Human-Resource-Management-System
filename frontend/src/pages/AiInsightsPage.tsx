import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { api } from '../services/api';

import { Sparkles, Send, Bot, User, CheckCircle2, Lightbulb } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiInsightsPage: React.FC = () => {
  const { user, isAdminOrHr } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello ${user?.full_name?.split(' ')[0]}! I am Dayflow AI, your intelligent HR assistant. I can answer questions about your leave balances, explain your salary paystubs, analyze attendance trends, or provide workforce executive summaries based strictly on authoritative database records. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput('');
    setLoading(true);

    try {
      let aiText = '';
      if (textToSend.toLowerCase().includes('policy') || textToSend.toLowerCase().includes('insurance') || textToSend.toLowerCase().includes('wfh') || textToSend.toLowerCase().includes('work from home')) {
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
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'I could not retrieve data right now. Operating in fallback mode based on active database state.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">

      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Dayflow AI Assistant
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Contextual HR assistant grounded strictly in authoritative database records.
          </p>
        </div>

        <span className="px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Grounded in Database
        </span>
      </div>

      {/* Suggested Chips */}
      <div className="flex flex-wrap gap-2">
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="text-xs px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 rounded-xl transition-all shadow-subtle flex items-center gap-1.5 font-medium"
          >
            <Lightbulb className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 overflow-y-auto space-y-4 shadow-subtle">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-indigo-600 text-white shadow-sm'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed space-y-1 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <span className="text-[10px] opacity-70 block text-right mt-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-slate-400 p-2">
            <Bot className="w-4 h-4 animate-spin text-indigo-600" />
            Dayflow AI is analyzing database records...
          </div>
        )}
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-subtle"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Dayflow AI about leave, attendance, or payroll..."
          className="flex-1 px-4 py-2.5 text-xs text-slate-900 outline-none bg-transparent"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
