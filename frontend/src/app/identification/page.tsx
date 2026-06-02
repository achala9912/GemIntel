'use client';

import FeatureLayout from '@/components/FeatureLayout';
import StatCard from '@/components/StatCard';

export default function FeatureIdentification() {
  return (
    <FeatureLayout
      title="Feature Identification"
      description="Upload a clear image of your gemstone. Our AI will analyze the visual characteristics to determine the 4Cs: Carat (estimated), Cut, Color, and Clarity."
      buttonText="Identify Features"
      mockDelay={2500}
    >
      <div className="p-8 border-b border-white/5">
        <h2 className="text-xl font-bold">AI Vision Analysis Report</h2>
        <p className="text-gray-400 text-sm mt-2">
          Confidence Score: <span className="text-emerald-400 font-semibold">94%</span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 p-8">
        <StatCard 
          label="Estimated Carat" 
          value="1.25 ct" 
          description="Visual weight estimation" 
          delayClass="delay-100" 
        />
        <StatCard 
          label="Cut Grade" 
          value="Excellent" 
          description="Symmetry and proportions" 
          delayClass="delay-200" 
        />
        <StatCard 
          label="Color Grade" 
          value="Vivid Blue" 
          description="Hue, tone, and saturation" 
          delayClass="delay-300" 
        />
        <StatCard 
          label="Clarity" 
          value="VVS1" 
          description="Very Very Slightly Included" 
          delayClass="delay-300" 
        />
      </div>
    </FeatureLayout>
  );
}
