import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Database, Sprout, TrendingUp, ThermometerSun, Leaf, AlertTriangle } from 'lucide-react';

const Advisor = () => {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const [formData, setFormData] = useState({
    district: '',
    soil: '',
    season: '',
    landSize: '',
    water: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
      const res = await fetch(`${API_BASE}/advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district: formData.district,
          state: "Haryana",
          soil_type: formData.soil,
          season: formData.season,
          land_acres: parseFloat(formData.landSize) || 1.0,
          water_source: formData.water || "Rainfed"
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError("Failed to run the strategic analysis. Make sure the backend serves the /api/advisor route.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setResults(null);
    setError(null);
    // keeping formData to allow tweaking
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 font-inter">
      <div className="mb-10 bg-white border border-gray-200 shadow-sm p-8 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Strategic Planning
          </h1>
          <p className="text-base text-gray-600 font-semibold max-w-xl">Input environmental constraints to generate highly confident crop deployment strategies with deep intelligence.</p>
        </div>
        <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
          <Sprout size={32} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && !isAnalyzing && (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-6 overflow-hidden">
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertTriangle className="text-red-500 shrink-0" size={20} />
                  <p className="text-sm font-bold text-red-700">{error}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col justify-center">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    <div className="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-900 flex items-center justify-center shadow-sm">1</div>
                    Operational District
                  </label>
                  <select 
                    value={formData.district} 
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm"
                  >
                    <option value="">Select jurisdiction</option>
                    <option value="Sonipat">Sonipat</option>
                    <option value="Karnal">Karnal</option>
                    <option value="Rohtak">Rohtak</option>
                    <option value="Hisar">Hisar</option>
                  </select>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col justify-center">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    <div className="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-900 flex items-center justify-center shadow-sm">2</div>
                    Soil Composition
                  </label>
                  <select 
                    value={formData.soil} 
                    onChange={(e) => handleInputChange('soil', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm"
                  >
                    <option value="">Select matrix type</option>
                    <option value="Loamy">Alluvial (Loamy)</option>
                    <option value="Black">Black / Cotton Soil</option>
                    <option value="Sandy">Sandy / Arid</option>
                  </select>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col justify-center">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    <div className="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-900 flex items-center justify-center shadow-sm">3</div>
                    Temporal Season
                  </label>
                  <select 
                    value={formData.season} 
                    onChange={(e) => handleInputChange('season', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-[15px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm"
                  >
                    <option value="">Select phase</option>
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                  </select>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col justify-center">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                    <div className="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-900 flex items-center justify-center shadow-sm">4</div>
                    Scale (Acres)
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g. 5.0" 
                    value={formData.landSize}
                    onChange={(e) => handleInputChange('landSize', e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-[15px] font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow shadow-sm"
                  />
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 md:col-span-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    <div className="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-900 flex items-center justify-center shadow-sm">5</div>
                    Hydration Infrastructure
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Rainfed', 'Canal / Partial', 'Fully Irrigated'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleInputChange('water', opt)}
                        className={`p-5 rounded-xl border-2 transition-all flex items-center justify-between shadow-sm
                          ${formData.water === opt 
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-gray-50'}`}
                      >
                        <span className="text-sm font-bold tracking-wide">{opt}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.water === opt ? 'border-indigo-600' : 'border-gray-300'}`}>
                          {formData.water === opt && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 mb-4 flex justify-end px-4">
                <button 
                  className="editorial-btn-primary py-4 px-10 text-base shadow-lg hover:shadow-xl flex items-center gap-3 w-full md:w-auto disabled:opacity-50"
                  onClick={handleAnalyze}
                  disabled={!formData.district || !formData.soil || !formData.season || !formData.water}
                >
                  Execute Strategic Analysis <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {isAnalyzing && (
          <motion.div 
            key="analyzing"
            className="flex flex-col items-center justify-center py-40 border border-gray-200 rounded-3xl bg-white shadow-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-indigo-600 animate-spin mb-8 shadow-md"></div>
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Simulating Yield Models</h3>
            <p className="text-sm text-indigo-500 font-bold uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100 shadow-inner">CALCULATING PARAMETERS VIA RAG...</p>
          </motion.div>
        )}

        {step === 2 && results && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-8 bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Generation Complete
              </h2>
              <button className="editorial-btn-outline py-2 px-4 text-xs" onClick={resetForm}>
                Reconfigure Params
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="bg-indigo-900 text-white p-8 md:p-10 border-b border-gray-200 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-800 rounded-full blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                <h3 className="text-3xl font-extrabold tracking-tight mb-4 relative z-10">AI Diagnostic Report</h3>
                <div className="flex flex-wrap gap-2 relative z-10">
                  <span className="bg-indigo-950/50 border border-indigo-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest text-indigo-100">{formData.district}</span>
                  <span className="bg-indigo-950/50 border border-indigo-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest text-indigo-100">{formData.soil} Soil</span>
                  <span className="bg-indigo-950/50 border border-indigo-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest text-indigo-100">{formData.season} Season</span>
                  <span className="bg-indigo-950/50 border border-indigo-800 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest text-indigo-100">{formData.landSize || 1} Acres</span>
                </div>
              </div>

              <div className="p-8 md:p-10">
                <div className="prose prose-indigo max-w-none prose-p:text-gray-700 prose-p:font-medium prose-p:leading-relaxed prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ul:font-medium">
                  {results.recommendations.split('\n').map((line, i) => (
                    <p key={i} className="mb-4">
                      {line.startsWith('**') && line.endsWith('**') ? 
                        <span className="text-lg font-bold text-gray-900 block mt-6 mb-2">{line.replace(/\*\*/g, '')}</span> :
                        line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)
                      }
                    </p>
                  ))}
                </div>
              </div>

              {results.sources && results.sources.length > 0 && (
                <div className="bg-gray-50 border-t border-gray-200 p-6 md:px-10 flex flex-wrap gap-3 items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Verified Sources:</span>
                  {results.sources.map((src, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      <Database size={12} className="text-indigo-600" />
                      {src}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Advisor;
