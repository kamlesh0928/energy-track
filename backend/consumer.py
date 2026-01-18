import json
import time
from confluent_kafka import Consumer, KafkaError
from pymongo import MongoClient
import socketio
import config

def get_db_collection():
    client = MongoClient(config.MONGO_URI)
    db = client[config.MONGO_DB]
    return db[config.MONGO_COLLECTION]

def run_consumer():
    print("Consumer: Starting...")
    
    # 1. Connect to Database
    collection = get_db_collection()

    # 2. Connect to Kafka
    consumer = Consumer(config.get_consumer_config('dashboard-consumer'))
    consumer.subscribe([config.TOPIC_SENSOR_DATA, config.TOPIC_ML_INSIGHTS])
    print("Consumer: Connected to Kafka.")

    # 3. Connect to SocketIO (Web API)
    sio = socketio.Client()
    try:
        sio.connect(config.WEB_API_URL, wait_timeout=10)
        print("Consumer: Connected to Web API WebSocket.")
    except Exception:
        print(f"Consumer: Web API not ready at {config.WEB_API_URL}. Proceeding without SocketIO for now.")

    print("Consumer: Listening for messages...")
    try:
        while True:
            # Poll for messages with a timeout of 1.0 second
            msg = consumer.poll(1.0)

            if msg is None:
                continue
            if msg.error():
                if msg.error().code() != KafkaError._PARTITION_EOF:
                    print(f"Consumer Error: {msg.error()}")
                continue

            try:
                # Decode message
                data = json.loads(msg.value().decode('utf-8'))
                device_id = data.get('id')
                
                if not device_id: continue

                # Update MongoDB
                update_payload = {k: v for k, v in data.items() if k != 'id'}
                collection.update_one(
                    {'_id': device_id},
                    {'$set': update_payload},
                    upsert=True
                )

                # Broadcast to Frontend
                if sio.connected:
                    updated_doc = collection.find_one({'_id': device_id})
                    if updated_doc:
                        sio.emit('device_update', updated_doc)
            
            except Exception as e:
                print(f"Consumer Data Error: {e}")

    except KeyboardInterrupt:
        print("Consumer: Closing...")
    finally:
        consumer.close()
        if sio.connected:
            sio.disconnect()

if __name__ == "__main__":
    run_consumer()