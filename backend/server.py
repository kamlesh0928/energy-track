from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from pymongo import MongoClient
import json
from bson import json_util
import config

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Database Connection
client = MongoClient(config.MONGO_URI)
db = client[config.MONGO_DB]
collection = db[config.MONGO_COLLECTION]

@app.route('/api/devices', methods=["GET"])
def get_devices():
    try:
        devices = list(collection.find())
        return json.loads(json_util.dumps(devices))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/restart', methods=['POST'])
def restart_devices():
    device_id = request.json.get('deviceId')
    if not device_id:
        return jsonify({"status": "error", "message": "Device ID is required."}), 400
    
    print(f"Server: Received restart command for {device_id}")
    # In a real scenario, you might publish a Kafka command here
    return jsonify({"status": "success", "message": f"Device {device_id} restart initiated."})

@app.route('/api/shutdown', methods=['POST'])
def shutdown_devices():
    device_id = request.json.get('deviceId')
    if not device_id:
        return jsonify({"status": "error", "message": "Device ID is required."}), 400

    print(f"Server: Received shutdown command for {device_id}")
    return jsonify({"status": "success", "message": f"Device {device_id} shutdown initiated."})

# --- WebSocket Events ---
@socketio.on('connect')
def handle_connect():
    # print('Server: Client connected to WebSocket')
    pass

@socketio.on('device_update')
def handle_device_update(data):
    """
    Allow internal services (like consumer) to broadcast via socket.io
    """
    socketio.emit('device_update', data)

def run_server():
    print(f"Starting Flask Server on port {config.PORT}...")
    socketio.run(app, host=config.HOST, port=config.PORT, debug=False, use_reloader=False)

if __name__ == "__main__":
    run_server()