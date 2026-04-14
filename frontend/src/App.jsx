import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home as HomeIcon, 
  MessageSquare, 
  Search, 
  FileText, 
  MapPin, 
  Zap, 
  Settings,
  CloudRain,
  Wind
} from 'lucide-react';

import HomeContent from './pages/Home';
import ChatInterface from './pages/Chat';
import Diagnose from './pages/Diagnose';
import Schemes from './pages/Schemes';
import Mandi from './pages/Mandi';
import Advisor from './pages/Advisor';

const Sidebar = () => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  useEffect(() => {
    // Default coordinates: Sonipat
    const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
    fetch(`${API_BASE}/weather?lat=28.9948&lon=77.0151`)
      .then(res => res.json())
      .then(data => {
        setWeather({
          temp: data.temperature,
          rain: data.rain_3day_mm,
          wind: data.wind_speed,
          desc: data.description,
          advice: data.sowing_advice
        });
        setLoadingWeather(false);
      })
      .catch(err => {
        console.error('Weather fetch error:', err);
        setLoadingWeather(false);
      });
  }, []);

  const menuItems = [
    { icon: HomeIcon, label: t('nav.overview'), path: '/' },
    { icon: MessageSquare, label: t('nav.advisory_chat'), path: '/chat' },
    { icon: Search, label: t('nav.pathology'), path: '/diagnose' },
    { icon: FileText, label: t('nav.schemes'), path: '/schemes' },
    { icon: MapPin, label: t('nav.markets'), path: '/mandi' },
    { icon: Zap, label: t('nav.planning'), path: '/advisor' },
  ];

  return (
    <div className="w-[260px] bg-gray-100 border-r border-gray-200 h-screen flex flex-col pt-8 pb-6 sticky top-0 z-10">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 mb-10 px-6">
        <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl select-none shadow-md">
          F
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">FarmSathi</h1>
          <span className="text-xs text-indigo-600 font-semibold tracking-wide uppercase">Intelligence</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar px-3">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `
              group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
              ${isActive 
                ? 'bg-indigo-100 text-indigo-700 font-medium border-l-4 border-indigo-600 pl-2 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 font-medium border-l-4 border-transparent pl-2'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Deep Weather Block */}
      <div className="mt-6 pt-6 border-t border-gray-200 px-6">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t('nav.live_conditions')}</h4>
        <div className="flex flex-col gap-3 text-gray-900 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          {loadingWeather ? (
             <div className="animate-pulse flex flex-col gap-2">
               <div className="h-8 bg-gray-200 rounded w-1/2"></div>
               <div className="h-4 bg-gray-200 rounded w-3/4"></div>
               <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
             </div>
          ) : weather ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{weather.temp}°</span>
                <span className="text-sm font-semibold text-gray-600">{t('nav.sonipat')}</span>
              </div>
              <div className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700 border-l-2 border-indigo-400 pl-3">
                <div className="flex items-center gap-2">
                  <CloudRain size={14} className="text-indigo-600" /> {t('nav.expected_rain', { rain: weather.rain })}
                </div>
                <div className="flex items-center gap-2">
                  <Wind size={14} className="text-indigo-600" /> {weather.wind} km/h
                </div>
              </div>
              <p className="text-[11px] text-gray-500 font-semibold leading-relaxed px-1 py-1 bg-gray-50 rounded mt-1">
                {weather.advice}
              </p>
            </>
          ) : (
            <span className="text-sm text-red-500">{t('nav.failed_weather')}</span>
          )}
        </div>
      </div>
    </div>
  );
};

const Topbar = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return t('topbar.titles.overview');
      case '/chat': return t('topbar.titles.chat');
      case '/diagnose': return t('topbar.titles.diagnose');
      case '/schemes': return t('topbar.titles.schemes');
      case '/mandi': return t('topbar.titles.mandi');
      case '/advisor': return t('topbar.titles.advisor');
      default: return t('topbar.titles.dashboard');
    }
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 py-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">{getPageTitle()}</h2>
        <span className="h-5 w-px bg-gray-300"></span>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span>
          {t('topbar.season')}
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-sm">
          <button 
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${i18n.language.startsWith('en') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            EN
          </button>
          <button 
            onClick={() => changeLanguage('hi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${i18n.language.startsWith('hi') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            HI
          </button>
        </div>
        
        <button className="text-gray-600 hover:text-gray-900 transition-colors bg-white hover:bg-gray-50 p-2 rounded-lg border border-gray-200 shadow-sm">
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};

function App() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        {/* Main content layer, floats over gray-50 background */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="px-8 py-10 md:px-14 md:py-12 mx-auto max-w-6xl">
            <Routes>
              <Route path="/" element={<HomeContent />} />
              <Route path="/chat" element={<ChatInterface />} />
              <Route path="/diagnose" element={<Diagnose />} />
              <Route path="/schemes" element={<Schemes />} />
              <Route path="/mandi" element={<Mandi />} />
              <Route path="/advisor" element={<Advisor />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
