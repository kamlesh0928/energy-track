import json
import time
import random
import threading
from datetime import datetime, timezone
from kafka import KafkaProducer
import timesynth as ts
import numpy as np

KAFKA_BROKER = 'localhost:9092'
KAFKA_TOPIC = 'factory-sensor-data'
SIMULATION_INTERVAL_SECONDS = 5

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

time_sampler = ts.TimeSampler(stop_time=20)
sine_signal = ts.signals.Sinusoidal(frequency=0.25)
white_noise = ts.noise.GaussianNoise(std=0.3)
timeseries_generator = ts.TimeSeries(sine_signal, noise_generator=white_noise)

class DeviceSimulator:
    def __init__(self, device_info, producer):
        self.device = device_info.copy()
        self.producer = producer
        self.thread = threading.Thread(target=self.run)
        self.thread.daemon = True

    def generate_data(self):
        """Generates new, fluctuating data for the device's specific sensors."""
        if self.device['status'] not in ['Running', 'Idle']:
            return
        
        samples, _, _ = timeseries_generator.sample(np.array([time.time()]))
        fluctuation = samples

        for sensor_name, current_value in self.device['sensors'].items():

            if 'temp' in sensor_name:
                new_value = current_value + fluctuation * 0.5
            elif 'pressure' in sensor_name:
                new_value = current_value + fluctuation * 2.0
            elif 'vibration' in sensor_name:
                new_value = current_value + abs(fluctuation * 0.01)
            elif 'rpm' in sensor_name:
                new_value = current_value + fluctuation * 10
            else:
                new_value = current_value + fluctuation * 0.1
            
            self.device['sensors'][sensor_name] = round(new_value, 2)
        
        self.device['energyConsumption'] += abs(fluctuation * 5)
        self.device['efficiency'] -= abs(fluctuation * 0.1)
        self.device['efficiency'] = round(np.clip(self.device['efficiency'], 80, 99), 2)

        if self.device['status'] == 'Running' and random.random() < 0.01:
            self.device['status'] = 'Idle'
        elif self.device['status'] == 'Idle' and random.random() < 0.05:
            self.device['status'] = 'Running'

    def run(self):
        while True:
            self.generate_data()
            
            payload = {
                'id': self.device['id'],
                'status': self.device['status'],
                'sensors': self.device['sensors'], # Send the whole updated sensors object
                'energyConsumption': round(self.device['energyConsumption'], 2),
                'efficiency': self.device['efficiency'],
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            print(f"Sending data for {payload['id']}: {payload['status']}, Sensors: {payload['sensors']}")
            self.producer.send(KAFKA_TOPIC, value=payload)
            time.sleep(SIMULATION_INTERVAL_SECONDS)

    def start(self):
        self.thread.start()

# Main execution
print("Attempting to connect to Kafka broker...")

try:
    producer = KafkaProducer(
        bootstrap_servers=KAFKA_BROKER,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        api_version=(0, 10, 1) # Explicitly set for compatibility
    )
    print("Successfully connected to Kafka broker.")
except Exception as e:
    print(f"Error connecting to Kafka: {e}")
    print("Please ensure Kafka and Zookeeper are running in Docker.")
    exit(1)


simulators = [DeviceSimulator(device, producer) for device in INITIAL_DEVICES]
for sim in simulators:
    sim.start()

print(f"Data simulators for {len(simulators)} devices started. Press Ctrl+C to stop.")

try:
    while True:
        time.sleep(10)
except KeyboardInterrupt:
    print("\nShutting down simulators...")
    producer.flush()
    producer.close()
    print("Producer closed.")