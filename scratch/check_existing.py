import sys
import os
from datetime import datetime, timedelta

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.db import fetch_all

def check_existing():
    start_date = "2026-04-01"
    end_date = "2026-04-19"
    
    print(f"Checking existing distributions from {start_date} to {end_date}...")
    
    existing = fetch_all("""
        SELECT distribution_date, COUNT(*) as count 
        FROM ration_distribution_students 
        WHERE distribution_date BETWEEN %s AND %s
        GROUP BY distribution_date
        ORDER BY distribution_date
    """, (start_date, end_date))
    
    if not existing:
        print("No existing distributions found in this range.")
    for row in existing:
        print(f"Date: {row['distribution_date']}, Distributions: {row['count']}")

if __name__ == "__main__":
    check_existing()
