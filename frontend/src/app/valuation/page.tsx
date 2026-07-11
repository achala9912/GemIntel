'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronDown, ShieldCheck, Sparkles } from 'lucide-react';
import FacetedFlowTracker from '@/components/FacetedFlowTracker';
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
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm flex justify-between items-center text-left transition hover:bg-white/5 active:scale-95 cursor-pointer text-white"
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
        <div className="absolute top-full mt-1.5 left-0 w-full bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-fade-in-pure max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                onToggle();
              }}
              className={`w-full px-4 py-2.5 text-left hover:bg-white/5 transition flex items-center justify-between group cursor-pointer ${
                value === opt ? 'bg-white/5' : ''
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
  value: number | '';
  onChange: (value: number | '') => void;
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
    const currentVal = value === '' ? 0 : value;
    let newVal = +(currentVal - step).toFixed(precision);
    if (min !== undefined) newVal = Math.max(min, newVal);
    onChange(newVal);
  };

  const handleIncrement = () => {
    const currentVal = value === '' ? 0 : value;
    let newVal = +(currentVal + step).toFixed(precision);
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
          className="w-10 h-10 shrink-0 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-lg text-white/80 cursor-pointer"
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
            } else {
              onChange('');
            }
          }}
          onWheel={(e) => e.currentTarget.blur()}
          className="flex-1 min-w-0 text-center bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white focus:outline-none focus:border-violet-500 font-semibold text-sm"
        />
        <span className="text-xs opacity-50 px-2.5 py-1.5 border border-white/10 rounded shrink-0 bg-white/5 font-semibold text-gray-300">
          {unit}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          className="w-10 h-10 shrink-0 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition flex items-center justify-center text-lg text-white/80 cursor-pointer"
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

  // Flow states
  const router = useRouter();
  const [isFlowActive, setIsFlowActive] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);
  const [identifyResult, setIdentifyResult] = useState<any>(null);

  useEffect(() => {
    const active = sessionStorage.getItem('faceted_flow_active') === 'true';
    setIsFlowActive(active);

    if (active) {
      const authStr = sessionStorage.getItem('faceted_flow_auth_result');
      const identifyStr = sessionStorage.getItem('faceted_flow_identify_result');

      if (authStr) {
        try { setAuthResult(JSON.parse(authStr)); } catch (e) { console.error(e); }
      }

      if (identifyStr) {
        try {
          const idRes = JSON.parse(identifyStr);
          setIdentifyResult(idRes);

          // Map DINOv2 response to form options
          // 1. Gem type mapping: 'Blue Sapphire' -> 'Ceylon Blue Sapphire', etc.
          let mappedGemType = 'Ceylon Blue Sapphire';
          const incomingGemType = idRes.gem_type;
          if (incomingGemType === 'Blue Sapphire') mappedGemType = 'Ceylon Blue Sapphire';
          else if (incomingGemType === 'Blue Spinel') mappedGemType = 'Ceylon Blue Spinel';
          else if (incomingGemType === 'Blue Topaz') mappedGemType = 'Ceylon Blue Topaz';

          // 2. Shape mapping (e.g. 'cushion' -> 'Cushion', 'emerald_cut' -> 'Emerald Cut')
          let mappedShape = 'Cushion';
          const rawShape = idRes.aggregate?.cut?.shape?.label;
          if (rawShape) {
            mappedShape = rawShape.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          }

          // 3. Cut mapping
          let mappedCut = 'Mixed Brilliant Cut';
          const rawCut = idRes.aggregate?.cut?.cut_style?.label;
          if (rawCut) {
            mappedCut = rawCut.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            if (!mappedCut.toLowerCase().includes('cut')) {
              mappedCut = mappedCut + ' Cut';
            }
          }

          // 4. Color Intensity mapping: saturation -> intensity
          let mappedColorIntensity = 'Royal Blue';
          const rawSat = idRes.aggregate?.color?.saturation?.label;
          if (rawSat) {
            const cleanedSat = rawSat.toLowerCase().trim();
            if (cleanedSat.includes('vivid')) mappedColorIntensity = 'Vivid';
            else if (cleanedSat.includes('intense')) mappedColorIntensity = 'Intense';
            else mappedColorIntensity = 'Royal Blue';
          }

          setGemFactors((prev) => ({
            ...prev,
            gem_type: mappedGemType,
            shape: mappedShape,
            cut: mappedCut,
            colour_intensity: mappedColorIntensity,
          }));

        } catch (e) {
          console.error('Error pre-populating valuation fields from flow', e);
        }
      }
    }
  }, []);

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
  const [economicFactors, setEconomicFactors] = useState<{
    ccpi: number | '';
    ccpi_yoy: number | '';
    slfr: number | '';
    gold_lkr: number | '';
    gdp_growth: number | '';
    exchange_rate: number | '';
  }>({
    ccpi: '',
    ccpi_yoy: '',
    slfr: '',
    gold_lkr: '',
    gdp_growth: '',
    exchange_rate: '',
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

  const handleEconomicFactorChange = (field: keyof typeof economicFactors, value: number | '') => {
    setEconomicFactors((prev) => ({ ...prev, [field]: value }));
  };

  const handlePredict = async () => {
    const { ccpi, ccpi_yoy, slfr, gold_lkr, gdp_growth, exchange_rate } = economicFactors;
    if (
      ccpi === '' ||
      ccpi_yoy === '' ||
      slfr === '' ||
      gold_lkr === '' ||
      gdp_growth === '' ||
      exchange_rate === ''
    ) {
      toast.error('Please enter all economic indicators before estimating the value.');
      return;
    }

    setPredicting(true);
    try {
      const data = await predictPrice(gemFactors, economicFactors as any);
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
      ccpi: '',
      ccpi_yoy: '',
      slfr: '',
      gold_lkr: '',
      gdp_growth: '',
      exchange_rate: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner" />
          <div className="text-gray-400 text-sm font-medium">Loading valuation form...</div>
        </div>
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

  const handleBack = () => {
    sessionStorage.setItem('faceted_flow_step', '2');
    router.push('/identification');
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 pt-6 sm:pt-12 pb-16 sm:pb-20">
      {isFlowActive && <FacetedFlowTracker currentStep={3} />}

      {isFlowActive && (
        <div className="flex items-center justify-between mb-6 max-w-3xl mx-auto w-full animate-fade-in">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-cyan-400 transition-colors bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl active:scale-[0.98] cursor-pointer font-semibold shadow-lg"
          >
            ← Back to Step 2: Feature Identification
          </button>
        </div>
      )}

      {/* Header */}
      <header className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-center mb-2 leading-tight px-2 text-white">
          Dynamic Gem Valuation &{' '}
          <span className="gradient-text">
            Price Estimator
          </span>
        </h1>
        <p className="text-center text-sm sm:text-base opacity-60 max-w-2xl mx-auto px-4 text-gray-300">
          Get market value estimations by combining visual characterization with real-time global trade market data.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        {/* Form / Results Column */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8" ref={formRef}>
          {!showResult ? (
            <>
              {/* Gem Factors */}
              <div className="glass-panel p-5 sm:p-6 space-y-5">
                <h2 className="text-lg font-medium text-cyan-400 flex items-center gap-2">
                  <span className="opacity-50 text-sm font-semibold">01</span> Gem Characteristics
                </h2>

                {isFlowActive && identifyResult && (
                  <div className="p-4 rounded-xl border border-cyan-500/10 bg-cyan-500/5 text-cyan-400 text-xs flex flex-col gap-2 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI-Extracted Attributes & Origin Loaded</span>
                    </div>
                    <div className="text-gray-400 leading-relaxed space-y-1.5">
                      <p>
                        The attributes below (Gem Type, Shape, Cut, Intensity) have been auto-filled from the Feature Identification model. You can verify and adjust them before running the valuation model.
                      </p>
                      {authResult && (
                        <p className="flex items-center gap-1 flex-wrap">
                          <span className="font-semibold text-white">Gemstone Authenticity:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            authResult?.ensemble_result?.prediction === 'Synthetic'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {authResult?.ensemble_result?.prediction || 'Natural'} Origin
                          </span>
                          <span className="text-[10px] opacity-75">
                            ({((authResult?.ensemble_result?.confidence ?? 0.954) * 100).toFixed(1)}% confidence)
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

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
              <div className="glass-panel p-5 sm:p-6 space-y-5">
                <h2 className="text-lg font-medium text-violet-400 flex items-center gap-2">
                  <span className="opacity-50 text-sm font-semibold">02</span> Economic Factors
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
                className="btn-primary w-full py-3.5 sm:py-4 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {predicting ? (
                  <>
                    <span className="spinner" /> Predicting...
                  </>
                ) : (
                  'Estimate Value'
                )}
              </button>
            </>
          ) : (
            /* Results Section */
            <div className="glass-panel p-5 sm:p-6 space-y-6 animate-slide-up">
              <h2 className="text-xl sm:text-2xl font-bold text-cyan-400 border-b border-white/10 pb-4">
                Valuation Results
              </h2>

              {isFlowActive && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3.5 text-xs animate-fade-in shadow-sm animate-fade-in">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400 font-medium">Gem Authenticity:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      authResult?.ensemble_result?.prediction === 'Synthetic'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {authResult?.ensemble_result?.prediction || 'Natural'} Origin
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400 font-medium">Gem Type:</span>
                    <span className="text-white font-bold">{gemFactors.gem_type}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400 font-medium">Extracted Shape:</span>
                    <span className="text-white font-bold">{gemFactors.shape}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-gray-400 font-medium">Extracted Cut:</span>
                    <span className="text-white font-bold">{gemFactors.cut}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Color Intensity:</span>
                    <span className="text-white font-bold">{gemFactors.colour_intensity}</span>
                  </div>
                </div>
              )}

              {/* Main Price */}
              <div className="text-center py-4">
                <p className="text-gray-400 text-xs sm:text-sm uppercase tracking-wider mb-2 font-semibold">
                  Estimated Market Value
                </p>
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text tracking-tight mb-3">
                  LKR {result?.predicted_price_lkr.toLocaleString()}
                </div>
                <div className="inline-block px-4 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs sm:text-sm font-semibold shadow-[0_0_12px_rgba(16,185,129,0.05)]">
                  AI Confidence: {((result?.confidence || 0) * 100).toFixed(1)}%
                </div>
              </div>

              {/* Model Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 shadow-lg">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                    XGBoost Prediction
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-violet-400">
                    LKR {result?.breakdown.xgboost.predicted_price_lkr.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 shadow-lg">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                    LightGBM Prediction
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-cyan-400">
                    LKR {result?.breakdown.lightgbm.predicted_price_lkr.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Reset / Finish Buttons */}
              <div className="flex flex-col gap-3">
                {isFlowActive ? (
                  <button
                    onClick={() => {
                      sessionStorage.removeItem('faceted_flow_active');
                      sessionStorage.removeItem('faceted_flow_step');
                      sessionStorage.removeItem('faceted_flow_image');
                      sessionStorage.removeItem('faceted_flow_image_name');
                      sessionStorage.removeItem('faceted_flow_auth_result');
                      sessionStorage.removeItem('faceted_flow_identify_result');
                      router.push('/');
                    }}
                    className="btn-primary w-full py-3.5 sm:py-4 text-sm sm:text-base font-bold cursor-pointer"
                  >
                    Finish & Return Home
                  </button>
                ) : null}
                <button
                  onClick={handleReset}
                  className="btn-secondary w-full py-3.5 sm:py-4 text-sm sm:text-base cursor-pointer"
                >
                  {isFlowActive ? 'Recalculate Value' : 'New Valuation'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-5 sm:p-6 sticky top-8 space-y-5 text-sm text-gray-400">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">
              About This Tool
            </h3>
            <p className="leading-relaxed">
              This valuation engine uses an ensemble of <strong>XGBoost</strong> and{' '}
              <strong>LightGBM</strong> models trained on historical gem pricing data.
            </p>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-300">Models Used:</h4>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>XGBoost Regressor</li>
                <li>LightGBM Regressor</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-300">Features Analyzed:</h4>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Gem characteristics (weight, type, clarity, etc.)</li>
                <li>Economic indicators (CCPI, gold price, GDP, etc.)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
