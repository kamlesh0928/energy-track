import multiprocessing
import time
import os
import sys
from server import run_server
from producer import run_producer
from consumer import run_consumer
from ml_consumer import run_ml_service

def start_process(target, name):
    p = multiprocessing.Process(target=target, name=name)
    p.start()
    return p

if __name__ == "__main__":
    print("Initializing services...")

    server_process = start_process(run_server, "Flask Server")
    time.sleep(3)

    producer_process = start_process(run_producer, "Data Producer")
    consumer_process = start_process(run_consumer, "Data Consumer")
    ml_process = start_process(run_ml_service, "ML Service")

    print(f"\nSystem Running. API available at http://localhost:5001")

    processes = [server_process, producer_process, consumer_process, ml_process]

    try:
        while True:
            time.sleep(1)
            if not server_process.is_alive():
                print("Server process died. Exiting...")
                break
    except KeyboardInterrupt:
        print("\nStopping all services...")
        for p in processes:
            p.terminate()
            p.join()
        print("System Shutdown Complete.")