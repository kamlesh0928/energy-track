import json
import os
import joblib
import pandas as pd
import time
from confluent_kafka import Consumer, Producer, KafkaError
from datetime import datetime, timezone
import config
from train_model import create_synthetic_historical_data, train_model

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'failure_model.pkl')

def load_or_train_model():
    if not os.path.exists(MODEL_PATH):
        print("ML Service: Model not found. Training new model...")
        df = create_synthetic_historical_data(num_records=1000)
        train_model(df)
    try:
        return joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"ML Service: Model invalid. Retraining. Error: {e}")
        df = create_synthetic_historical_data(num_records=1000)
        train_model(df)
        return joblib.load(MODEL_PATH)

def generate_suggestion(device_data, failure_prob):
    if failure_prob > 0.8: return "Critical: Immediate maintenance required."
    if failure_prob > 0.5: return "Warning: Schedule inspection soon."
    if device_data.get('efficiency', 100) < 85: return "Optimization: Calibrate for efficiency."
    return "System Normal."

def run_ml_service():
    print("ML Service: Initializing...")
    model = load_or_train_model()
    model_features = getattr(model, "feature_names_in_", [])
    print(f"ML Service: Model loaded. Features: {list(model_features)}")

    # Initialize Consumer and Producer
    consumer = Consumer(config.get_consumer_config('ml-predictor'))
    consumer.subscribe([config.TOPIC_SENSOR_DATA])
    
    producer = Producer(config.get_producer_config())
    print("ML Service: Connected to Kafka.")

    try:
        while True:
            msg = consumer.poll(1.0)

            if msg is None: continue
            if msg.error():
                if msg.error().code() != KafkaError._PARTITION_EOF:
                    print(f"ML Service Error: {msg.error()}")
                continue

            try:
                data = json.loads(msg.value().decode('utf-8'))
                sensors = data.get('sensors', {})
                
                # Prepare DataFrame for Model
                input_df = pd.DataFrame([sensors])
                for col in model_features:
                    if col not in input_df.columns:
                        input_df[col] = 0
                input_df = input_df[model_features]

                # Predict
                prob = model.predict_proba(input_df)[:, 1][0]
                prob_percent = round(prob * 100, 2)
                
                insight = {
                    'id': data['id'],
                    'failurePrediction': prob_percent,
                    'optimizationSuggestion': generate_suggestion(data, prob),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                
                if prob_percent > 20:
                    print(f"ML Insight [{data['id']}]: Risk {prob_percent}%")

                producer.produce(
                    config.TOPIC_ML_INSIGHTS,
                    key=data['id'],
                    value=json.dumps(insight)
                )
                # Serve delivery reports for producer
                producer.poll(0)

            except Exception as e:
                print(f"ML Processing Error: {e}")

    except KeyboardInterrupt:
        print("ML Service: Stopping...")
    finally:
        consumer.close()
        producer.flush()

if __name__ == "__main__":
    run_ml_service()