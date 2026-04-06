import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Search, Database, ArrowRight, AlertTriangle } from 'lucide-react';

const API_BASE = '/api';

const Diagnose = () => {
  const [selectedFile, setSelectedFile] = useState(null);       // actual File object
  const [previewUrl, setPreviewUrl] = useState(null);           // base64 preview for <img>
  const [cropHint, setCropHint] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const diseases = [
    { id: 'wheat-rust', name: 'Wheat Rust (Puccinia triticina)' },
    { id: 'rice-blast', name: 'Rice Blast (Magnaporthe oryzae)' },
    { id: 'potato-blight', name: 'Late Blight (Phytophthora)' },
    { id: 'loose-smut', name: 'Loose Smut (Ustilago nuda)' },
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Store the actual File object for the multipart upload
    setSelectedFile(file);
    setResult(null);
    setError(null);

    // Generate a local preview URL
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const runDiagnosis = async (file, hint = cropHint) => {
    if (!file) {
      setError('Please upload an image first.');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    // Build multipart form — exactly what the backend expects
    const formData = new FormData();
    formData.append('file', file);
    if (hint) formData.append('crop_hint', hint);

    try {
      const res = await fetch(`${API_BASE}/diagnose`, {
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type header — browser sets it with boundary automatically
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(`Diagnosis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // For the "test vector" buttons — create a synthetic File from a public URL
  const handleTestVector = async (diseaseName) => {
    setError(null);
    setResult(null);
    setIsAnalyzing(true);
    setPreviewUrl(null);
    setSelectedFile(null);

    try {
      // Fetch a sample leaf image and convert to a File object
      const imgUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Wheat_leaf_rust.jpg/640px-Wheat_leaf_rust.jpg';
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      const file = new File([blob], 'test-sample.jpg', { type: 'image/jpeg' });

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      await runDiagnosis(file, diseaseName);
    } catch {
      // If network fetch fails (CORS etc.), show informative message
      setError(`Test vector requires the backend to be running. Please upload your own image.`);
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const getSeverityColor = (confidence) => {
    if (confidence >= 85) return 'text-red-600 bg-red-50 border-red-200';
    if (confidence >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  return (
    <div className="flex flex-col gap-8 pb-16 font-inter">
      {/* Header */}
      <div className="flex flex-col gap-3 max-w-2xl bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Pathology Scanner
        </h1>
        <p className="text-base text-gray-600 leading-relaxed font-semibold">
          Upload foliage imagery. The vision engine aligns symptomatic markers against verified agricultural vectors via Groq AI + ICAR knowledge base.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column - Diagnostic Input */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Image Source (JPG/PNG/WebP)</h3>
            </div>

            {/* Crop hint input */}
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                Crop Hint (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. wheat, rice, tomato..."
                value={cropHint}
                onChange={(e) => setCropHint(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            <div className={`relative h-56 border-2 rounded-xl border-dashed ${previewUrl ? 'border-transparent' : 'border-gray-300 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-400'} transition-all flex items-center justify-center mb-6 group`}>
              {!previewUrl ? (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-6">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Upload size={28} className="text-indigo-600" />
                  </div>
                  <span className="text-base font-bold text-gray-900 mb-1">Select visual asset</span>
                  <span className="text-sm font-semibold text-gray-600">Drag & drop · Max 10MB</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/webp"
                  />
                </label>
              ) : (
                <div className="w-full h-full relative group rounded-xl overflow-hidden bg-gray-100 shadow-inner">
                  <img src={previewUrl} alt="Selected Leaf" className="w-full h-full object-cover filter brightness-90" />
                  <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/70 transition-all flex items-center justify-center">
                    <button 
                      className="opacity-0 group-hover:opacity-100 bg-white text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-lg font-bold tracking-wide text-sm transition-all shadow-md flex items-center gap-2"
                      onClick={clearImage}
                    >
                      <X size={16} strokeWidth={3} /> Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Run diagnosis button */}
            {selectedFile && !isAnalyzing && (
              <button
                onClick={() => runDiagnosis(selectedFile)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 mb-5"
              >
                <Search size={18} /> Analyze Image
              </button>
            )}

            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 ml-1">Run Test Vectors</h3>
            <div className="flex flex-col gap-2">
              {diseases.map((d) => (
                <button 
                  key={d.id} 
                  className="w-full text-left bg-white border border-gray-200 shadow-sm rounded-lg px-5 py-3 hover:bg-gray-50 transition-all focus:outline-none flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleTestVector(d.name)}
                  disabled={isAnalyzing}
                >
                  <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">{d.name}</span>
                  <ArrowRight size={16} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Assessment Output */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-8 min-h-[600px] flex flex-col relative">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">Analysis Matrix</h3>
              <span className="text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 px-3 py-1 rounded-full shadow-sm">Live Engine</span>
            </div>

            <div className="flex-1">
              <AnimatePresence mode="wait">
                {!result && !isAnalyzing && !error && (
                  <motion.div 
                    key="empty"
                    className="w-full h-full flex flex-col items-center justify-center text-center mt-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <Search size={32} className="text-gray-500" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Awaiting Input Vector</h3>
                    <p className="text-sm text-gray-600 max-w-sm font-semibold leading-relaxed">Upload imagery or select a test vector to initiate pathology alignment.</p>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    key="error"
                    className="w-full h-full flex flex-col items-center justify-center text-center mt-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-20 h-20 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mb-6">
                      <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Analysis Failed</h3>
                    <p className="text-sm text-red-600 max-w-sm font-semibold leading-relaxed">{error}</p>
                  </motion.div>
                )}

                {isAnalyzing && (
                  <motion.div 
                    key="analyzing"
                    className="w-full h-full flex flex-col items-center justify-center text-center mt-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin mb-6 shadow-sm"></div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 tracking-wide">Processing Visuals</h3>
                    <p className="text-sm text-gray-600 max-w-xs font-semibold">Groq vision model + ICAR RAG pipeline running...</p>
                  </motion.div>
                )}

                {result && (
                  <motion.div 
                    key="result"
                    className="w-full h-full flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                      <div>
                        <div className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-sm shadow-sm inline-block mb-3 border ${getSeverityColor(result.confidence)}`}>
                          {result.disease_name === 'Healthy Plant' ? 'Healthy Plant' : 'Identified Pathogen'}
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{result.disease_name}</h2>
                        {result.crop && result.crop !== 'Unknown crop' && (
                          <p className="text-sm text-gray-500 font-semibold mt-1">Crop: {result.crop}</p>
                        )}
                      </div>
                      <div className="text-right bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="text-4xl font-black text-indigo-600">{result.confidence}%</div>
                        <div className="text-[11px] font-bold uppercase text-gray-600 tracking-widest mt-1">Confidence</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 mb-10">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-900 bg-gray-100 px-4 py-2 rounded-lg inline-block self-start border border-gray-200 shadow-sm">
                        Clinical Protocol Recommendations
                      </h3>
                      
                      <div className="flex flex-col gap-3 mt-2">
                        {result.treatment_steps.map((step, i) => (
                          <div key={i} className="flex gap-4 p-4 md:p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                              {i + 1}
                            </div>
                            <span className="text-[15px] text-gray-900 font-semibold leading-relaxed pt-1">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {result.sources && result.sources.length > 0 && (
                      <div className="mt-auto pt-6 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {result.sources.map((src, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                              <Database size={12} className="text-indigo-600" />
                              {src}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Diagnose;
