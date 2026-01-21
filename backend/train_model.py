import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os
import random

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'failure_model.pkl')

def create_synthetic_historical_data(num_records=5000):
    data = []
    base_metrics = {
        'CNC_Mill': {'pressure': 115, 'temp': 72, 'current': 12.0},
        'Robot_Arm': {'vibration': 0.12, 'temp': 60, 'current': 8.5},
    }

    keys = list(base_metrics.keys())
    
    for _ in range(num_records):
        m_type = random.choice(keys)
        sensors = base_metrics[m_type].copy()
        fail = random.random() < 0.1
        for k, v in sensors.items():
            sensors[k] = v + np.random.normal(0, v*0.1) + (v*0.2 if fail else 0)
        data.append({**sensors, 'failure': 1 if fail else 0})
    
    return pd.DataFrame(data).fillna(0)

def train_model(df):
    if df is None or df.empty: return
    
    X = df.drop(['failure'], axis=1, errors='ignore')
    y = df['failure']
    
    model = RandomForestClassifier(n_estimators=50, random_state=42)
    model.fit(X, y)
    
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    df = create_synthetic_historical_data()
    train_model(df)