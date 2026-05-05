import sys
import os
from datetime import datetime, timedelta

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.db import fetch_all, fetch_one

def check_status():
    start_date = "2026-04-01"
    end_date = "2026-04-19"
    
    print(f"Checking attendance from {start_date} to {end_date}...")
    
    # Check attendance per day
    attendance_stats = fetch_all("""
        SELECT date, COUNT(*) as count 
        FROM attendance 
        WHERE date BETWEEN %s AND %s AND status = 'Present'
        GROUP BY date
        ORDER BY date
    """, (start_date, end_date))
    
    if not attendance_stats:
        print("No 'Present' attendance records found in this range.")
    for row in attendance_stats:
        print(f"Date: {row['date']}, Present Students: {row['count']}")

    print("\nCurrent Ration Inventory:")
    inventory = fetch_all("""
        SELECT i.item_name, inv.total_stock, i.unit
        FROM ration_inventory inv
        JOIN ration_items i ON inv.item_id = i.id
    """)
    for item in inventory:
        print(f"{item['item_name']}: {item['total_stock']} {item['unit']}")

if __name__ == "__main__":
    check_status()
