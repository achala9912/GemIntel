'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  fetchFactorOptions,
  predictPrice,
  type FactorOptions,
  type PredictionResult,
} from '@/services/valuesApi';


export default function Valuation() {
  const [factorOptions, setFactorOptions] = useState<FactorOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [gemFactors, setGemFactors] = useState({
    weight_ct: 1.5,
    gem_type: 'Ceylon Blue Spinel',
    colour_intensity: 'Royal Blue',
    clarity: 'VVS1',
    shape: 'Cushion',
    cut: 'Mixed Brilliant Cut',
    enhancement: 'Unheated',
  });

  const [economicFactors, setEconomicFactors] = useState({
    ccpi: 95.0,
    ccpi_yoy: 4.5,
    slfr: 8.5,
    gold_lkr: 206000,
    gdp_growth: 2.5,
    exchange_rate: 155.0,
  });


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
      gem_type: 'Ceylon Blue Spinel',
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading valuation form...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
            Dynamic Valuation Engine
          </h1>
          <p className="text-gray-400 text-lg">
            Get market value estimations by combining visual characterization with real-time global trade market data.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-8">
            {!showResult ? (
              <>
                {/* Gem Factors */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700 p-8">
                  <h2 className="text-2xl font-bold mb-6 text-cyan-400">Gem Characteristics</h2>

                  <div className="space-y-4">
                    {/* Weight */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Weight (carats)
                      </label>
                      <input
                        type="number"
                        min={factorOptions?.gem_factors.weight_ct.min}
                        max={factorOptions?.gem_factors.weight_ct.max}
                        step="0.1"
                        value={gemFactors.weight_ct}
                        onChange={(e) =>
                          handleGemFactorChange('weight_ct', parseFloat(e.target.value))
                        }
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Gem Type */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Gem Type
                      </label>
                      <select
                        value={gemFactors.gem_type}
                        onChange={(e) => handleGemFactorChange('gem_type', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        {factorOptions?.gem_factors.gem_type.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Colour Intensity */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Colour Intensity
                      </label>
                      <select
                        value={gemFactors.colour_intensity}
                        onChange={(e) =>
                          handleGemFactorChange('colour_intensity', e.target.value)
                        }
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        {factorOptions?.gem_factors.colour_intensity.map((intensity) => (
                          <option key={intensity} value={intensity}>
                            {intensity}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Clarity */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Clarity
                      </label>
                      <select
                        value={gemFactors.clarity}
                        onChange={(e) => handleGemFactorChange('clarity', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        {factorOptions?.gem_factors.clarity.map((clarity) => (
                          <option key={clarity} value={clarity}>
                            {clarity}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Shape */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Shape
                      </label>
                      <select
                        value={gemFactors.shape}
                        onChange={(e) => handleGemFactorChange('shape', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        {factorOptions?.gem_factors.shape.map((shape) => (
                          <option key={shape} value={shape}>
                            {shape}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Cut */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Cut
                      </label>
                      <select
                        value={gemFactors.cut}
                        onChange={(e) => handleGemFactorChange('cut', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        {factorOptions?.gem_factors.cut.map((cut) => (
                          <option key={cut} value={cut}>
                            {cut}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Enhancement */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Enhancement
                      </label>
                      <select
                        value={gemFactors.enhancement}
                        onChange={(e) =>
                          handleGemFactorChange('enhancement', e.target.value)
                        }
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                      >
                        {factorOptions?.gem_factors.enhancement.map((enhancement) => (
                          <option key={enhancement} value={enhancement}>
                            {enhancement}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Economic Factors */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700 p-8">
                  <h2 className="text-2xl font-bold mb-6 text-violet-400">Economic Factors</h2>

                  <div className="space-y-4">
                    {/* CCPI */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        CCPI (Consumer Cost Price Index)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={economicFactors.ccpi}
                        onChange={(e) =>
                          handleEconomicFactorChange('ccpi', parseFloat(e.target.value))
                        }
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* CCPI YoY */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        CCPI YoY (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={economicFactors.ccpi_yoy}
                        onChange={(e) =>
                          handleEconomicFactorChange('ccpi_yoy', parseFloat(e.target.value))
                        }
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* SLFR */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        SLFR (Sri Lanka Floating Rate) (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={economicFactors.slfr}
                        onChange={(e) =>
                          handleEconomicFactorChange('slfr', parseFloat(e.target.value))
                        }
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* Gold Price */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Gold Price (LKR)
                      </label>
                      <input
                        type="number"
                        value={economicFactors.gold_lkr}
                        onChange={(e) =>
                          handleEconomicFactorChange('gold_lkr', parseFloat(e.target.value))
                        }
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* GDP Growth */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        GDP Growth (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={economicFactors.gdp_growth}
                        onChange={(e) =>
                          handleEconomicFactorChange('gdp_growth', parseFloat(e.target.value))
                        }
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>

                    {/* Exchange Rate */}
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-300">
                        Exchange Rate (LKR/USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={economicFactors.exchange_rate}
                        onChange={(e) =>
                          handleEconomicFactorChange('exchange_rate', parseFloat(e.target.value))
                        }
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handlePredict}
                    disabled={predicting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {predicting ? 'Predicting...' : 'Estimate Value'}
                  </button>
                </div>
              </>
            ) : (
              /* Results Section */
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700 p-8 space-y-6">
                <h2 className="text-2xl font-bold mb-6 text-cyan-400">Valuation Results</h2>

                {/* Main Price */}
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Estimated Market Value</p>
                  <div className="text-6xl font-bold bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                    LKR {result?.predicted_price_lkr.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Per Carat: LKR{' '}
                    {(result ? result.predicted_price_lkr / gemFactors.weight_ct : 0).toLocaleString()}
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
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">XGBoost Prediction</p>
                    <p className="text-2xl font-bold text-violet-400">
                      LKR {result?.breakdown.xgboost.predicted_price_lkr.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">LightGBM Prediction</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      LKR {result?.breakdown.lightgbm.predicted_price_lkr.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition"
                >
                  New Valuation
                </button>
              </div>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-gray-700 p-8 sticky top-8">
              <h3 className="text-xl font-bold mb-4 text-cyan-400">About This Tool</h3>
              <div className="space-y-4 text-sm text-gray-400">
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
    </div>
  );
}
