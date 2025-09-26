import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import joblib
import os
import random
import argparse
from pymongo import MongoClient

MONGO_URI = 'mongodb://localhost:27017/'
MONGO_DB = 'factory_dashboard'
MONGO_COLLECTION = 'devices'
MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, 'failure_model.pkl')

def create_synthetic_historical_data(num_records=50000):
    """Creates a DataFrame of synthetic historical sensor data for the initial model."""
    print("Generating synthetic historical data for bootstrap model...")
    data = []
    base_metrics = {
        'CNC_Mill': {'pressure': 115, 'temp': 72, 'current': 12.0},
        'Robot_Arm': {'vibration': 0.12, 'temp': 60, 'current': 8.5},
        '3D_Printer': {'temp': 210, 'current': 5.0, 'humidity': 40},
        'Laser_Cutter': {'power': 80, 'temp': 65, 'current': 10.0},
        'Conveyor_Belt': {'speed': 1.5, 'load': 300, 'current': 7.0},
        'Packaging_Machine': {'speed': 2.0, 'temp': 55, 'current': 6.5},
        'Inspection_System': {'resolution': 1080, 'temp': 50, 'current': 4.0},
        'Welding_Station': {'temp': 300, 'current': 15.0, 'pressure': 150}
    }
    for _ in range(num_records):
        machine_type = random.choice(list(base_metrics.keys()))
        sensors = base_metrics[machine_type].copy()
        is_failure_imminent = random.random() < 0.05
        for sensor, value in sensors.items():
            noise = np.random.normal(0, value * 0.05)
            degradation = value * 0.20 if is_failure_imminent else 0
            sensors[sensor] = value + noise + degradation
        data.append({**sensors, 'failure': 1 if is_failure_imminent else 0})
    df = pd.DataFrame(data).fillna(0)
    print("Synthetic data generated.")
    return df

def fetch_data_from_mongodb():

    print("Fetching historical data from MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    collection = db[MONGO_COLLECTION]
    
    records = list(collection.find({}, {'_id': 0, 'sensors': 1, 'status': 1}))
    if not records:
        print("No data found in MongoDB. Cannot retrain model.")
        return None

    for record in records:
        if 'sensors' in record:
            for sensor, value in record['sensors'].items():
                record[sensor] = value
            del record['sensors']
        
        record['failure'] = 1 if record.get('status') == 'Stopped' else 0

    df = pd.DataFrame(records)
    print(f"Fetched and processed {len(df)} records from MongoDB.")
    return df

def train_model(df):

    if df is None or df.empty:
        print("Dataframe is empty. Skipping training.")
        return

    if 'failure' not in df.columns:
        raise ValueError("Target column 'failure' not found in dataframe.")
    
    X = df.drop(['failure', 'status'], axis=1, errors='ignore')
    y = df['failure']

    if len(y.unique()) < 2:
        print("Not enough class diversity in the data (e.g., no failures recorded yet). Skipping retraining.")
        return

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    print("\nModel Evaluation Report:")
    print(classification_report(y_test, y_pred))
    
    joblib.dump(model, MODEL_PATH)
    print(f"\nModel trained and saved to {MODEL_PATH}")

parser = argparse.ArgumentParser(description="Train or retrain the failure prediction model.")
parser.add_argument('--initial', action='store_true', help="Train an initial model using synthetic data.")
parser.add_argument('--retrain', action='store_true', help="Retrain the model using historical data from MongoDB.")
args = parser.parse_args()

if args.initial:
    print("--- Starting Initial Model Training (Bootstrap) ---")
    dataframe = create_synthetic_historical_data()
    train_model(dataframe)
elif args.retrain:
    print("--- Starting Model Retraining from MongoDB ---")
    dataframe = fetch_data_from_mongodb()
    train_model(dataframe)
else:
    print("No training mode selected. Please specify --initial or --retrain.")