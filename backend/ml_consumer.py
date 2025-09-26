import json
import os
import joblib
import pandas as pd
from kafka import KafkaConsumer, KafkaProducer
from datetime import datetime, timezone
import sys

KAFKA_BROKER = 'localhost:9092'
SOURCE_TOPIC = 'factory-sensor-data'
DEST_TOPIC = 'ml-insights'

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'failure_model.pkl')
if not os.path.exists(MODEL_PATH):
    print(f"Error: Model file not found at {MODEL_PATH}")
    print("Please run 'python ml_service/train_model.py' first to train and save the model.")
    sys.exit(1)
    
model = joblib.load(MODEL_PATH)
print("Failure prediction model loaded successfully.")

MODEL_FEATURES = model.feature_names_in_

def generate_optimization_suggestion(device_data, failure_prob):
    
    if failure_prob > 0.8:
        return "Critical Failure Risk: Schedule immediate maintenance."
    if failure_prob > 0.6:
        return "High Failure Risk: Inspect machine within 24 hours."
    
    status = device_data.get('status')
    if status == 'Idle' and device_data.get('energyConsumption', 0) > 300:
        return "High idle power draw. Consider shutdown to save energy."
    if status == 'Running' and device_data.get('efficiency', 95) < 85:
        return "Low efficiency detected. Check for calibration or material issues."
        
    return "Operating within normal parameters. No action needed."

def main():
    
    consumer = KafkaConsumer(
        SOURCE_TOPIC,
        bootstrap_servers=KAFKA_BROKER,
        auto_offset_reset='earliest',
        group_id='ml-service-group',
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        api_version=(0, 10, 1)
    )

    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BROKER,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        api_version=(0, 10, 1)
    )

    print("ML Service started. Listening for sensor data...")
    
    try:
        for message in consumer:
            data = message.value
            device_id = data['id']
            
            input_data = data['sensors']
            input_df = pd.DataFrame([input_data])
            input_df = input_df.reindex(columns=MODEL_FEATURES, fill_value=0)

            # 1. Predict system failure probability
            # model.predict_proba returns probabilities for each class [class_0, class_1]
            failure_probability_array = model.predict_proba(input_df)[:, 1]
            failure_probability = float(failure_probability_array)

            failure_prob_percent = round(failure_probability * 100, 2)

            # 2. Generate optimization suggestion
            suggestion = generate_optimization_suggestion(data, failure_probability)

            # Prepare the insights payload
            insight_payload = {
                'id': device_id,
                'failurePrediction': failure_prob_percent,
                'optimizationSuggestion': suggestion,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            print(f"Generated insight for {device_id}: Failure Risk {failure_prob_percent}%")
            
            # Publish the insight to the new Kafka topic
            producer.send(DEST_TOPIC, value=insight_payload)
            producer.flush()

    except KeyboardInterrupt:
        print("\nShutting down ML service...")
    finally:
        consumer.close()
        producer.close()
        print("Consumer and producer closed.")
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)


main()