import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import pymongo
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = pymongo.MongoClient(MONGO_URI)
db = client['userDB']
collection = db['sensorData']

def generate_random_data(n_samples=10):
    now = datetime.now()
    data = []

    for i in range(n_samples):
        timestamp = now - timedelta(minutes=i)
        record = {
            'timestamp': timestamp,
            'temperature': np.random.uniform(20.0, 25.0),
            'humidity': np.random.uniform(30.0, 50.0),
            'pressure': np.random.uniform(1000.0, 1020.0),
            'device_id': f'SENSOR_{np.random.randint(1, 5)}',
            'location': np.random.choice(['Room1', 'Room2', 'Room3', 'Room4']),
        }
        data.append(record)

    return data

def insert_data_to_mongodb(data):
    try:
        result = collection.insert_many(data)
        print(f"Inserted {len(result.inserted_ids)} records into MongoDB.")
    except Exception as e:
        print(f"An error occurred: {e}")

def main():
    print("Generating random sensor data...")
    data = generate_random_data()

    print("Inserting data into MongoDB...")
    insert_data_to_mongodb(data)

if __name__ == "__main__":
    main()