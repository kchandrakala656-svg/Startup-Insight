from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


# =========================
# SAFE IMPORTS (NO CRASH)
# =========================
try:
    from database.database import (
        create_database,
        save_prediction,
        get_history,
        delete_prediction
    )
    create_database()
except Exception as e:
    print("❌ Database error:", e)

try:
    from utils.predictor import predict_startup
except Exception as e:
    print("❌ Predictor import error:", e)
    predict_startup = None


# =========================
# FRONTEND ROUTES
# =========================

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/predict", methods=["GET"])
def predict_page():
    return render_template("predict.html")


@app.route("/result")
def result():
    return render_template("result.html")


@app.route("/history")
def history_page():
    return render_template("history.html")


# =========================
# PREDICTION API
# =========================

@app.route("/predict", methods=["POST"])
def predict_api():
    try:
        if predict_startup is None:
            return jsonify({"error": "Model not loaded"}), 500

        # Accept both JSON and form-data
        data = request.get_json()
        if not data:
            data = request.form.to_dict()

        # Run prediction
        result = predict_startup(data)

        prediction = result.get("prediction")
        confidence = result.get("confidence", 0)

        # Save to DB safely
        try:
            save_prediction(data, prediction, confidence)
        except Exception as db_err:
            print("DB save error:", db_err)

        # Risk level logic
        if confidence >= 80:
            risk = "Low"
        elif confidence >= 60:
            risk = "Medium"
        else:
            risk = "High"

        return jsonify({
            "prediction": prediction,
            "confidence": confidence,
            "risk_level": risk,
            "probability": confidence,

            # optional UI extras (safe placeholders)
            "funding_score": 80,
            "health_score": 75,
            "strengths": [
                "Strong execution potential",
                "Good market opportunity"
            ],
            "weaknesses": [
                "Needs optimization in burn rate"
            ],
            "suggestions": [
                "Improve customer acquisition strategy",
                "Focus on recurring revenue"
            ]
        })

    except Exception as e:
        print("❌ Prediction failed:", str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# =========================
# HISTORY API
# =========================

@app.route("/history-data", methods=["GET"])
def history_data():
    try:
        return jsonify(get_history())
    except Exception as e:
        return jsonify({"error": str(e)})


@app.route("/delete-history/<int:id>", methods=["DELETE"])
def delete_history(id):
    try:
        delete_prediction(id)
        return jsonify({"message": "deleted"})
    except Exception as e:
        return jsonify({"error": str(e)})


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)