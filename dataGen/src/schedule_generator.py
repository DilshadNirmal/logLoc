import schedule
import time
from generate_data import main as generate_data

def job():
    print(f"Running data generation job at {time.strftime('%Y-%m-%d %H:%M:%S')}")
    generate_data()

schedule.every(1).minutes.do(job)

job()

while True:
    schedule.run_pending()
    time.sleep(1)