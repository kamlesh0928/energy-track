import json
from kafka import KafkaConsumer
from pymongo import MongoClient
import socketio

KAFKA_BROKER = 'localhost:9092'
KAFKA_TOPICS = ['factory-sensor-data', 'ml-insights'] 
MONGO_URI = 'mongodb://localhost:27017/'
MONGO_DB = 'factory_dashboard'
MONGO_COLLECTION = 'devices'
WEB_API_URL = 'http://localhost:5001'

INITIAL_DEVICES = [
    { 
        "id": "CNC-1", 
        "type": "CNC_Mill", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "pressure": 120, "temp": 75, "current": 12.5 }, 
        "location": { "x": 200, "y": 300 },
        "isOnline": True,
        "energyConsumption": 450,
        "efficiency": 95,
        "process": "Precision Milling - Engine Blocks"
    },
    { 
        "id": "CNC-2", 
        "type": "CNC_Mill", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "pressure": 110, "temp": 70, "current": 11.8 }, 
        "location": { "x": 400, "y": 150 },
        "isOnline": True,
        "energyConsumption": 425,
        "efficiency": 92,
        "process": "Surface Finishing - Cylinder Heads"
    },
    { 
        "id": "CNC-3", 
        "type": "CNC_Mill", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "pressure": 115, "temp": 72, "current": 12.2 }, 
        "location": { "x": 150, "y": 500 },
        "isOnline": True,
        "energyConsumption": 440,
        "efficiency": 94,
        "process": "Prototype Development"
    },

    { 
        "id": "ARM-1", 
        "type": "Robot_Arm", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "vibration": 0.1, "temp": 60, "current": 8.5 }, 
        "location": { "x": 600, "y": 400 },
        "isOnline": True,
        "energyConsumption": 320,
        "efficiency": 97,
        "process": "Component Assembly - Main Line"
    },
    { 
        "id": "ARM-2", 
        "type": "Robot_Arm", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "vibration": 0.15, "temp": 62, "current": 8.8 }, 
        "location": { "x": 750, "y": 350 },
        "isOnline": True,
        "energyConsumption": 335,
        "efficiency": 93,
        "process": "Quality Inspection - Vision System"
    },
    { 
        "id": "ARM-3", 
        "type": "Robot_Arm", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "vibration": 0.12, "temp": 58, "current": 8.2 }, 
        "location": { "x": 500, "y": 100 },
        "isOnline": True,
        "energyConsumption": 310,
        "efficiency": 96,
        "process": "Material Handling - Warehouse"
    },

    { 
        "id": "LATHE-1", 
        "type": "Lathe", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "rpm": 1500, "temp": 65, "current": 15.2 }, 
        "location": { "x": 300, "y": 250 },
        "isOnline": True,
        "energyConsumption": 580,
        "efficiency": 91,
        "process": "Shaft Manufacturing - Crankshafts"
    },
    { 
        "id": "LATHE-2", 
        "type": "Lathe", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "rpm": 1600, "temp": 68, "current": 15.8 }, 
        "location": { "x": 700, "y": 450 },
        "isOnline": True,
        "energyConsumption": 595,
        "efficiency": 89,
        "process": "Precision Turning - Pistons"
    },

    { 
        "id": "DRILL-1", 
        "type": "Drill", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "torque": 30, "temp": 55, "current": 6.5 }, 
        "location": { "x": 450, "y": 200 },
        "isOnline": True,
        "energyConsumption": 250,
        "efficiency": 98,
        "process": "Precision Drilling - Engine Blocks"
    },
    { 
        "id": "DRILL-2", 
        "type": "Drill", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "torque": 28, "temp": 57, "current": 6.2 }, 
        "location": { "x": 800, "y": 250 },
        "isOnline": True,
        "energyConsumption": 245,
        "efficiency": 97,
        "process": "Threading Operations"
    },

    { 
        "id": "WELD-1", 
        "type": "Welding_Station", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "voltage": 220, "temp": 85, "current": 18.5 }, 
        "location": { "x": 250, "y": 450 },
        "isOnline": True,
        "energyConsumption": 680,
        "efficiency": 88,
        "process": "Chassis Welding - Frame Assembly"
    },
    { 
        "id": "WELD-2", 
        "type": "Welding_Station", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "voltage": 215, "temp": 82, "current": 17.8 }, 
        "location": { "x": 650, "y": 180 },
        "isOnline": True,
        "energyConsumption": 665,
        "efficiency": 90,
        "process": "Structural Welding - Support Frames"
    },

    { 
        "id": "PRESS-1", 
        "type": "Hydraulic_Press", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "pressure": 2500, "temp": 70, "hydraulic_flow": 45.2 }, 
        "location": { "x": 100, "y": 350 },
        "isOnline": True,
        "energyConsumption": 820,
        "efficiency": 85,
        "process": "Metal Stamping - Body Panels"
    },
    { 
        "id": "PRESS-2", 
        "type": "Hydraulic_Press", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "pressure": 2400, "temp": 68, "hydraulic_flow": 43.8 }, 
        "location": { "x": 550, "y": 550 },
        "isOnline": True,
        "energyConsumption": 800,
        "efficiency": 87,
        "process": "Deep Drawing - Fuel Tanks"
    },

    { 
        "id": "GRIND-1", 
        "type": "Surface_Grinder", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "rpm": 3500, "temp": 60, "vibration": 0.08 }, 
        "location": { "x": 350, "y": 380 },
        "isOnline": True,
        "energyConsumption": 380,
        "efficiency": 93,
        "process": "Surface Grinding - Engine Components"
    },

    { 
        "id": "QC-1", 
        "type": "Inspection_Station", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "precision": 0.001, "temp": 22, "humidity": 45 }, 
        "location": { "x": 850, "y": 400 },
        "isOnline": True,
        "energyConsumption": 150,
        "efficiency": 99,
        "process": "Dimensional Inspection - Final QC"
    },

    { 
        "id": "CONV-1", 
        "type": "Conveyor_Belt", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "speed": 1.2, "temp": 35, "motor_load": 5.5 }, 
        "location": { "x": 400, "y": 320 },
        "isOnline": True,
        "energyConsumption": 180,
        "efficiency": 96,
        "process": "Material Transport - Main Line"
    },
    { 
        "id": "CONV-2", 
        "type": "Conveyor_Belt", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "speed": 1.0, "temp": 33, "motor_load": 5.2 }, 
        "location": { "x": 720, "y": 280 },
        "isOnline": True,
        "energyConsumption": 165,
        "efficiency": 97,
        "process": "Assembly Line Transport"
    },

    { 
        "id": "PACK-1", 
        "type": "Packaging_Unit", 
        "status": "NORMAL", 
        "anomaly_count": 0, 
        "sensors": { "speed": 25, "temp": 28, "pressure": 95 }, 
        "location": { "x": 900, "y": 350 },
        "isOnline": True,
        "energyConsumption": 220,
        "efficiency": 94,
        "process": "Final Packaging - Shipping Prep"
    }
]

def setup_database():
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    collection = db[MONGO_COLLECTION]

    if collection.count_documents({}) == 0:
        print("Seeding database with initial device data...")
        devices_to_insert = []
        for d in INITIAL_DEVICES:
            device_doc = {'_id': d['id'], **d}
            device_doc['failurePrediction'] = 0.0
            device_doc['status'] = "Awaiting data..."
            devices_to_insert.append(device_doc)
            
        collection.insert_many(devices_to_insert)
        print("Database seeded.")
    
    return collection

def main():
    db_collection = setup_database()

    consumer = KafkaConsumer(
        *KAFKA_TOPICS, 
        bootstrap_servers=KAFKA_BROKER,
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='main-consumer-group',
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )

    sio = socketio.Client()
    try:
        sio.connect(WEB_API_URL)
        print("Connected to Web API for real-time updates.")
    except socketio.exceptions.ConnectionError as e:
        print(f"Could not connect to Web API at {WEB_API_URL}. Error: {e}")
        return

    print(f"Data processor started. Listening for messages from topics: {KAFKA_TOPICS}...")
    for message in consumer:
        data = message.value
        device_id = data['id']
        
        print(f"Received update for {device_id} from topic '{message.topic}'")

        update_payload = {k: v for k, v in data.items() if k!= 'id'}
        
        db_collection.update_one(
            {'_id': device_id},
            {'$set': update_payload},
            upsert=True
        )
        
        updated_document = db_collection.find_one({'_id': device_id})
        
        if updated_document:
            sio.emit('device_update', updated_document)
            print(f"Pushed enriched update for {device_id} to frontend.")

main()