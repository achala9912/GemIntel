import os
import joblib
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Optional


DEFAULT_MODEL_DIR = Path(__file__).parent.parent.parent / "models" / "cut-prediction"


class CutPredictor:
    """
    Singleton-ish wrapper for the trained ML models.
    Loads .pkl files once on first use; reuses for subsequent predictions.
    """

    def __init__(self, model_dir: Optional[str] = None):
        self.model_dir = Path(model_dir) if model_dir else DEFAULT_MODEL_DIR
        self._cut_model = None
        self._yield_model = None
        self._scaler = None
        self._cut_encoder = None
        self._feature_cols = None
        self._loaded = False

    def load(self) -> None:
        """Load all ML artifacts. Idempotent."""
        if self._loaded:
            return

        if not self.model_dir.exists():
            raise FileNotFoundError(
                f"Model directory not found: {self.model_dir}"
            )

        print("[CutPredictor] Initializing gemstone cut prediction models...")
        try:
            cut_model_path = self.model_dir / "rf_cut_model.pkl"
            print(f"[ModelLoader] Loading Cut Classifier from: {cut_model_path}")
            self._cut_model    = joblib.load(cut_model_path)
            
            yield_model_path = self.model_dir / "rf_yield_model.pkl"
            print(f"[ModelLoader] Loading Yield Regressor from: {yield_model_path}")
            self._yield_model  = joblib.load(yield_model_path)
            
            scaler_path = self.model_dir / "scaler.pkl"
            print(f"[ModelLoader] Loading StandardScaler configuration: {scaler_path}")
            self._scaler       = joblib.load(scaler_path)
            
            print(f"[ModelLoader] Loading cut labels and features columns definitions...")
            self._cut_encoder  = joblib.load(self.model_dir / "cut_label_encoder.pkl")
            self._feature_cols = joblib.load(self.model_dir / "feature_columns.pkl")
            
            self._loaded = True
            print("[CutPredictor] Gemstone ML cut prediction model bundle loaded successfully on CPU.")
        except FileNotFoundError as e:
            print(f"[CutPredictor] FAILED to load ML assets: Missing file {e.filename}")
            raise FileNotFoundError(
                f"Missing ML model file in {self.model_dir}: {e.filename}"
            )

    def predict(
        self,
        gem_type: str,
        length_mm: float,
        width_mm: float,
        depth_mm: float,
    ) -> Dict[str, Any]:
        """
        Predict optimal cut + yield from extracted metrics.

        Args:
            gem_type:    'blue_sapphire' | 'spinel' | 'topaz'
            length_mm:   Length from visual hull
            width_mm:    Width from visual hull
            depth_mm:    Depth from visual hull

        Returns:
            {
              "cut":          'Round' | 'Cushion' | 'Oval' | 'Emerald',
              "yield_pct":    float (predicted yield %),
              "confidence":   float (0-100),
              "probabilities": { cut: prob, ... }
            }
        """
        if not self._loaded:
            self.load()

        lw_ratio = length_mm / width_mm if width_mm > 0 else 0

        # Build feature row matching training format
        row = {
            "VH_Length_mm":  length_mm,
            "VH_Width_mm":   width_mm,
            "VH_Depth_mm":   depth_mm,
            "VH_L_W_Ratio":  lw_ratio,
        }
        df_x = pd.DataFrame([row])

        # Add one-hot gem type columns (must match training feature order)
        for col in self._feature_cols:
            if col not in df_x.columns:
                df_x[col] = 0
        gem_col = f"Gem_Type_{gem_type}"
        if gem_col in self._feature_cols:
            df_x[gem_col] = 1

        df_x = df_x[self._feature_cols]
        X_scaled = self._scaler.transform(df_x)

        # Cut classifier
        cut_enc = self._cut_model.predict(X_scaled)[0]
        cut_label = self._cut_encoder.inverse_transform([cut_enc])[0]
        cut_proba = self._cut_model.predict_proba(X_scaled)[0]
        confidence = float(cut_proba[cut_enc] * 100)
        proba_dict = {
            cls: round(float(p) * 100, 1)
            for cls, p in zip(self._cut_encoder.classes_, cut_proba)
        }

        # Yield regressor
        yield_pct = float(self._yield_model.predict(X_scaled)[0])

        return {
            "cut":            str(cut_label),
            "yield_pct":      round(yield_pct, 2),
            "confidence":     round(confidence, 1),
            "probabilities":  proba_dict,
            "lw_ratio":       round(lw_ratio, 3),
        }



_predictor_instance: Optional[CutPredictor] = None


def get_predictor() -> CutPredictor:
    """FastAPI dependency-friendly getter. Loads models once."""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = CutPredictor()
        _predictor_instance.load()
    return _predictor_instance