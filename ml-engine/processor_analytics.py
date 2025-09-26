import pika
import json
import sqlite3
import requests

DATABASE_PATH = "data.db"
OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3:8b"

MACHINE_PROFILES = {
    "CNC_Mill": {"temp": (20, 90), "pressure": (280, 320), "current": (10, 25)},
    "Laser_Cutter": {"temp": (25, 100), "pressure": (50, 80), "current": (5, 15)},
    "Robot_Arm": {"temp": (30, 70), "vibration": (0, 0.5), "current": (8, 20)},
    "Furnace": {"temp": (400, 1200), "pressure": (100, 150), "current": (30, 60)}
}
ANOMALY_THRESHOLD = 3

def setup_database():

    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            device_id TEXT PRIMARY KEY,
            status TEXT,
            anomaly_count INTEGER,
            last_seen TEXT,
            location TEXT,
            sensors TEXT,
            last_anomaly TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS personnel (
            worker_id TEXT PRIMARY KEY,
            location TEXT,
            last_seen TEXT
        )
    ''')
    connection.commit()
    connection.close()
    print("Database initialized.")

def get_llm_explanation(device_type, anomaly_details):

    sensor_info = ", ".join([f"'{sensor}' reading is {details['value']} (normal range: {details['range']})" for sensor, details in anomaly_details.items()])
    
    prompt = f"""
    You are an expert industrial maintenance engineer. An anomaly has been detected on a '{device_type}'.
    The anomalous sensor data is: {sensor_info}.

    Analyze this data and provide a concise root cause analysis and a recommended action for the operator.
    Format your response as a single, valid JSON object with two keys: "analysis" and "recommendation".
    Example: {{"analysis": "High vibration suggests advanced bearing wear.", "recommendation": "Schedule maintenance to replace bearing within 48 hours."}}
    """
    
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "format": "json",
            "stream": False
        }
        response = requests.post(OLLAMA_API_URL, json=payload, timeout=20)
        response.raise_for_status()
        
        response_json = response.json()
        explanation_json = json.loads(response_json.get('response', '{}'))
        
        return explanation_json.get("analysis", "Analysis unavailable."), explanation_json.get("recommendation", "General inspection recommended.")

    except (requests.RequestException, json.JSONDecodeError) as e:
        print(f"Error querying Ollama: {e}")
        return "AI analysis could not be performed.", "Check machine manually."

def process_device_data(data):

    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()
    
    device_id = data["device_id"]
    device_type = device_id.split('-')
    
    cursor.execute("SELECT status, anomaly_count FROM devices WHERE device_id =?", (device_id,))
    result = cursor.fetchone()
    
    status = result if result else "ORMAL"
    anomaly_count = result if result else 0

    is_anomaly = False
    anomaly_details = {}
    profile = MACHINE_PROFILES.get(device_type, {})
    
    for sensor, value in data["sensor"].items():
        if sensor in profile:
            min_val, max_val = profile[sensor]
            if not (min_val <= value <= max_val):
                is_anomaly = True
                anomaly_details[sensor] = {"value": value, "range": f"{min_val}-{max_val}"}

    last_anomaly_payload = {}
    if is_anomaly:
        anomaly_count += 1
        status = 'WARNING'
        analysis, recommendation = get_llm_explanation(device_type, anomaly_details)
        last_anomaly_payload = {
            "timestamp": data["timestam"],
            "details": anomaly_details,
            "analysis": analysis,
            "recommendation": recommendation
        }
    else:
        anomaly_count = 0
        status = "NORMAL"

    if anomaly_count >= ANOMALY_THRESHOLD:
        status = "CRITICAL"

    cursor.execute('''
        INSERT OR REPLACE INTO devices (device_id, status, anomaly_count, last_seen, location, sensors, last_anomaly)
        VALUES (?,?,?,?,?,?,?)
    ''', (
        device_id, status, anomaly_count, data["timestamp"],
        json.dumps(data["location"]), json.dumps(data["sensors"]), json.dumps(last_anomaly_payload)
    ))
    connection.commit()
    connection.close()

def process_personnel_data(data):

    connection = sqlite3.connect(DATABASE_PATH)
    cursor = connection.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO personnel (worker_id, location, last_seen)
        VALUES (?,?,?)
    ''', (data["worker_id"], json.dumps(data["location"]), data["timestamp"]))
    connection.commit()
    connection.close()

def callback(ch, method, properties, body):

    try:
        data = json.loads(body)
        routing_key = method.routing_key
        
        if routing_key.startswith("sensors."):
            process_device_data(data)
            print(f" [x] Processed device data for {data["device_id"]}")
        elif routing_key.startswith("personnel."):
            process_personnel_data(data)
            print(f" [x] Processed personnel data for {data["worker_id"]}")
            
    except json.JSONDecodeError:
        print(" [!] Received a malformed message.")
    except Exception as e:
        print(f" [!] Error in callback: {e}")
    
    ch.basic_ack(delivery_tag=method.delivery_tag)

def main():
    setup_database()
    connection = pika.BlockingConnection(pika.ConnectionParameters(host="localhost"))
    channel = connection.channel()

    channel.exchange_declare(exchange="factory_data", exchange_type="topic")
    result = channel.queue_declare('', exclusive=True)
    queue_name = result.method.queue

    # Bind to both sensor and personnel data topics
    channel.queue_bind(exchange="factory_data", queue=queue_name, routing_key="sensors.#")
    channel.queue_bind(exchange="factory_data", queue=queue_name, routing_key="personnel.#")

    print(" [*] Waiting for messages. To exit press CTRL+C")
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=queue_name, on_message_callback=callback)
    channel.start_consuming()

main()