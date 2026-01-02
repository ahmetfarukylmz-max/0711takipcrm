import React from 'react';
import SalesIntelligence from '../dashboard/SalesIntelligence';
import { LightbulbIcon } from '../icons';

const SalesIntelligencePage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <LightbulbIcon className="w-8 h-8 text-amber-600 dark:text-amber-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Satış Zekası
          </h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">
            Yapay zeka destekli performans tahminleri, risk analizleri ve akıllı öneriler.
          </p>
        </div>
      </div>

      <SalesIntelligence />
    </div>
  );
};

export default SalesIntelligencePage;
