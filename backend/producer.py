import json
import time
import random
import math
from datetime import datetime, timezone
from confluent_kafka import Producer
import config

# Device Data
INITIAL_DEVICES = [
    { "id": "CNC-1", "type": "CNC_Mill", "status": "NORMAL", "sensors": { "pressure": 120, "temp": 75, "current": 12.5 }, "location": { "x": 200, "y": 300 }, "isOnline": True, "energyConsumption": 450, "efficiency": 95, "process": "Precision Milling" },
    { "id": "CNC-2", "type": "CNC_Mill", "status": "NORMAL", "sensors": { "pressure": 110, "temp": 70, "current": 11.8 }, "location": { "x": 400, "y": 150 }, "isOnline": True, "energyConsumption": 425, "efficiency": 92, "process": "Surface Finishing" },
    { "id": "ARM-1", "type": "Robot_Arm", "status": "NORMAL", "sensors": { "vibration": 0.1, "temp": 60, "current": 8.5 }, "location": { "x": 600, "y": 400 }, "isOnline": True, "energyConsumption": 320, "efficiency": 97, "process": "Assembly" },
    { "id": "ARM-2", "type": "Robot_Arm", "status": "NORMAL", "sensors": { "vibration": 0.15, "temp": 62, "current": 8.8 }, "location": { "x": 750, "y": 350 }, "isOnline": True, "energyConsumption": 335, "efficiency": 93, "process": "Inspection" },
    { "id": "LATHE-1", "type": "Lathe", "status": "NORMAL", "sensors": { "rpm": 1500, "temp": 65, "current": 15.2 }, "location": { "x": 300, "y": 250 }, "isOnline": True, "energyConsumption": 580, "efficiency": 91, "process": "Shaft Mfg" },
    { "id": "WELD-1", "type": "Welding_Station", "status": "NORMAL", "sensors": { "voltage": 220, "temp": 85, "current": 18.5 }, "location": { "x": 250, "y": 450 }, "isOnline": True, "energyConsumption": 680, "efficiency": 88, "process": "Welding" }
]

class DeviceSimulator:
    def __init__(self, device_info, producer):
        self.device = device_info.copy()
        self.producer = producer
        self.tick = 0

    def generate_data(self):
        if self.device['status'] not in ['Running', 'Idle', 'NORMAL', 'WARNING']:
            return
        
        self.tick += 1
        fluctuation = math.sin(self.tick * 0.1) + random.gauss(0, 0.2)

        for sensor_name, current_value in self.device['sensors'].items():
            if 'temp' in sensor_name: change = fluctuation * 0.5
            elif 'pressure' in sensor_name: change = fluctuation * 2.0
            elif 'vibration' in sensor_name: change = abs(fluctuation * 0.05)
            elif 'rpm' in sensor_name: change = fluctuation * 15
            else: change = fluctuation * 0.1
            self.device['sensors'][sensor_name] = round(current_value + change, 2)
        
        self.device['energyConsumption'] = round(max(0, self.device['energyConsumption'] + fluctuation), 2)
        self.device['efficiency'] = round(max(50, min(100, self.device['efficiency'] - (abs(fluctuation) * 0.05))), 2)

        if self.device['status'] == 'NORMAL' and random.random() < 0.02: self.device['status'] = 'WARNING'
        elif self.device['status'] == 'WARNING' and random.random() < 0.1: self.device['status'] = 'NORMAL'

    def send(self):
        self.generate_data()
        payload = {
            'id': self.device['id'],
            'status': self.device['status'],
            'sensors': self.device['sensors'],
            'location': self.device['location'],
            'energyConsumption': self.device['energyConsumption'],
            'efficiency': self.device['efficiency'],
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        self.producer.produce(
            config.TOPIC_SENSOR_DATA,
            key=self.device['id'],
            value=json.dumps(payload)
        )

def run_producer():
    print("Producer: Connecting to Kafka...")
    producer = Producer(config.get_producer_config())
    
    simulators = [DeviceSimulator(d, producer) for d in INITIAL_DEVICES]
    print(f"Producer: Starting simulation for {len(simulators)} devices.")
    
    try:
        while True:
            for sim in simulators:
                sim.send()
            
            producer.poll(0)
            time.sleep(config.SIMULATION_INTERVAL)
            
    except KeyboardInterrupt:
        print("Producer: Stopping...")
        producer.flush()

if __name__ == "__main__":
    run_producer()