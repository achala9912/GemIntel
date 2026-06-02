'use client';

import FeatureLayout from '@/components/FeatureLayout';
import StatCard from '@/components/StatCard';

export default function Valuation() {
  return (
    <FeatureLayout
      title="Dynamic Valuation Engine"
      description="Get near-instantaneous market value estimations by combining visual characterization models with real-time global trade market data."
      buttonText="Estimate Value"
      mockDelay={2200}
    >
      <div className="p-12 text-center flex flex-col items-center justify-center">
        <h2 className="text-lg text-gray-400 font-semibold uppercase tracking-wider">
          Estimated Market Value
        </h2>
        <div className="text-5xl md:text-6xl font-extrabold my-4 font-sans bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent animate-fade-in">
          $4,250 - $4,800
        </div>
        <p className="mt-1 text-sm text-gray-400">
          Per Carat Average: ~$3,620
        </p>
        <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold mt-4">
          AI Confidence Level: High
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 pt-0">
        <StatCard 
          label="Market Trend (30d)" 
          value="+2.4%" 
          valueColor="#10b981"
          description="High demand for this color profile" 
        />
        <StatCard 
          label="Liquidity Rating" 
          value="A-" 
          valueColor="white"
          description="Highly tradable asset" 
        />
        <StatCard 
          label="Retail Value Est." 
          value="$8,500" 
          valueColor="white"
          description="Typical B2C pricing tier" 
        />
      </div>
      
      <div className="p-8 pt-0 text-center">
        <p className="text-xs text-gray-500 leading-normal max-w-lg mx-auto">
          * Disclaimer: Values are generated using algorithmic modeling based on visual markers and
          historical trade data. Not to be used as a certified appraisal for insurance purposes.
        </p>
      </div>
    </FeatureLayout>
  );
}
