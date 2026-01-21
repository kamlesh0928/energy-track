import os

HOST = '0.0.0.0'
PORT = 5001
WEB_API_URL = f'http://localhost:{PORT}'

KAFKA_BROKER = 'localhost:9092'
TOPIC_SENSOR_DATA = 'factory-sensor-data'
TOPIC_ML_INSIGHTS = 'ml-insights'

MONGO_URI = 'mongodb://localhost:27017/'
MONGO_DB = 'factory_dashboard'
MONGO_COLLECTION = 'devices'

SIMULATION_INTERVAL = 3  # Seconds

def get_producer_config():
    return {
        'bootstrap.servers': KAFKA_BROKER,
        'client.id': 'factory-producer'
    }

def get_consumer_config(group_id):
    return {
        'bootstrap.servers': KAFKA_BROKER,
        'group.id': group_id,
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': True
    }