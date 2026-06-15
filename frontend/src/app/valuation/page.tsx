'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown } from 'lucide-react';
import {
  fetchFactorOptions,
  predictPrice,
  type FactorOptions,
  type PredictionResult,
} from '@/services/valuesApi';

const GEM_COLORS: Record<string, string> = {
  'Ceylon Blue Sapphire': '#3b82f6',
  'Ceylon Blue Spinel': '#ec4899',
  'Ceylon Blue Topaz': '#eab308',
};

interface CustomSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  dotColors?: Record<string, string>;
}

function CustomSelect({
  label,
  value,
  options,
  onChange,
  isOpen,
  onToggle,
  dotColors,
}: CustomSelectProps) {
  return (
    <div className="relative">
      <label className="block text-xs uppercase tracking-wide opacity-50 mb-2 font-semibold text-gray-300">
        {label}
      </label>
      <button
        type="button"
        onClick={onToggle}
        className="w-full bg-[rgba(0,0,0,0.4)] border border-white/10 rounded-xl px-4 py-3.5 text-sm flex justify-between items-center text-left transition hover:bg-white/[0.02] active:scale-[0.99] cursor-pointer"
      >
        {value ? (
          <div className="flex items-center gap-2.5 min-w-0">
            {dotColors && dotColors[value] && (
              <span
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] shrink-0"
                style={{
                  backgroundColor: dotColors[value],
                  color: dotColors[value],
                }}
              />
            )}
            <span className="font-semibold text-white truncate">{value}</span>
          </div>
        ) : (
          <span className="text-white/40 font-medium truncate">Select...</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-[#0a0c1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-fade-in max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                onToggle();
              }}
              className={`w-full px-4 py-3 text-left hover:bg-white/5 transition flex items-center justify-between group cursor-pointer ${
                value === opt ? 'bg-white/[0.03]' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {dotColors && dotColors[opt] && (
                  <span
                    className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-110 shrink-0"
                    style={{ backgroundColor: dotColors[opt] }}
                  />
                )}
                <span className="font-semibold text-white text-sm truncate">
                  {opt}
                </span>
              </div>
              {value === opt && (
                <svg
                  className="w-4 h-4 text-blue-400 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface NumericInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min?: number;
  max?: number;
  unit: string;
  precision?: number;
}

function NumericInput({
  label,
  value,
  onChange,
  step,
  min,
  max,
  unit,
  precision = 2,
}: NumericInputProps) {
  const handleDecrement = () => {
    let newVal = +(value - step).toFixed(precision);
    if (min !== undefined) newVal = Math.max(min, newVal);
    onChange(newVal);
  };

  const handleIncrement = () => {
    let newVal = +(value + step).toFixed(precision);
    if (max !== undefined) newVal = Math.min(max, newVal);
    onChange(newVal);
  };

  return (
    <div>
      <label className="block text-xs uppercase tracking-wide opacity-50 mb-2 font-semibold text-gray-300">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          className="w-10 h-10 shrink-0 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 active:scale-95 transition flex items-center justify-center text-lg text-white/80 cursor-pointer"
        >
          −
        </button>
        <input
          type="number"
          step={step}
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) {
              onChange(val);
            }
          }}
          onWheel={(e) => e.currentTarget.blur()}
          className="flex-1 min-w-0 text-center bg-[rgba(0,0,0,0.4)] border border-white/10 rounded-lg px-3 py-2.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white focus:outline-none focus:border-violet-500/50 font-semibold text-sm"
        />
        <span className="text-xs opacity-50 px-2 py-1 border border-white/10 rounded shrink-0 bg-white/[0.02] font-semibold">
          {unit}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          className="w-10 h-10 shrink-0 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 active:scale-95 transition flex items-center justify-center text-lg text-white/80 cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function Valuation() {
  const [factorOptions, setFactorOptions] = useState<FactorOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // Gem Factors Form State
  const [gemFactors, setGemFactors] = useState({
    weight_ct: 1.5,
    gem_type: 'Ceylon Blue Sapphire',
    colour_intensity: 'Royal Blue',
    clarity: 'VVS1',
    shape: 'Cushion',
    cut: 'Mixed Brilliant Cut',
    enhancement: 'Unheated',
  });

  // Economic Factors Form State
  const [economicFactors, setEconomicFactors] = useState({
    ccpi: 95.0,
    ccpi_yoy: 4.5,
    slfr: 8.5,
    gold_lkr: 206000,
    gdp_growth: 2.5,
    exchange_rate: 155.0,
  });

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch factor options on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await fetchFactorOptions();
        setFactorOptions(options);
      } catch (error) {
        console.error('Error fetching factor options:', error);
        toast.error('Failed to load dropdown options');
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  const handleGemFactorChange = (field: keyof typeof gemFactors, value: string | number) => {
    setGemFactors((prev) => ({ ...prev, [field]: value }));
  };

  const handleEconomicFactorChange = (field: keyof typeof economicFactors, value: number) => {
    setEconomicFactors((prev) => ({ ...prev, [field]: value }));
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const data = await predictPrice(gemFactors, economicFactors);
      setResult(data);
      setShowResult(true);
      toast.success('Price prediction successful!');
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error(error instanceof Error ? error.message : 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const handleReset = () => {
    setShowResult(false);
    setResult(null);
    setGemFactors({
      weight_ct: 1.5,
      gem_type: 'Ceylon Blue Sapphire',
      colour_intensity: 'Royal Blue',
      clarity: 'VVS1',
      shape: 'Cushion',
      cut: 'Mixed Brilliant Cut',
      enhancement: 'Unheated',
    });
    setEconomicFactors({
      ccpi: 95.0,
      ccpi_yoy: 4.5,
      slfr: 8.5,
      gold_lkr: 206000,
      gdp_growth: 2.5,
      exchange_rate: 155.0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-gray-400">Loading valuation form...</div>
      </div>
    );
  }

  // Fallback options
  const gemTypeOptions = factorOptions?.gem_factors.gem_type || [
    'Ceylon Blue Sapphire',
    'Ceylon Blue Spinel',
    'Ceylon Blue Topaz',
  ];
  const colourOptions = factorOptions?.gem_factors.colour_intensity || [
    'Intense',
    'Royal Blue',
    'Vivid',
  ];
  const clarityOptions = factorOptions?.gem_factors.clarity || [
    'IF',
    'VS1',
    'VS2',
    'VVS1',
    'VVS2',
  ];
  const shapeOptions = factorOptions?.gem_factors.shape || [
    'Cushion',
    'Emerald Cut',
    'Heart',
    'Marquise',
    'Oval',
    'Pear',
    'Radiant',
    'Round',
  ];
  const cutOptions = factorOptions?.gem_factors.cut || [
    'Emerald Cut',
    'Mixed Brilliant Cut',
    'Modified Brilliant Cut',
    'Radiant Cut',
    'Step Cut',
  ];
  const enhancementOptions = factorOptions?.gem_factors.enhancement || [
    'Unheated',
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-center mb-2 leading-tight px-2">
            Dynamic Gem Valuation &{' '}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Price Estimator
            </span>
          </h1>
          <p className="text-center text-sm sm:text-base opacity-60 px-4">
            Get market value estimations by combining visual characterization with real-time global trade market data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-8" ref={formRef}>
            {!showResult ? (
              <>
                {/* Gem Factors */}
                <div className="bg-[rgba(255,255,255,0.04)] border border-white/10 rounded-2xl p-6 space-y-5">
                  <h2 className="text-lg font-medium text-cyan-400">
                    <span className="opacity-50 mr-2">01</span> Gem Characteristics
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 mb-2">
                      <NumericInput
                        label="Weight (carats)"
                        value={gemFactors.weight_ct}
                        onChange={(val) => handleGemFactorChange('weight_ct', val)}
                        step={0.1}
                        min={factorOptions?.gem_factors.weight_ct.min || 0.1}
                        max={factorOptions?.gem_factors.weight_ct.max || 5.0}
                        unit="ct"
                        precision={2}
                      />
                    </div>

                    <CustomSelect
                      label="Gem Type"
                      value={gemFactors.gem_type}
                      options={gemTypeOptions}
                      onChange={(val) => handleGemFactorChange('gem_type', val)}
                      isOpen={openDropdown === 'gem_type'}
                      onToggle={() =>
                        setOpenDropdown(openDropdown === 'gem_type' ? null : 'gem_type')
                      }
                      dotColors={GEM_COLORS}
                    />

                    <CustomSelect
                      label="Colour Intensity"
                      value={gemFactors.colour_intensity}
                      options={colourOptions}
                      onChange={(val) => handleGemFactorChange('colour_intensity', val)}
                      isOpen={openDropdown === 'colour_intensity'}
                      onToggle={() =>
                        setOpenDropdown(
                          openDropdown === 'colour_intensity' ? null : 'colour_intensity'
                        )
                      }
                    />

                    <CustomSelect
                      label="Clarity"
                      value={gemFactors.clarity}
                      options={clarityOptions}
                      onChange={(val) => handleGemFactorChange('clarity', val)}
                      isOpen={openDropdown === 'clarity'}
                      onToggle={() =>
                        setOpenDropdown(openDropdown === 'clarity' ? null : 'clarity')
                      }
                    />

                    <CustomSelect
                      label="Shape"
                      value={gemFactors.shape}
                      options={shapeOptions}
                      onChange={(val) => handleGemFactorChange('shape', val)}
                      isOpen={openDropdown === 'shape'}
                      onToggle={() =>
                        setOpenDropdown(openDropdown === 'shape' ? null : 'shape')
                      }
                    />

                    <CustomSelect
                      label="Cut"
                      value={gemFactors.cut}
                      options={cutOptions}
                      onChange={(val) => handleGemFactorChange('cut', val)}
                      isOpen={openDropdown === 'cut'}
                      onToggle={() =>
                        setOpenDropdown(openDropdown === 'cut' ? null : 'cut')
                      }
                    />

                    <CustomSelect
                      label="Enhancement"
                      value={gemFactors.enhancement}
                      options={enhancementOptions}
                      onChange={(val) => handleGemFactorChange('enhancement', val)}
                      isOpen={openDropdown === 'enhancement'}
                      onToggle={() =>
                        setOpenDropdown(openDropdown === 'enhancement' ? null : 'enhancement')
                      }
                    />
                  </div>
                </div>

                {/* Economic Factors */}
                <div className="bg-[rgba(255,255,255,0.04)] border border-white/10 rounded-2xl p-6 space-y-5">
                  <h2 className="text-lg font-medium text-violet-400">
                    <span className="opacity-50 mr-2">02</span> Economic Factors
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NumericInput
                      label="CCPI (Consumer Cost Price Index)"
                      value={economicFactors.ccpi}
                      onChange={(val) => handleEconomicFactorChange('ccpi', val)}
                      step={0.5}
                      min={80}
                      max={120}
                      unit="idx"
                      precision={1}
                    />

                    <NumericInput
                      label="CCPI YoY (%)"
                      value={economicFactors.ccpi_yoy}
                      onChange={(val) => handleEconomicFactorChange('ccpi_yoy', val)}
                      step={0.1}
                      min={0}
                      max={15}
                      unit="%"
                      precision={1}
                    />

                    <NumericInput
                      label="SLFR (Sri Lanka Floating Rate) (%)"
                      value={economicFactors.slfr}
                      onChange={(val) => handleEconomicFactorChange('slfr', val)}
                      step={0.1}
                      min={5}
                      max={15}
                      unit="%"
                      precision={1}
                    />

                    <NumericInput
                      label="Gold Price (LKR)"
                      value={economicFactors.gold_lkr}
                      onChange={(val) => handleEconomicFactorChange('gold_lkr', val)}
                      step={1000}
                      min={180000}
                      max={250000}
                      unit="LKR"
                      precision={0}
                    />

                    <NumericInput
                      label="GDP Growth (%)"
                      value={economicFactors.gdp_growth}
                      onChange={(val) => handleEconomicFactorChange('gdp_growth', val)}
                      step={0.1}
                      min={-5}
                      max={10}
                      unit="%"
                      precision={1}
                    />

                    <NumericInput
                      label="Exchange Rate (LKR/USD)"
                      value={economicFactors.exchange_rate}
                      onChange={(val) => handleEconomicFactorChange('exchange_rate', val)}
                      step={0.5}
                      min={140}
                      max={170}
                      unit="LKR"
                      precision={2}
                    />
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={handlePredict}
                  disabled={predicting}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-90 disabled:opacity-50 transition rounded-xl font-semibold text-sm active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  {predicting ? 'Predicting...' : 'Estimate Value'}
                </button>
              </>
            ) : (
              /* Results Section */
              <div className="bg-[rgba(255,255,255,0.04)] border border-white/10 rounded-2xl p-6 space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-cyan-400">Valuation Results</h2>

                {/* Main Price */}
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Estimated Market Value</p>
                  <div className="text-6xl font-bold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                    LKR {result?.predicted_price_lkr.toLocaleString()}
                  </div>
              
                </div>

                {/* Confidence Badge */}
                <div className="text-center">
                  <div className="inline-block px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-semibold">
                    AI Confidence: {((result?.confidence || 0) * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Model Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/10">
                    <p className="text-sm text-gray-400 mb-2 font-medium">XGBoost Prediction</p>
                    <p className="text-2xl font-bold text-violet-400">
                      LKR {result?.breakdown.xgboost.predicted_price_lkr.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] rounded-xl p-4 border border-white/10">
                    <p className="text-sm text-gray-400 mb-2 font-medium">LightGBM Prediction</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      LKR {result?.breakdown.lightgbm.predicted_price_lkr.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold rounded-xl transition cursor-pointer active:scale-[0.99]"
                >
                  New Valuation
                </button>
              </div>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[rgba(255,255,255,0.04)] border border-white/10 rounded-2xl p-6 sticky top-8 space-y-4 text-sm text-gray-400">
              <h3 className="text-xl font-bold text-cyan-400">About This Tool</h3>
              <p>
                This valuation engine uses an ensemble of <strong>XGBoost</strong> and{' '}
                <strong>LightGBM</strong> models trained on historical gem pricing data.
              </p>
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Models Used:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>XGBoost Regressor</li>
                  <li>LightGBM Regressor</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Features Analyzed:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Gem characteristics (weight, type, clarity, etc.)</li>
                  <li>Economic indicators (CCPI, gold price, GDP, etc.)</li>
                </ul>
              </div>
            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
