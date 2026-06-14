const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface FactorOptions {
  gem_factors: {
    gem_type: string[];
    colour_intensity: string[];
    clarity: string[];
    shape: string[];
    cut: string[];
    enhancement: string[];
    weight_ct: { min: number; max: number; unit: string };
  };
  economic_factors: {
    [key: string]: {
      min: number;
      max: number;
      unit: string;
      description: string;
    };
  };
}

export interface PredictionResult {
  status: string;
  predicted_price_lkr: number;
  predicted_log_price: number;
  confidence: number;
  breakdown: {
    xgboost: {
      predicted_price_lkr: number;
      predicted_log_price: number;
    };
    lightgbm: {
      predicted_price_lkr: number;
      predicted_log_price: number;
    };
  };
  input_factors: {
    gem_factors: Record<string, unknown>;
    economic_factors: Record<string, unknown>;
  };
}

export interface GemFactors {
  weight_ct: number;
  gem_type: string;
  colour_intensity: string;
  clarity: string;
  shape: string;
  cut: string;
  enhancement: string;
}

export interface EconomicFactors {
  ccpi: number;
  ccpi_yoy: number;
  slfr: number;
  gold_lkr: number;
  gdp_growth: number;
  exchange_rate: number;
}


export async function fetchFactorOptions(): Promise<FactorOptions> {
  const res = await fetch(`${API_BASE}/api/valuation/factor-options`);

  if (!res.ok) {
    throw new Error(`Failed to fetch factor options: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.factor_options;
}


export async function predictPrice(
  gemFactors: GemFactors,
  economicFactors: EconomicFactors
): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE}/api/valuation/predict-price`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gem_factors: gemFactors,
      economic_factors: economicFactors,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Prediction failed");
  }

  return res.json();
}
