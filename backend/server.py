from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from pymongo import MongoClient
import json
from bson import json_util

MONGO_URI = 'mongodb://localhost:27017/'
MONGO_DB = 'factory_dashboard'
MONGO_COLLECTION = 'devices'

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

client = MongoClient(MONGO_URI)
db = client[MONGO_DB]
collection = db[MONGO_COLLECTION]

# --- API Routes ---
@app.route('/api/devices', methods=["GET"])
def get_devices():
    devices = list(collection.find())
    print(f"Fetched {len(devices)} devices from database.")
    return json.loads(json_util.dumps(devices))

@app.route('/api/restart', methods=['POST'])
def restart_devices():
    device_id = request.json.get('deviceId')
    if not device_id:
        return jsonify({"status": "error", "message": "Device ID is required."}), 400
    
    print(f"Restarting device {device_id}...")
    return jsonify({"status": "success", "message": f"Device {device_id} restart command sent."})

@app.route('/api/shutdown', methods=['POST'])
def shutdown_devices():
    device_id = request.json.get('deviceId')
    if not device_id:
        return jsonify({"status": "error", "message": "Device ID is required."}), 400

    print(f"Shutting down device {device_id}...")
    return jsonify({"status": "success", "message": f"Device {device_id} shutdown command sent."})

# --- WebSocket Events ---
@socketio.on('connect')
def handle_connect():
    print('Client connected to WebSocket')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == "__main__":
    print("Starting Web API and WebSocket server on http://localhost:5001")
    socketio.run(app, host='0.0.0.0', port=5001)
