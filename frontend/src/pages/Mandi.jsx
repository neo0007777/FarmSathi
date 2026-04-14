import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter
} from 'lucide-react';

const Mandi = () => {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [mandiData, setMandiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mandi?state=Haryana&limit=100')
      .then(res => res.json())
      .then(data => {
        const mapped = data.prices.map((p, i) => ({
          id: i,
          crop: p.crop,
          mandi: `${p.mandi} / ${p.state}`,
          price: (p.modal_price || 0).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN') + '.00',
          change: '--',
          isUp: true,
          arrival: 'N/A',
          date: p.date || 'Today',
          trend: [p.min_price || 0, p.modal_price || 0, p.max_price || 0]
        }));
        setMandiData(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error('Mandi fetch error', err);
        setLoading(false);
      });
  }, [i18n.language]);

  const filteredData = mandiData.filter(d => 
    d.crop.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.mandi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const Sparkline = ({ data, color }) => {
    const uniqueVals = [...new Set(data)];
    const min = Math.min(...data) - (uniqueVals.length === 1 ? 1 : 0);
    const max = Math.max(...data) + (uniqueVals.length === 1 ? 1 : 0);
    const height = 28;
    const width = 80;
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / (max - min)) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible drop-shadow-sm">
        <polyline 
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col gap-8 pb-16 font-inter">
      {/* High Contrast Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-600 rounded-full blur-[100px] opacity-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col max-w-2xl relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
              {t('mandi.header.subtitle')}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {t('mandi.header.live')}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
            {t('mandi.header.title')}
          </h1>
        </div>
        
        <div className="flex gap-4 relative z-10 w-full md:w-auto">
          <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-inner w-full md:w-72">
            <Search size={16} className="text-gray-400 mr-3" />
            <input 
              type="text" 
              placeholder={t('mandi.header.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none text-[14px] font-bold text-gray-900 placeholder-gray-500 focus:outline-none w-full"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-300 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm">
            <Filter size={16} /> {t('mandi.header.refine')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-indigo-600 animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Deep Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col justify-between group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="text-[11px] font-bold uppercase tracking-widest text-gray-600 bg-gray-50 px-3 py-1 rounded-md border border-gray-200">
                  {t('mandi.stats.total_markets')}
                </div>
                <TrendingUp size={20} className="text-indigo-500" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight text-gray-900 mb-2">{mandiData.length}</div>
                <div className="flex items-center gap-2 text-[13px] font-bold text-gray-600 bg-gray-50 px-3 py-1 border border-gray-200 rounded-full w-fit">
                  {t('mandi.stats.verified_data')}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col justify-between group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="text-[11px] font-bold uppercase tracking-widest text-gray-600 bg-gray-50 px-3 py-1 rounded-md border border-gray-200">
                  {t('mandi.stats.active_crop')}
                </div>
                <TrendingUp size={20} className="text-emerald-500" strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight text-gray-900 mb-2">{mandiData.length > 0 ? mandiData[0].crop : '--'}</div>
                <div className="flex items-center gap-2 text-[13px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-100">
                  {t('mandi.stats.highest_volume')}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 text-white rounded-xl shadow-lg p-8 flex flex-col justify-between border border-gray-800 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500 blur-[80px] opacity-40 pointer-events-none rounded-full"></div>
              
              <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-6 bg-gray-800 border border-gray-700 px-3 py-1 rounded-md w-fit">
                {t('mandi.stats.index_overview')}
              </div>
              <div className="flex flex-col gap-5 relative z-10">
                <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{t('mandi.stats.active_entities')}</span>
                  <span className="text-2xl font-black text-white bg-gray-800 px-3 py-1 rounded">124</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Agmarknet</span>
                  <span className="text-base font-bold text-emerald-400">{t('mandi.stats.connected')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Shadowed Table */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-200">
                    <th className="py-5 px-6 text-[11px] font-bold text-gray-600 uppercase tracking-widest">{t('mandi.table.commodity')}</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-gray-600 uppercase tracking-widest">{t('mandi.table.exchange')}</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-gray-600 uppercase tracking-widest text-right">{t('mandi.table.quote')}</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-gray-600 uppercase tracking-widest text-center">{t('mandi.table.spread')}</th>
                    <th className="py-5 px-6 text-[11px] font-bold text-gray-600 uppercase tracking-widest">{t('mandi.table.price_gap')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredData.map((row) => (
                    <motion.tr 
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-indigo-50/40 group transition-colors"
                    >
                      <td className="py-6 px-6">
                        <div className="font-extrabold text-gray-900 truncate text-[15px]">{row.crop}</div>
                        <div className="text-[11px] text-gray-400 font-bold mt-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 w-fit uppercase tracking-wider">
                          {row.date}
                        </div>
                      </td>
                      <td className="py-6 px-6 font-bold text-[13px] text-gray-600">
                        {row.mandi}
                      </td>
                      <td className="py-6 px-6 text-right">
                        <div className="font-black text-[16px] text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                          {row.price}
                        </div>
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex items-center justify-center h-full opacity-80 group-hover:opacity-100 transition-opacity">
                          <Sparkline 
                            data={row.trend} 
                            color={'#10B981'} 
                          />
                        </div>
                      </td>
                      <td className="py-6 px-6 text-left">
                        <span className={`inline-flex items-center justify-center gap-1 font-bold text-[13px] px-3 py-1.5 rounded-lg border bg-gray-50 text-gray-700 border-gray-200`}>
                          {t('mandi.table.spread_text', { spread: (row.trend[2] - row.trend[0]) })}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Mandi;
