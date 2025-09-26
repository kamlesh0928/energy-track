from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import pika
import json

app = Flask(__name__)
CORS(app)

DATABASE_PATH = "../ml-engine/data.db"

def get_db_connect():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    return connection

@app.route("/state", methods=["GET"])
def get_state():

    try:
        connection = get_db_connect()
        devices = connection.execute("SELECT * FROM devices").fetchall()
        personnel = connection.execute("SELECT * FROM personnel").fetchall()
        connection.close()

        devices_list = [dict(row) for row in devices]
        for device in devices_list:
            device["sensors"] = json.loads(device.get("sensors", "{}"))
            device["location"] = json.loads(device.get("location", "{}"))
            device["last_anomaly"] = json.loads(device.get("last_anomaly", "{}"))
        
        personnel_list = [dict(row) for row in personnel]
        for person in personnel_list:
            person["location"] = json.loads(person.get("location", "{}"))

        return jsonify({
            "devices": devices_list,
            "personnel": personnel_list
        }), 200
    except Exception as e:
        print("Error in get_state:", e)
        return jsonify({
            "error": "Internal server error"    
        }), 500

@app.route("/control", methods=["POST"])
def control_device():

    try:
        data = request.get_json()
        device_id = data.get("device_id")
        command = data.get("command")

        if not device_id or not command:
            return jsonify({"error": "device_id or command not provided"}), 400

        connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
        channel = connection.channel()
        channel.exchange_declare(exchange="device_control", exchange_type="topic")

        routing_key = f"device.{device_id}.control"
        channel.basic_publish(
            exchange="device_control", 
            routing_key=routing_key, 
            body=json.dumps({"command": command})
        )
        
        connection.close()

        return jsonify({
            "status": "Command sent to " + device_id
        }), 200
    except Exception as e:
        print("Error in control_device:", e)
        return jsonify({
            "error": "Internal server error"
        }), 500

app.run(host="0.0.0.0", port=5000)
