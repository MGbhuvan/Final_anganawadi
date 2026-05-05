import sys
import os
from datetime import datetime, timedelta

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.services import ration_service
from app.db import execute

def bulk_update():
    start_date = datetime(2026, 4, 1)
    end_date = datetime(2026, 4, 19)
    
    current_date = start_date
    total_distributed_days = 0
    
    print(f"Starting bulk distribution from {start_date.date()} to {end_date.date()}...")
    
    while current_date <= end_date:
        date_str = current_date.strftime("%Y-%m-%d")
        try:
            print(f"Processing {date_str}...")
            result = ration_service.auto_distribute_students({"date": date_str})
            print(f"  Result: {result['message']}")
            total_distributed_days += 1
        except Exception as e:
            # If AppError "No students marked Present", we just skip it (e.g. Sundays/Holidays)
            if "No students marked Present" in str(e):
                print(f"  Skipping {date_str}: No attendance records found.")
            else:
                print(f"  Error on {date_str}: {e}")
        
        current_date += timedelta(days=1)
    
    print(f"\nBulk update completed. Successfully processed {total_distributed_days} days.")

if __name__ == "__main__":
    bulk_update()
