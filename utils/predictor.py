import joblib
import pandas as pd

# Load model + encoders
model = joblib.load("model/model.pkl")
encoders = joblib.load("model/encoder.pkl")


# REQUIRED MODEL FEATURES (YOU MUST MATCH THIS WITH TRAINING)
FEATURE_COLUMNS = [
    "funding_rounds",
    "founder_experience_years",
    "team_size",
    "market_size_billion",
    "product_traction_users",
    "burn_rate_million",
    "revenue_million",
    "investor_type",
    "sector",
    "founder_background"
]


def safe_encode(col, value):
    """
    Handles unknown categories safely
    """
    encoder = encoders[col]

    try:
        return encoder.transform([value])[0]
    except:
        # fallback to first class (prevents crash)
        return 0


def predict_startup(data):
    try:
        # Build ordered input (VERY IMPORTANT)
        input_data = {
            "funding_rounds": int(data.get("funding_rounds", 0)),
            "founder_experience_years": int(data.get("founder_experience", 0)),
            "team_size": int(data.get("team_size", 0)),
            "market_size_billion": float(data.get("market_size", 0)) / 1e9,
            "product_traction_users": 0,
            "burn_rate_million": float(data.get("burn_rate", 0)) / 1e6,
            "revenue_million": float(data.get("revenue", 0)) / 1e6,
            "investor_type": data.get("investor_type", "none"),
            "sector": data.get("industry", "other"),
            "founder_background": "unknown"
        }

        df = pd.DataFrame([input_data])[FEATURE_COLUMNS]

        # Encode categorical columns safely
        for col in ["investor_type", "sector", "founder_background"]:
            df[col] = df[col].apply(lambda x: safe_encode(col, x))

        # Predict
        prediction_raw = model.predict(df)[0]
        confidence = model.predict_proba(df).max() * 100

        # Decode label
        prediction = encoders["outcome"].inverse_transform([prediction_raw])[0]

        return {
            "prediction": prediction,
            "confidence": round(float(confidence), 2)
        }

    except Exception as e:
        print("Prediction error:", e)
        return {
            "prediction": "Error",
            "confidence": 0.0
        }