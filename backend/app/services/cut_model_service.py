"""
model_service.py
================
Load trained Random Forest models and predict optimal cut + yield.

Loads .pkl files from models/cut/ (your trained ML models):
  - rf_cut_model.pkl         (cut type classifier)
  - rf_yield_model.pkl       (yield % regressor)
  - scaler.pkl               (StandardScaler)
  - cut_label_encoder.pkl    (label encoder)
  - feature_columns.pkl      (feature order)
"""

import os
import joblib
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Optional


# =========================================================
# CONFIGURATION
# =========================================================
# Path relative to backend/app/services/model_service.py
# Goes up two levels to backend/, then into models/cut/
DEFAULT_MODEL_DIR = Path(__file__).parent.parent.parent / "models" / "cut"


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

        try:
            self._cut_model    = joblib.load(self.model_dir / "rf_cut_model.pkl")
            self._yield_model  = joblib.load(self.model_dir / "rf_yield_model.pkl")
            self._scaler       = joblib.load(self.model_dir / "scaler.pkl")
            self._cut_encoder  = joblib.load(self.model_dir / "cut_label_encoder.pkl")
            self._feature_cols = joblib.load(self.model_dir / "feature_columns.pkl")
            self._loaded = True
        except FileNotFoundError as e:
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


# =========================================================
# SINGLETON INSTANCE (cached across requests)
# =========================================================
_predictor_instance: Optional[CutPredictor] = None


def get_predictor() -> CutPredictor:
    """FastAPI dependency-friendly getter. Loads models once."""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = CutPredictor()
        _predictor_instance.load()
    return _predictor_instance