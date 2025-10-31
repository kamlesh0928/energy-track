# Energy Track

This​‍​‌‍​‍‌​‍​‌‍​‍‌ project presents a smart factory IoT monitoring system that achieves energy efficiency, predicts equipment failures, and guarantees safety in operations. 
It emulates a massive industrial IoT device network, fetches the live data using Kafka, applies machine learning analytics, and presents the results on a dashboard.

The setup is a combination of simulated IoT devices, data stream, ML-driven insights, and real-time visualization to allow factory or manufacturing plant 
energy-efficient operations and predictive ​‍​‌‍​‍‌​‍​‌‍​‍‌maintenance.

---

## Project Overview

The​‍​‌‍​‍‌​‍​‌‍​‍‌ project is a simulation of a large number of virtual IoT devices that include CNC machines, robotic arms, presses, drills, and conveyor belts. 
Each device perpetually produces sensor data such as temperature, pressure, and current consumption.

The data is a real-time stream by Apache Kafka, is kept in MongoDB, is analyzed by machine learning models, and is shown on a dashboard through 
Flask APIs and WebSocket connections.

Such an end-to-end system makes it possible to keep track of the performance of the devices, forecasting malfunctions, and create smart suggestions for 
enhancing energy efficiency and ensuring safety in ​‍​‌‍​‍‌​‍​‌‍​‍‌operations. 

---

## Key Features

- **IoT Device Simulation:** Simulates hundreds of factory devices sending continuous sensor data.
- **Data Streaming Pipeline:** Uses Apache Kafka for efficient real-time message handling and scalability.
- **MongoDB Storage:** Keeps device metrics and also sensor data that are fetched from the devices for monitoring and retraining purposes. 
- **Machine Learning Insights:** Uses a trained Random Forest model to anticipate the occurrence of failures. 
- **Optimization Recommendations:** Provides the list of actions that will result in the decrease of power consumption as well as the improvement of energy efficiency. 
- **Control Layer Simulation:** A device restart and shutdown that is remote is enabled through Flask endpoints.
- **Dashboard:** Provides live visualization of metrics and system health.
- **Dockerized Deployment:** Simplifies setup and scaling through Docker Compose.

---

## Architecture Components

### 1. Data Simulation (Producer)
Simulates real-time sensor data for over 100 factory devices.  
Publishes readings such as temperature, pressure, and current consumption to a Kafka topic named `factory-sensor-data`.

### 2. Kafka Stream Processing
Acts as the real-time data backbone, handling sensor data streams between producers and consumers.  
Two Kafka topics are used:
- `factory-sensor-data`: Raw sensor readings from simulated devices.  
- `ml-insights`: ML-generated insights and failure predictions.

### 3. Machine Learning Service
A Random Forest model trained on synthetic and historical sensor data predicts device failure probabilities.  
It also generates optimization suggestions, such as:
- “High failure risk: Inspect machine within 24 hours.”  
- “High idle energy usage: Consider scheduled shutdown.”

The ML model continuously improves by retraining on historical data stored in MongoDB.

### 4. MongoDB Database
Stores all device states, sensor readings, and ML insights.  
Historical records are used for retraining and pattern analysis.

### 5. Flask API and WebSocket Server
Exposes REST APIs and WebSocket endpoints for real-time monitoring and control.  
Endpoints include:
- `/api/devices` – Fetch all registered devices.  
- `/api/restart` – Simulate a device restart command.  
- `/api/shutdown` – Simulate a device shutdown command.  

The server streams live updates to the frontend dashboard using WebSocket events.

### 6. Frontend Dashboard
Provides a web-based visualization of energy consumption, device status, and failure predictions.  
Built using React or Grafana, it displays metrics and enables remote control simulation.

---

## Machine Learning Pipeline

- **Model Type:** Random Forest Classifier  
- **Training Data:** Synthetic data generated to simulate factory sensor degradation and anomalies.  
- **Target Variable:** Binary classification predicting equipment failure (0 = Normal, 1 = Failure).  
- **Training File:** `train_model.py`  
- **Prediction File:** `ml_consumer.py`  

### Workflow
1. The `train_model.py` script generates synthetic data or fetches real device data from MongoDB.  
2. The model is trained to detect early failure indicators.  
3. The trained model (`failure_model.pkl`) is loaded by `ml_consumer.py` for real-time predictions.  
4. Predicted insights and recommendations are published back to Kafka.

---

## Technology Stack

| Component | Technology |
|------------|-------------|
| **Programming Language** | Python |
| **Streaming Framework** | Apache Kafka |
| **Database** | MongoDB |
| **Backend Framework** | Flask, Flask-SocketIO, Flask-CORS |
| **Machine Learning** | Scikit-learn, Pandas, NumPy, Joblib |
| **Frontend** | React.js / Grafana |
| **Containerization** | Docker, Docker Compose |
| **Data Transport Format** | JSON over Kafka Topics |

