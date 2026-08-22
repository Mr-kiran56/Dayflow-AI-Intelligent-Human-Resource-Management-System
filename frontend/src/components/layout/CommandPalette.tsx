import React, { useState, useEffect } from 'react';
import { Search, X, User, CalendarDays, Clock, FileText, ArrowRight } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { SearchResultItem } from '../../types';
import { useNavigate } from 'react-router-dom';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await notificationService.globalSearch(query);
        setResults(res);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-floating border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        <div className="flex items-center px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employees, leave requests, attendance..."
            className="w-full text-sm outline-none text-slate-900 placeholder-slate-400 bg-transparent"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 mr-2">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && <div className="p-4 text-center text-xs text-slate-500">Searching Dayflow DB...</div>}

          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">No matching records found for "{query}".</div>
          )}

          {!loading && !query && (
            <div className="p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Navigation</p>
              <div
                onClick={() => {
                  navigate('/attendance');
                  onClose();
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <Clock className="w-4 h-4 text-brand-600" />
                  <span>Check Attendance & Work Hours</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div
                onClick={() => {
                  navigate('/leave');
                  onClose();
                }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <CalendarDays className="w-4 h-4 text-brand-600" />
                  <span>Request Time-off or View Balances</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          )}

          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                navigate(item.url);
                onClose();
              }}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                {item.type === 'employee' ? (
                  <User className="w-4 h-4" />
                ) : item.type === 'leave_request' ? (
                  <CalendarDays className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                {item.type.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
