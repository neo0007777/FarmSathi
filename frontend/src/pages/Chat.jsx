import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Settings2, Database } from 'lucide-react';

const API_BASE = '/api';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "System initialized. FarmSathi diagnostic and advisory protocol ready. Please provide field parameters or query constraints.", 
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState('en');
  const scrollRef = useRef(null);
  // Keep a rolling chat history for multi-turn context
  const historyRef = useRef([]);

  const suggestions = [
    "Identify yellowing in basal wheat leaves",
    "Calculate NPK ratio for alluvial soil",
    "List Kharif drought-resistant cultivars"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim() || isTyping) return;

    const userMsg = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Build history for context (last 6 turns)
    const history = historyRef.current.slice(-6);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          language,
          history,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Server error' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();

      // Update rolling history
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: messageText },
        { role: 'assistant', content: data.reply },
      ];

      const aiMsg = {
        id: Date.now() + 1,
        text: data.reply,
        sender: 'ai',
        timestamp: new Date(),
        sources: data.sources || [],
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        text: `⚠️ Error: ${err.message}. Make sure the backend server is running on port 8000.`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden mt-4">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white shadow-sm z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-gray-900 mb-0.5 tracking-tight">
              Diagnostic Terminal
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
              Online Status
            </div>
          </div>
        </div>

        {/* Language toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >EN</button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${language === 'hi' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >हिं</button>
          </div>
          <button className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors bg-white">
            <Settings2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50 flex flex-col gap-8 custom-scrollbar" ref={scrollRef}>
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              className={`flex flex-col w-full max-w-[75%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
                {msg.sender === 'user' ? 'You' : 'AI Protocol'}
              </div>
              
              <div className={`p-4 md:p-5 text-[15px] leading-relaxed font-medium min-w-[200px] shadow-sm
                ${msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-md' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm hover:shadow-md transition'
                }`}
              >
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} className={i !== 0 ? 'mt-3 relative' : ''}>
                    {line.includes('PROTOCOL:') || line.includes('DIAGNOSIS:') || line.includes('ACTION REQUIRED:') 
                      ? <strong className={msg.sender === 'user' ? 'text-white' : 'text-gray-900 font-bold'}>{line}</strong>
                      : line
                    }
                  </p>
                ))}
              </div>
              
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.sources.map((src, i) => (
                    <div key={i} className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 flex items-center gap-1">
                      <Database size={10} />
                      {src}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div className="flex flex-col w-full max-w-md self-start items-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-1">
                AI Protocol
              </div>
              <div className="p-4 md:p-5 bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-sm flex items-center min-w-[120px]">
                <div className="h-4 flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce shadow-sm"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75 shadow-sm"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150 shadow-sm"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 md:p-6 shadow-sm z-10 relative">
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600 py-1.5 shrink-0">Prompts</span>
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(s)}
                disabled={isTyping}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-[13px] font-bold text-gray-700 hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-stretch gap-3">
          <div className="flex-1 flex items-center bg-gray-100 border border-gray-200 rounded-xl px-4 py-1 flex focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-inner">
            <div className="text-indigo-500 pr-2">
              <span className="font-extrabold font-mono">&gt;</span>
            </div>
            <input 
              type="text" 
              className="flex-1 bg-transparent py-3 text-[15px] font-semibold text-gray-900 placeholder-gray-500 focus:outline-none"
              placeholder="Query protocol..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping}
            />
            <button className="pl-4 text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none">
              <Mic size={20} />
            </button>
          </div>
          <button 
            className="editorial-btn-primary flex items-center justify-center px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleSend()} 
            disabled={!input.trim() || isTyping}
          >
            <Send size={18} className="mr-2" /> Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
