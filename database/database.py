import sqlite3

DATABASE_NAME = "database/startup.db"


# =========================
# CONNECTION
# =========================
def get_connection():
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row
    return conn


# =========================
# CREATE TABLE
# =========================
def create_database():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            startup_name TEXT,
            founder_name TEXT,

            industry TEXT,
            country TEXT,

            team_size INTEGER,
            startup_age_months INTEGER,
            founder_experience_years INTEGER,

            funding_amount REAL,
            funding_rounds INTEGER,

            revenue REAL,
            burn_rate REAL,

            market_size REAL,
            investor_type TEXT,

            prediction TEXT,
            confidence REAL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


# =========================
# SAVE PREDICTION
# =========================
def save_prediction(data, prediction, confidence):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO predictions (
            startup_name,
            founder_name,
            industry,
            country,
            team_size,
            startup_age_months,
            founder_experience_years,
            funding_amount,
            funding_rounds,
            revenue,
            burn_rate,
            market_size,
            investor_type,
            prediction,
            confidence
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("startup_name"),
        data.get("founder_name"),
        data.get("industry"),
        data.get("country"),

        int(data.get("team_size", 0)),
        int(data.get("startup_age", 0)),
        int(data.get("founder_experience", 0)),

        float(data.get("funding_amount", 0)),
        int(data.get("funding_rounds", 0)),

        float(data.get("revenue", 0)),
        float(data.get("burn_rate", 0)),

        float(data.get("market_size", 0)),
        data.get("investor_type"),

        prediction,
        confidence
    ))

    conn.commit()
    conn.close()


# =========================
# GET HISTORY
# =========================
def get_history():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM predictions
        ORDER BY created_at DESC
    """)

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


# =========================
# DELETE RECORD
# =========================
def delete_prediction(prediction_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM predictions WHERE id = ?
    """, (prediction_id,))

    conn.commit()
    conn.close()


# =========================
# INIT
# =========================
if __name__ == "__main__":
    create_database()
    print("Database created successfully.")