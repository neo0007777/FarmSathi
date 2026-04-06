import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  MapPin, 
  CloudRain,
  MessageSquare,
  FileText,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-16 pb-16 font-inter">
      {/* Deep Header Section */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-3 py-1 rounded-full border border-indigo-200 shadow-sm">Platform v2</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
          Agricultural intelligence, <br className="hidden md:block"/>
          designed for output.
        </h1>
        
        <p className="text-lg text-gray-600 leading-relaxed font-medium max-w-2xl mt-2">
          Deploy deep-learning diagnostic models, consult with AI agronomists, and access state subsidies through a unified, high-contrast dashboard.
        </p>
      </section>

      {/* Main Structural Grid */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        
        {/* Left Column - Primary Feature */}
        <div className="md:col-span-12 lg:col-span-7 flex flex-col gap-10">
          <motion.div 
            className="group relative bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden min-h-[460px] flex flex-col justify-between"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Deep dark HERO section */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white p-10 md:p-14 flex-1 rounded-t-xl relative overflow-hidden shadow-inner">
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-800 rounded-xl mb-6 shadow-md border border-indigo-600">
                  <Search size={24} className="text-white" />
                </div>
                <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Diagnostic <br/>Pathology Engine</h2>
                <p className="text-lg text-indigo-100 leading-relaxed max-w-md font-medium">
                  Upload raw imagery of symptomatic foliage. Our computer vision models align pathology with 50,000+ verifiable agricultural vectors.
                </p>
              </div>
              
              {/* Graphic Element */}
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                <div className="w-80 h-80 border-[32px] border-white rounded-full blur-2xl"></div>
              </div>
            </div>

            {/* Light action section */}
            <div className="bg-white p-6 md:px-10 md:py-8 border-t border-gray-200 rounded-b-xl flex flex-col md:flex-row justify-between md:items-center bg-gray-50/50 gap-4">
              <span className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                Engine Status: <span className="text-emerald-600 font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ready</span>
              </span>
              <button 
                className="bg-white text-indigo-700 border border-gray-200 hover:bg-gray-100 px-6 py-3 rounded-lg font-bold tracking-wide shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-center gap-3"
                onClick={() => navigate('/diagnose')}
              >
                Scan Crop <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>

          <div className="editorial-card px-8 py-6 flex flex-col md:flex-row gap-6 md:items-center bg-gradient-to-br from-white to-gray-50 border-gray-200">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 shadow-sm border border-indigo-200">
              <CloudRain size={24} className="text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                Meteorological Advisory
                <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded uppercase font-bold border border-red-200">Alert</span>
              </h4>
              <p className="text-base text-gray-700 leading-relaxed font-medium">
                <strong className="text-gray-900">18mm accumulation</strong> expected. Recommendation: Delay NPK fertilizer broadcasting by 48 hours to mitigate runoff risk.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Secondary Features & Stats */}
        <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="editorial-card p-8 flex flex-col justify-center items-center text-center shadow-sm">
              <div className="text-5xl font-extrabold tracking-tight text-gray-900 mb-2">50<span className="text-indigo-600">K</span></div>
              <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Farmers Active</div>
            </div>
            <div className="editorial-card p-8 flex flex-col justify-center items-center text-center shadow-sm">
              <div className="text-5xl font-extrabold tracking-tight text-gray-900 mb-2">124</div>
              <div className="text-sm font-bold text-gray-600 uppercase tracking-wide">Tracked Mandis</div>
            </div>
          </div>

          <div 
            className="editorial-card p-8 group cursor-pointer relative overflow-hidden"
            onClick={() => navigate('/chat')}
          >
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-6 shadow-inner border border-indigo-200">
              <MessageSquare size={24} className="text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">AI Advisory Protocol</h3>
            <p className="text-base text-gray-600 mb-6 leading-relaxed font-medium">
              Direct access to RAG-augmented models cross-referencing ICAR frameworks with localized soil matrices.
            </p>
            <div className="flex items-center text-sm font-bold text-indigo-600 group-hover:gap-2 transition-all">
              Initiate Dialog <ArrowRight size={16} className="ml-1" />
            </div>
          </div>

          <div 
            className="editorial-card p-8 group cursor-pointer"
            onClick={() => navigate('/schemes')}
          >
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-6 shadow-inner border border-gray-200">
              <FileText size={24} className="text-gray-700" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">State Frameworks</h3>
            <p className="text-base text-gray-600 mb-6 leading-relaxed font-medium">
              Identify accessible subsidies, insurance protocols (PMFBY), and capital allocation pathways.
            </p>
            <div className="flex items-center text-sm font-bold text-gray-900 group-hover:gap-2 transition-all">
              View Directory <ArrowRight size={16} className="ml-1" />
            </div>
          </div>
        </div>

      </section>
    </div>
  );
};

export default Home;
