import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, FileText, Database, X } from 'lucide-react';

const Schemes = () => {
  const [activeSegment, setActiveSegment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [ragResult, setRagResult] = useState(null);
  const [error, setError] = useState(null);

  const segments = ['All', 'Subsidy', 'Insurance', 'Loan', 'State', 'Central'];

  const [allSchemes, setAllSchemes] = useState([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);

  React.useEffect(() => {
    const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
    fetch(`${API_BASE}/schemes/all`)
      .then(res => res.json())
      .then(data => {
        setAllSchemes(data);
        setLoadingSchemes(false);
      })
      .catch(err => {
        console.error("Failed to load generic schemes", err);
        setLoadingSchemes(false);
      });
  }, []);

  const filteredSchemes = activeSegment === 'All' 
    ? allSchemes 
    : allSchemes.filter(s => s.type === activeSegment || s.segment === activeSegment);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
      const res = await fetch(`${API_BASE}/schemes?query=${encodeURIComponent(searchQuery)}&state=Haryana`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setRagResult(data);
    } catch (err) {
      setError("Failed to fetch scheme information from RAG backend.");
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setRagResult(null);
    setError(null);
  };

  return (
    <div className="flex flex-col pb-16 font-inter">
      {/* High Contrast Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center border border-indigo-200 shadow-sm">
              <FileText size={18} className="text-indigo-700" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-700">Scheme Directory</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            Capital Allocation & Frameworks
          </h1>
          <p className="text-base text-gray-600 leading-relaxed font-semibold mt-1 max-w-xl">
            A comprehensive index of state and central subsidies, insurance protocols, and structural loans applicable to your holding. Search for custom queries.
          </p>
        </div>
        
        <div className="flex-shrink-0 w-full md:w-96">
          <form onSubmit={handleSearch} className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-inner">
            <Search size={18} className="text-gray-400 mr-3" />
            <input 
              type="text" 
              placeholder="Query specialized frameworks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
              className="bg-transparent border-none text-[15px] font-semibold text-gray-900 placeholder-gray-500 focus:outline-none w-full disabled:opacity-50"
            />
            {searchQuery && (
              <button type="button" onClick={clearSearch} className="ml-2 text-gray-400 hover:text-gray-900">
                <X size={16} />
              </button>
            )}
          </form>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-10 text-center py-10"
          >
            <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Querying Pinecone Vector Store...</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-10 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold shadow-sm"
          >
            {error}
          </motion.div>
        )}

        {ragResult && !isSearching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 bg-indigo-900 text-white rounded-2xl p-8 border border-indigo-800 shadow-xl overflow-hidden relative"
          >
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-800 blur-3xl opacity-50 rounded-full"></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6 border-b border-indigo-800 pb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-800 flex items-center justify-center shadow-inner">
                  <Search size={20} className="text-indigo-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-widest text-indigo-300 uppercase">AI Knowledge Base Response</h3>
                  <p className="text-xl font-extrabold text-white">Result for "{ragResult.query}"</p>
                </div>
              </div>

              <div className="prose prose-indigo prose-invert max-w-none text-indigo-50 font-medium leading-relaxed mb-8">
                {ragResult.result.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              {ragResult.sources && ragResult.sources.length > 0 && (
                <div className="mt-auto pt-4 border-t border-indigo-800 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 mr-2">Verified Frameworks:</span>
                  {ragResult.sources.map((src, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white bg-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-700 shadow-sm">
                      <Database size={12} className="text-indigo-300" />
                      {src}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-8">
        {/* Solid Navigation Segments */}
        <div className="flex flex-wrap gap-3">
          {segments.map((seg) => (
            <button 
              key={seg} 
              onClick={() => setActiveSegment(seg)}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all border shadow-sm
                ${activeSegment === seg 
                  ? 'bg-gray-900 border-gray-900 text-white' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300'}`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* Deep Shadow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredSchemes.map((scheme) => (
            <motion.div 
              key={scheme.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 md:p-10 flex flex-col group hover:shadow-md transition-all hover:border-indigo-200"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shadow-sm">
                    {scheme.segment}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-sm">
                    {scheme.type}
                  </div>
                </div>
                <div className="text-right bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 shadow-inner">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">Max Yield</div>
                  <div className="text-lg font-black text-gray-900">{scheme.metric}</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-snug mb-2 group-hover:text-indigo-600 transition-colors">{scheme.title}</h3>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  AUTHORITY: {scheme.authority}
                </div>
              </div>

              <p className="text-[15px] font-semibold text-gray-600 leading-relaxed mb-10 flex-1">
                {scheme.desc}
              </p>

              <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100">
                <div className="flex flex-col bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Application Deadline</span>
                  <span className="text-sm font-extrabold text-gray-900 tracking-wide">{scheme.deadline}</span>
                </div>
                <button className="editorial-btn-outline group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 flex items-center gap-2">
                  Open Action <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Schemes;
