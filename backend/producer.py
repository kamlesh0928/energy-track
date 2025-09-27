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
    },
    {
        "id": "CNC-4",
        "type": "CNC_Mill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 113,
            "temp": 85,
            "current": 12.3
        },
        "location": {
            "x": 269,
            "y": 142
        },
        "isOnline": True,
        "energyConsumption": 477,
        "efficiency": 95,
        "process": "Pocketing - Molds"
    },
    {
        "id": "PRESS-3",
        "type": "Hydraulic_Press",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 2341,
            "temp": 73,
            "hydraulic_flow": 46.5
        },
        "location": {
            "x": 64,
            "y": 512
        },
        "isOnline": True,
        "energyConsumption": 853,
        "efficiency": 84,
        "process": "Coining - Medallions"
    },
    {
        "id": "LATHE-3",
        "type": "Lathe",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 1481,
            "temp": 64,
            "current": 15.6
        },
        "location": {
            "x": 586,
            "y": 516
        },
        "isOnline": True,
        "energyConsumption": 553,
        "efficiency": 91,
        "process": "Facing - Flywheels"
    },
    {
        "id": "WELD-3",
        "type": "Welding_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "voltage": 218,
            "temp": 82,
            "current": 17.5
        },
        "location": {
            "x": 86,
            "y": 403
        },
        "isOnline": True,
        "energyConsumption": 709,
        "efficiency": 88,
        "process": "MIG Welding - Steel Frames"
    },
    {
        "id": "ARM-4",
        "type": "Robot_Arm",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "vibration": 0.1,
            "temp": 56,
            "current": 8.1
        },
        "location": {
            "x": 305,
            "y": 158
        },
        "isOnline": True,
        "energyConsumption": 305,
        "efficiency": 97,
        "process": "Painting - Car Bodies"
    },
    {
        "id": "DRILL-3",
        "type": "Drill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "torque": 26,
            "temp": 57,
            "current": 6.8
        },
        "location": {
            "x": 534,
            "y": 444
        },
        "isOnline": True,
        "energyConsumption": 238,
        "efficiency": 98,
        "process": "Hole Boring - Gearboxes"
    },
    {
        "id": "PACK-2",
        "type": "Packaging_Unit",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 22,
            "temp": 32,
            "pressure": 105
        },
        "location": {
            "x": 761,
            "y": 427
        },
        "isOnline": True,
        "energyConsumption": 233,
        "efficiency": 95,
        "process": "Automated Labeling"
    },
    {
        "id": "WELD-4",
        "type": "Welding_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "voltage": 224,
            "temp": 83,
            "current": 17.0
        },
        "location": {
            "x": 558,
            "y": 272
        },
        "isOnline": True,
        "energyConsumption": 741,
        "efficiency": 92,
        "process": "Spot Welding - Panels"
    },
    {
        "id": "CONV-3",
        "type": "Conveyor_Belt",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 1.0,
            "temp": 37,
            "motor_load": 5.2
        },
        "location": {
            "x": 643,
            "y": 139
        },
        "isOnline": True,
        "energyConsumption": 182,
        "efficiency": 96,
        "process": "Cooling Line Transport"
    },
    {
        "id": "CNC-5",
        "type": "CNC_Mill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 130,
            "temp": 83,
            "current": 12.3
        },
        "location": {
            "x": 232,
            "y": 255
        },
        "isOnline": True,
        "energyConsumption": 442,
        "efficiency": 96,
        "process": "Pocketing - Molds"
    },
    {
        "id": "GRIND-2",
        "type": "Surface_Grinder",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 3418,
            "temp": 58,
            "vibration": 0.08
        },
        "location": {
            "x": 298,
            "y": 272
        },
        "isOnline": True,
        "energyConsumption": 393,
        "efficiency": 94,
        "process": "Creep Feed Grinding - Slots"
    },
    {
        "id": "ARM-5",
        "type": "Robot_Arm",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "vibration": 0.2,
            "temp": 63,
            "current": 8.7
        },
        "location": {
            "x": 59,
            "y": 125
        },
        "isOnline": True,
        "energyConsumption": 328,
        "efficiency": 97,
        "process": "Pick and Place - Circuit Boards"
    },
    {
        "id": "CNC-6",
        "type": "CNC_Mill",
        "status": "WARNING",
        "anomaly_count": 2,
        "sensors": {
            "pressure": 113,
            "temp": 71,
            "current": 12.7
        },
        "location": {
            "x": 483,
            "y": 427
        },
        "isOnline": True,
        "energyConsumption": 421,
        "efficiency": 91,
        "process": "Drilling Cycle - Manifolds"
    },
    {
        "id": "PRESS-4",
        "type": "Hydraulic_Press",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 2568,
            "temp": 70,
            "hydraulic_flow": 47.9
        },
        "location": {
            "x": 134,
            "y": 305
        },
        "isOnline": True,
        "energyConsumption": 816,
        "efficiency": 85,
        "process": "Forging - Connecting Rods"
    },
    {
        "id": "QC-2",
        "type": "Inspection_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "precision": 0.003,
            "temp": 24,
            "humidity": 45
        },
        "location": {
            "x": 880,
            "y": 250
        },
        "isOnline": True,
        "energyConsumption": 178,
        "efficiency": 98,
        "process": "Optical CMM - Castings"
    },
    {
        "id": "ARM-6",
        "type": "Robot_Arm",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "vibration": 0.16,
            "temp": 64,
            "current": 9.4
        },
        "location": {
            "x": 813,
            "y": 353
        },
        "isOnline": True,
        "energyConsumption": 361,
        "efficiency": 95,
        "process": "Welding Support"
    },
    {
        "id": "WELD-5",
        "type": "Welding_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "voltage": 218,
            "temp": 95,
            "current": 17.5
        },
        "location": {
            "x": 780,
            "y": 140
        },
        "isOnline": True,
        "energyConsumption": 700,
        "efficiency": 87,
        "process": "MIG Welding - Steel Frames"
    },
    {
        "id": "LATHE-4",
        "type": "Lathe",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 1424,
            "temp": 70,
            "current": 16.5
        },
        "location": {
            "x": 583,
            "y": 506
        },
        "isOnline": True,
        "energyConsumption": 612,
        "efficiency": 88,
        "process": "Knurling - Handles"
    },
    {
        "id": "CNC-7",
        "type": "CNC_Mill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 110,
            "temp": 79,
            "current": 12.0
        },
        "location": {
            "x": 622,
            "y": 484
        },
        "isOnline": True,
        "energyConsumption": 457,
        "efficiency": 90,
        "process": "Contouring - Turbine Blades"
    },
    {
        "id": "QC-3",
        "type": "Inspection_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "precision": 0.002,
            "temp": 24,
            "humidity": 43
        },
        "location": {
            "x": 787,
            "y": 412
        },
        "isOnline": True,
        "energyConsumption": 144,
        "efficiency": 98,
        "process": "Surface Roughness Test"
    },
    {
        "id": "LATHE-5",
        "type": "Lathe",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 1438,
            "temp": 64,
            "current": 14.7
        },
        "location": {
            "x": 863,
            "y": 305
        },
        "isOnline": True,
        "energyConsumption": 605,
        "efficiency": 94,
        "process": "Knurling - Handles"
    },
    {
        "id": "PRESS-5",
        "type": "Hydraulic_Press",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 2457,
            "temp": 66,
            "hydraulic_flow": 46.2
        },
        "location": {
            "x": 732,
            "y": 127
        },
        "isOnline": True,
        "energyConsumption": 870,
        "efficiency": 87,
        "process": "Bending - Brackets"
    },
    {
        "id": "PACK-3",
        "type": "Packaging_Unit",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 29,
            "temp": 30,
            "pressure": 91
        },
        "location": {
            "x": 932,
            "y": 548
        },
        "isOnline": True,
        "energyConsumption": 235,
        "efficiency": 95,
        "process": "Box Sealing"
    },
    {
        "id": "GRIND-3",
        "type": "Surface_Grinder",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 3280,
            "temp": 64,
            "vibration": 0.1
        },
        "location": {
            "x": 605,
            "y": 501
        },
        "isOnline": True,
        "energyConsumption": 366,
        "efficiency": 91,
        "process": "Polishing - Optical Components"
    },
    {
        "id": "CONV-4",
        "type": "Conveyor_Belt",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 1.4,
            "temp": 32,
            "motor_load": 5.4
        },
        "location": {
            "x": 105,
            "y": 545
        },
        "isOnline": True,
        "energyConsumption": 182,
        "efficiency": 96,
        "process": "Cooling Line Transport"
    },
    {
        "id": "DRILL-4",
        "type": "Drill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "torque": 26,
            "temp": 56,
            "current": 6.3
        },
        "location": {
            "x": 482,
            "y": 145
        },
        "isOnline": True,
        "energyConsumption": 237,
        "efficiency": 98,
        "process": "Counterboring - Flanges"
    },
    {
        "id": "PACK-4",
        "type": "Packaging_Unit",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 29,
            "temp": 28,
            "pressure": 92
        },
        "location": {
            "x": 761,
            "y": 427
        },
        "isOnline": True,
        "energyConsumption": 222,
        "efficiency": 95,
        "process": "Shrink Wrapping - Pallets"
    },
    {
        "id": "DRILL-5",
        "type": "Drill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "torque": 34,
            "temp": 55,
            "current": 6.2
        },
        "location": {
            "x": 863,
            "y": 285
        },
        "isOnline": True,
        "energyConsumption": 242,
        "efficiency": 95,
        "process": "Hole Boring - Gearboxes"
    },
    {
        "id": "ARM-7",
        "type": "Robot_Arm",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "vibration": 0.17,
            "temp": 64,
            "current": 8.0
        },
        "location": {
            "x": 451,
            "y": 257
        },
        "isOnline": True,
        "energyConsumption": 308,
        "efficiency": 98,
        "process": "Painting - Car Bodies"
    },
    {
        "id": "CONV-5",
        "type": "Conveyor_Belt",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 1.1,
            "temp": 38,
            "motor_load": 5.4
        },
        "location": {
            "x": 84,
            "y": 444
        },
        "isOnline": True,
        "energyConsumption": 169,
        "efficiency": 96,
        "process": "Waste Removal"
    },
    {
        "id": "PRESS-6",
        "type": "Hydraulic_Press",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 2321,
            "temp": 70,
            "hydraulic_flow": 46.1
        },
        "location": {
            "x": 560,
            "y": 141
        },
        "isOnline": True,
        "energyConsumption": 871,
        "efficiency": 89,
        "process": "Bending - Brackets"
    },
    {
        "id": "GRIND-4",
        "type": "Surface_Grinder",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 3530,
            "temp": 61,
            "vibration": 0.08
        },
        "location": {
            "x": 168,
            "y": 194
        },
        "isOnline": True,
        "energyConsumption": 372,
        "efficiency": 94,
        "process": "Polishing - Optical Components"
    },
    {
        "id": "CONV-6",
        "type": "Conveyor_Belt",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 1.0,
            "temp": 36,
            "motor_load": 5.7
        },
        "location": {
            "x": 807,
            "y": 466
        },
        "isOnline": True,
        "energyConsumption": 164,
        "efficiency": 96,
        "process": "Parts Transfer - Sub-assembly"
    },
    {
        "id": "QC-4",
        "type": "Inspection_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "precision": 0.003,
            "temp": 24,
            "humidity": 45
        },
        "location": {
            "x": 582,
            "y": 490
        },
        "isOnline": True,
        "energyConsumption": 161,
        "efficiency": 99,
        "process": "Optical CMM - Castings"
    },
    {
        "id": "LATHE-6",
        "type": "Lathe",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 1541,
            "temp": 68,
            "current": 16.3
        },
        "location": {
            "x": 66,
            "y": 427
        },
        "isOnline": True,
        "energyConsumption": 612,
        "efficiency": 91,
        "process": "Grooving - Pulleys"
    },
    {
        "id": "WELD-6",
        "type": "Welding_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "voltage": 218,
            "temp": 80,
            "current": 17.5
        },
        "location": {
            "x": 786,
            "y": 435
        },
        "isOnline": True,
        "energyConsumption": 699,
        "efficiency": 90,
        "process": "MIG Welding - Steel Frames"
    },
    {
        "id": "CNC-8",
        "type": "CNC_Mill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 110,
            "temp": 71,
            "current": 11.4
        },
        "location": {
            "x": 234,
            "y": 281
        },
        "isOnline": True,
        "energyConsumption": 458,
        "efficiency": 90,
        "process": "Pocketing - Molds"
    },
    {
        "id": "ARM-8",
        "type": "Robot_Arm",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "vibration": 0.22,
            "temp": 64,
            "current": 8.7
        },
        "location": {
            "x": 583,
            "y": 286
        },
        "isOnline": True,
        "energyConsumption": 361,
        "efficiency": 93,
        "process": "Painting - Car Bodies"
    },
    {
        "id": "ARM-9",
        "type": "Robot_Arm",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "vibration": 0.23,
            "temp": 56,
            "current": 8.8
        },
        "location": {
            "x": 932,
            "y": 236
        },
        "isOnline": True,
        "energyConsumption": 357,
        "efficiency": 94,
        "process": "Painting - Car Bodies"
    },
    {
        "id": "PACK-5",
        "type": "Packaging_Unit",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 21,
            "temp": 30,
            "pressure": 93
        },
        "location": {
            "x": 395,
            "y": 506
        },
        "isOnline": True,
        "energyConsumption": 230,
        "efficiency": 94,
        "process": "Automated Labeling"
    },
    {
        "id": "PRESS-7",
        "type": "Hydraulic_Press",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 2548,
            "temp": 68,
            "hydraulic_flow": 46.2
        },
        "location": {
            "x": 257,
            "y": 329
        },
        "isOnline": True,
        "energyConsumption": 879,
        "efficiency": 87,
        "process": "Forging - Connecting Rods"
    },
    {
        "id": "WELD-7",
        "type": "Welding_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "voltage": 224,
            "temp": 95,
            "current": 18.2
        },
        "location": {
            "x": 579,
            "y": 253
        },
        "isOnline": True,
        "energyConsumption": 718,
        "efficiency": 89,
        "process": "Spot Welding - Panels"
    },
    {
        "id": "GRIND-5",
        "type": "Surface_Grinder",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 3762,
            "temp": 60,
            "vibration": 0.08
        },
        "location": {
            "x": 65,
            "y": 232
        },
        "isOnline": True,
        "energyConsumption": 412,
        "efficiency": 93,
        "process": "Polishing - Optical Components"
    },
    {
        "id": "DRILL-6",
        "type": "Drill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "torque": 26,
            "temp": 59,
            "current": 6.8
        },
        "location": {
            "x": 481,
            "y": 546
        },
        "isOnline": True,
        "energyConsumption": 231,
        "efficiency": 97,
        "process": "Counterboring - Flanges"
    },
    {
        "id": "QC-5",
        "type": "Inspection_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "precision": 0.005,
            "temp": 21,
            "humidity": 44
        },
        "location": {
            "x": 863,
            "y": 483
        },
        "isOnline": True,
        "energyConsumption": 169,
        "efficiency": 98,
        "process": "Optical CMM - Castings"
    },
    {
        "id": "PACK-6",
        "type": "Packaging_Unit",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 22,
            "temp": 26,
            "pressure": 98
        },
        "location": {
            "x": 573,
            "y": 240
        },
        "isOnline": True,
        "energyConsumption": 230,
        "efficiency": 96,
        "process": "Box Sealing"
    },
    {
        "id": "CNC-9",
        "type": "CNC_Mill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 113,
            "temp": 82,
            "current": 13.0
        },
        "location": {
            "x": 930,
            "y": 128
        },
        "isOnline": True,
        "energyConsumption": 460,
        "efficiency": 96,
        "process": "Pocketing - Molds"
    },
    {
        "id": "CONV-7",
        "type": "Conveyor_Belt",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 1.2,
            "temp": 38,
            "motor_load": 5.0
        },
        "location": {
            "x": 403,
            "y": 402
        },
        "isOnline": True,
        "energyConsumption": 197,
        "efficiency": 95,
        "process": "Waste Removal"
    },
    {
        "id": "PRESS-8",
        "type": "Hydraulic_Press",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 2432,
            "temp": 71,
            "hydraulic_flow": 47.9
        },
        "location": {
            "x": 620,
            "y": 286
        },
        "isOnline": True,
        "energyConsumption": 878,
        "efficiency": 89,
        "process": "Bending - Brackets"
    },
    {
        "id": "LATHE-7",
        "type": "Lathe",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 1410,
            "temp": 74,
            "current": 15.6
        },
        "location": {
            "x": 609,
            "y": 141
        },
        "isOnline": True,
        "energyConsumption": 579,
        "efficiency": 94,
        "process": "Facing - Flywheels"
    },
    {
        "id": "DRILL-7",
        "type": "Drill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "torque": 27,
            "temp": 56,
            "current": 6.8
        },
        "location": {
            "x": 776,
            "y": 143
        },
        "isOnline": True,
        "energyConsumption": 260,
        "efficiency": 95,
        "process": "Hole Boring - Gearboxes"
    },
    {
        "id": "CONV-8",
        "type": "Conveyor_Belt",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 1.4,
            "temp": 32,
            "motor_load": 5.4
        },
        "location": {
            "x": 191,
            "y": 283
        },
        "isOnline": True,
        "energyConsumption": 182,
        "efficiency": 95,
        "process": "Parts Transfer - Sub-assembly"
    },
    {
        "id": "WELD-8",
        "type": "Welding_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "voltage": 229,
            "temp": 82,
            "current": 18.7
        },
        "location": {
            "x": 587,
            "y": 285
        },
        "isOnline": True,
        "energyConsumption": 673,
        "efficiency": 87,
        "process": "MIG Welding - Steel Frames"
    },
    {
        "id": "GRIND-6",
        "type": "Surface_Grinder",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 3236,
            "temp": 61,
            "vibration": 0.09
        },
        "location": {
            "x": 757,
            "y": 425
        },
        "isOnline": True,
        "energyConsumption": 361,
        "efficiency": 92,
        "process": "Flat Grinding - Plates"
    },
    {
        "id": "QC-6",
        "type": "Inspection_Station",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "precision": 0.003,
            "temp": 24,
            "humidity": 48
        },
        "location": {
            "x": 139,
            "y": 193
        },
        "isOnline": True,
        "energyConsumption": 169,
        "efficiency": 99,
        "process": "Laser Scanning - 3D Models"
    },
    {
        "id": "PRESS-9",
        "type": "Hydraulic_Press",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 2575,
            "temp": 71,
            "hydraulic_flow": 42.1
        },
        "location": {
            "x": 487,
            "y": 444
        },
        "isOnline": True,
        "energyConsumption": 878,
        "efficiency": 88,
        "process": "Coining - Medallions"
    },
    {
        "id": "LATHE-8",
        "type": "Lathe",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "rpm": 1494,
            "temp": 70,
            "current": 16.0
        },
        "location": {
            "x": 701,
            "y": 167
        },
        "isOnline": True,
        "energyConsumption": 618,
        "efficiency": 89,
        "process": "Grooving - Pulleys"
    },
    {
        "id": "PACK-7",
        "type": "Packaging_Unit",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "speed": 21,
            "temp": 32,
            "pressure": 105
        },
        "location": {
            "x": 744,
            "y": 472
        },
        "isOnline": True,
        "energyConsumption": 235,
        "efficiency": 93,
        "process": "Automated Labeling"
    },
    {
        "id": "CNC-10",
        "type": "CNC_Mill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "pressure": 136,
            "temp": 75,
            "current": 11.0
        },
        "location": {
            "x": 717,
            "y": 202
        },
        "isOnline": True,
        "energyConsumption": 454,
        "efficiency": 93,
        "process": "Drilling Cycle - Manifolds"
    },
    {
        "id": "ARM-10",
        "type": "Robot_Arm",
        "status": "ERROR",
        "anomaly_count": 3,
        "sensors": {
            "vibration": 0.23,
            "temp": 56,
            "current": 8.7
        },
        "location": {
            "x": 743,
            "y": 296
        },
        "isOnline": True,
        "energyConsumption": 305,
        "efficiency": 93,
        "process": "Welding Support"
    },
    {
        "id": "DRILL-8",
        "type": "Drill",
        "status": "NORMAL",
        "anomaly_count": 0,
        "sensors": {
            "torque": 26,
            "temp": 57,
            "current": 6.8
        },
        "location": {
            "x": 427,
            "y": 361
        },
        "isOnline": True,
        "energyConsumption": 242,
        "efficiency": 95,
        "process": "Hole Boring - Gearboxes"
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